import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DocumentJenis } from "@/types/database.types";
import { requireRole, ServiceError } from "./access.service";
import type {
  Project,
  ProjectStatus,
  DocumentStatus,
  ContractStatus,
  TeamMember,
  Payment,
  Contract,
} from "@/types/proyek";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function validateBudget(
  budgetInput: number | string | undefined | null,
  minCost: number,
): { valid: boolean; error?: string } {
  if (budgetInput === undefined || budgetInput === null || budgetInput === "") {
    return { valid: false, error: "Budget proyek wajib diisi." };
  }

  const budget = Number(budgetInput);
  if (isNaN(budget) || budget <= 0) {
    return { valid: false, error: "Budget proyek harus berupa angka valid." };
  }

  if (budget < minCost) {
    const formattedCost = `Rp ${(minCost / 1000000).toLocaleString("id-ID")} juta`;
    return {
      valid: false,
      error: `Budget proyek tidak boleh kurang dari estimasi biaya desain (${formattedCost}).`,
    };
  }

  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  const baseName = name.replace(/^.*[\\/]/, "");
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getAndValidateExtension(
  fileName: string,
  mimeType: string,
): string | null {
  const allowedMap: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "application/pdf": ["pdf"],
  };

  const allowedExts = allowedMap[mimeType];
  if (!allowedExts) return null;

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext || !allowedExts.includes(ext)) return null;

  return ext;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file melebihi 2MB.";
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Format file harus JPG, PNG, atau PDF.";
  }

  const ext = getAndValidateExtension(file.name, file.type);
  if (!ext) {
    return "Format file harus JPG, PNG, atau PDF.";
  }

  return null;
}

export async function createProjectWithDocuments(
  supabase: SupabaseClient<Database>,
  formData: FormData,
): Promise<{ projectId: string; status: string }> {
  // 1. Auth & Role Check
  const { user } = await requireRole(supabase, "customer");

  const designSlug = formData.get("designSlug") as string;
  const alamat = (formData.get("alamat") as string) || "";
  const budgetRaw = formData.get("budget");

  const documentTypes: Array<{
    key: DocumentJenis;
    title: string;
    required: boolean;
  }> = [
    {
      key: "sertifikat_tanah",
      title: "Sertifikat Tanah (SHM/HGB)",
      required: true,
    },
    { key: "ktp_pemilik", title: "KTP Pemilik", required: true },
    { key: "imb_pbg", title: "IMB/PBG", required: true },
    { key: "surat_kuasa", title: "Surat Kuasa (Jika Ada)", required: false },
  ];

  // 2. Cari desain via designs.slug
  if (!designSlug) {
    throw new ServiceError("Desain rumah tidak ditentukan.", 400);
  }

  const { data: design, error: designErr } = await supabase
    .from("designs")
    .select("id, nama, estimasi_biaya, is_active")
    .eq("slug", designSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (designErr || !design) {
    throw new ServiceError("Desain rumah tidak ditemukan.", 404);
  }

  // 3. Validasi Server-Side
  const validationErrors: Record<string, string> = {};

  if (!alamat.trim()) {
    validationErrors["alamat"] = "Alamat lengkap proyek wajib diisi.";
  }

  const budgetValidation = validateBudget(
    budgetRaw ? String(budgetRaw) : undefined,
    Number(design.estimasi_biaya),
  );
  if (!budgetValidation.valid && budgetValidation.error) {
    validationErrors["budget"] = budgetValidation.error;
  }

  const filesToProcess: Array<{
    key: DocumentJenis;
    title: string;
    file: File;
    ext: string;
  }> = [];

  for (const docDef of documentTypes) {
    const file = formData.get(docDef.key) as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      if (docDef.required) {
        validationErrors[docDef.key] = `${docDef.title} wajib diisi.`;
      }
      continue;
    }

    const fileError = validateFile(file);
    if (fileError) {
      validationErrors[docDef.key] = fileError;
    } else {
      const ext = getAndValidateExtension(file.name, file.type)!;
      filesToProcess.push({ key: docDef.key, title: docDef.title, file, ext });
    }
  }

  if (Object.keys(validationErrors).length > 0) {
    throw new ServiceError("Validasi gagal", 422, { errors: validationErrors });
  }

  // 5. Insert projects (client user): status = 'draft', requirement_id = null
  const budgetNumber = Number(budgetRaw);

  // Debug: pastikan nilai yang dikirim ke DB
  console.log("[project.service] Inserting project:", {
    customer_id: user.id,
    design_id: design.id,
    alamat_proyek: alamat.trim().slice(0, 30),
    budget_proyek: budgetNumber,
    status: "draft",
  });

  const { data: createdProject, error: projectInsertErr } = await supabase
    .from("projects")
    .insert({
      customer_id: user.id,
      design_id: design.id,
      alamat_proyek: alamat.trim(),
      budget_proyek: budgetNumber,
      status: "draft",
    })
    .select("id, status")
    .single();

  if (projectInsertErr || !createdProject) {
    console.error("Gagal membuat draf proyek — error lengkap:", {
      message: projectInsertErr?.message,
      code: projectInsertErr?.code,
      details: projectInsertErr?.details,
      hint: projectInsertErr?.hint,
    });
    const errMsg =
      projectInsertErr?.message ||
      projectInsertErr?.details ||
      "Gagal membuat proyek.";
    throw new ServiceError(errMsg, 500);
  }

  const projectId = createdProject.id;
  const uploadedStoragePaths: string[] = [];

  try {
    // 6. Upload tiap file ke bucket project-documents & insert project_documents
    for (const item of filesToProcess) {
      const sanitizedName = sanitizeFileName(item.file.name);
      const timestamp = Date.now();
      const storagePath = `${projectId}/${item.key}-${timestamp}.${item.ext}`;

      const arrayBuffer = await item.file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      const { error: uploadErr } = await supabase.storage
        .from("project-documents")
        .upload(storagePath, fileBuffer, {
          contentType: item.file.type,
          upsert: true,
        });

      if (uploadErr) {
        console.error(`Gagal upload dokumen ${item.key}:`, uploadErr);
        throw new Error(
          `Gagal upload file ${item.title}: ${uploadErr.message}`,
        );
      }

      uploadedStoragePaths.push(storagePath);

      const { error: docInsertErr } = await supabase
        .from("project_documents")
        .insert({
          project_id: projectId,
          jenis_dokumen: item.key,
          nama_dokumen: sanitizedName,
          url: storagePath, // Simpan PATH storage, bukan URL publik!
          uploaded_by: user.id,
          ukuran_bytes: item.file.size,
          mime_type: item.file.type,
        });

      if (docInsertErr) {
        console.error(`Gagal simpan meta dokumen ${item.key}:`, docInsertErr);
        throw new Error(`Gagal menyimpan data dokumen ${item.title}.`);
      }
    }

    // 7. Panggil RPC submit_project(pid)
    const { error: rpcErr } = await supabase.rpc("submit_project", {
      pid: projectId,
    });

    if (rpcErr) {
      console.error("Gagal jalankan RPC submit_project:", rpcErr);
      throw new Error(`Gagal memproses pengajuan proyek: ${rpcErr.message}`);
    }

    // 9. Return 201 response
    return {
      projectId,
      status: "menunggu_pengawas",
    };
  } catch (err: unknown) {
    // 8. Rollback jika langkah 6-7 gagal
    console.error("Terjadi error, melakukan rollback proyek draft...", err);

    if (uploadedStoragePaths.length > 0) {
      await supabase.storage
        .from("project-documents")
        .remove(uploadedStoragePaths);
    }

    await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("status", "draft");

    const errMessage =
      err instanceof Error
        ? err.message
        : "Gagal memproses pengajuan pembangunan.";
    throw new ServiceError(errMessage, 500);
  }
}

export async function deleteCancellableProject(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<void> {
  const { user } = await requireRole(supabase, "customer");
  const cancellableStatuses: Database["public"]["Enums"]["project_status"][] = [
    "draft",
    "verifikasi_dokumen",
    "revisi_dokumen",
    "alokasi_mandor_pengawas",
    "finalisasi_kontrak",
  ];

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (projectError || !project) {
    throw new ServiceError("Proyek tidak ditemukan.", 404);
  }
  const projectRow = project as unknown as {
    status: Database["public"]["Enums"]["project_status"];
  };
  if (!cancellableStatuses.includes(projectRow.status)) {
    throw new ServiceError("Proyek tidak dapat dibatalkan pada tahap ini.", 409);
  }

  if (projectRow.status === "finalisasi_kontrak") {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status, signed_customer_at")
      .eq("project_id", projectId)
      .maybeSingle();

    if (contractError) {
      throw new ServiceError("Gagal memeriksa status kontrak proyek.", 500);
    }
    if (
      contract?.signed_customer_at ||
      contract?.status === "aktif" ||
      contract?.status === "selesai"
    ) {
      throw new ServiceError(
        "Proyek tidak dapat dibatalkan setelah kontrak disetujui.",
        409,
      );
    }
  }

  const { data: documents, error: documentsError } = await supabase
    .from("project_documents")
    .select("url")
    .eq("project_id", projectId);

  if (documentsError) {
    throw new ServiceError("Gagal menyiapkan penghapusan dokumen proyek.", 500);
  }

  const storagePaths = ((documents || []) as unknown as Array<{ url: string }>).map(
    (document) => document.url
  );
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("project-documents")
      .remove(storagePaths);
    if (storageError) {
      throw new ServiceError("Gagal menghapus dokumen proyek dari penyimpanan.", 500);
    }
  }

  const { data: deletedProject, error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("customer_id", user.id)
    .in("status", cancellableStatuses)
    .select("id")
    .maybeSingle();

  if (deleteError || !deletedProject) {
    throw new ServiceError("Proyek gagal dihapus. Muat ulang halaman dan coba lagi.", 500);
  }
}

export async function getSignedDocumentUrl(
  supabase: SupabaseClient<Database>,
  documentId: string,
): Promise<string> {
  const { data: doc, error } = await supabase
    .from("project_documents")
    .select("url, project_id")
    .eq("id", documentId)
    .single();

  if (error || !doc) {
    throw new ServiceError("Dokumen tidak ditemukan.", 404);
  }

  const { data: signedData, error: signedErr } = await supabase.storage
    .from("project-documents")
    .createSignedUrl(doc.url, 60); // 60 detik expiry

  if (signedErr || !signedData?.signedUrl) {
    throw new ServiceError("Gagal membuat URL akses dokumen.", 500);
  }

  return signedData.signedUrl;
}

export function transformDBProjectToProject(
  row: Record<string, unknown>,
): Project {
  const design = (row.designs as Record<string, unknown>) || {};
  const images =
    (design.design_images as Array<{ url: string; urutan: number }>) || [];
  const sortedImages = [...images].sort(
    (a, b) => (a.urutan || 0) - (b.urutan || 0),
  );
  const mainImage = sortedImages[0]?.url || "/images/katalog/house-dummy1.webp";

  const dbStatus = (row.status as string) || "draft";
  const statusMap: Record<string, ProjectStatus> = {
    draft: "Verifikasi Dokumen",
    verifikasi_dokumen: "Verifikasi Dokumen",
    revisi_dokumen: "Revisi Dokumen",
    alokasi_mandor_pengawas: "Alokasi Tim",
    finalisasi_kontrak: "Finalisasi Kontrak",
    pembayaran_dp: "Pembayaran DP",
    berjalan: "Proyek Aktif",
    selesai: "Selesai",
    batal: "Dibatalkan",
  };

  const projectStatus: ProjectStatus =
    statusMap[dbStatus] || "Verifikasi Dokumen";

  const docs = Array.isArray(row.project_documents)
    ? (row.project_documents as Array<Record<string, unknown>>)
    : [];
  const hasRevision =
    dbStatus === "revisi_dokumen" ||
    docs.some(
      (d: Record<string, unknown>) =>
        d.review_status === "rejected" || Boolean(d.catatan),
    );
  const isPendingVerification =
    dbStatus === "draft" || dbStatus === "verifikasi_dokumen";
  const documentStatus: DocumentStatus = hasRevision
    ? "revision"
    : isPendingVerification
      ? "pending"
      : "approved";

  const team: TeamMember[] = [];
  if (row.pengawas_profiles) {
    const pengawas = row.pengawas_profiles as Record<string, unknown>;
    const pengawasProfile =
      (pengawas.profiles as Record<string, unknown>) || {};
    team.push({
      id: pengawas.id as string,
      name: (pengawasProfile.nama_lengkap as string) || "Pengawas Proyek",
      role: "Pengawas",
      phone: (pengawasProfile.nomor_telepon as string) || "-",
      experience: `${pengawas.pengalaman_tahun || 0} tahun`,
      projects: (pengawas.jumlah_proyek_selesai as number) || 0,
    });
  }

  if (Array.isArray(row.project_mandors)) {
    for (const item of row.project_mandors as Array<Record<string, unknown>>) {
      const mandor = item.mandor_profiles as
        Record<string, unknown> | undefined;
      if (mandor) {
        const mandorProfile =
          (mandor.profiles as Record<string, unknown>) || {};
        team.push({
          id: mandor.id as string,
          name: (mandorProfile.nama_lengkap as string) || "Mandor Proyek",
          role: "Mandor",
          phone: (mandorProfile.nomor_telepon as string) || "-",
          experience: `${mandor.pengalaman_tahun || 0} tahun`,
          projects: (mandor.jumlah_proyek_selesai as number) || 0,
        });
      }
    }
  }

  const dbContracts = Array.isArray(row.contracts)
    ? (row.contracts as Array<Record<string, unknown>>)[0]
    : (row.contracts as Record<string, unknown> | undefined);
  const contractSpecification = dbContracts?.spesifikasi as
    | Record<string, unknown>
    | undefined;
  const contractCustomer = contractSpecification?.customer as
    | Record<string, unknown>
    | undefined;
  const contractStatusMap: Record<string, ContractStatus> = {
    draft: "menunggu",
    sent: "menunggu",
    menunggu_ttd: "menunggu",
    aktif: "disetujui",
    approved: "disetujui",
    aktif: "disetujui",
    selesai: "disetujui",
    rejected: "ditolak",
    revision: "revisi",
  };

  const contract: Contract = {
    id: (dbContracts?.id as string) || "",
    status: dbContracts
      ? contractStatusMap[dbContracts.status as string] || "menunggu"
      : "belum_tersedia",
    version: (dbContracts?.versi as number) || 1,
    issuedAt: (dbContracts?.created_at as string) || (row.created_at as string),
    deadlineAt: dbContracts?.created_at
      ? new Date(
          new Date(dbContracts.created_at as string).getTime() + 7 * 86400000,
        ).toISOString()
      : new Date(
          new Date(row.created_at as string).getTime() + 7 * 86400000,
        ).toISOString(),
    rejectionReasons: dbContracts?.catatan_revisi
      ? [dbContracts.catatan_revisi as string]
      : undefined,
  };

  const dbPayments = Array.isArray(row.payment_stages)
    ? (row.payment_stages as Array<Record<string, unknown>>)
    : [];
  const sortedPayments = [...dbPayments].sort(
    (a, b) => Number(a.urutan) - Number(b.urutan),
  );
  let nextUnpaidPaymentAvailable = true;
  const payments: Payment[] = sortedPayments.map((p) => {
    const periode = Number(p.urutan);
    const isPaid = p.status === "lunas";
    const isAvailable =
      nextUnpaidPaymentAvailable &&
      ((projectStatus === "Pembayaran DP" && periode === 0) ||
        (projectStatus === "Proyek Aktif" && periode > 0));

    if (!isPaid) {
      nextUnpaidPaymentAvailable = false;
    }

    return {
      stageId: p.id as string,
      periode,
      label: (p.nama_tahap as string) || `Tahap ${p.urutan}`,
      amount: Number(p.nominal || 0),
      dueDate: (p.tanggal_jatuh_tempo as string) || "",
      paidAt: (p.tanggal_bayar as string) || undefined,
      status: isPaid ? "lunas" : isAvailable ? "aktif" : "akan_datang",
    };
  });

  const scope: string[] = dbContracts?.ruang_lingkup
    ? (dbContracts.ruang_lingkup as string).split("\n").filter(Boolean)
    : Array.isArray(design.highlights) &&
        (design.highlights as unknown[]).length > 0
      ? (design.highlights as string[])
      : [
          "Pekerjaan persiapan, penggalian, dan pondasi",
          "Struktur beton bertulang",
          "Dinding bata ringan, plester, dan acian",
          "Rangka atap dan penutup genteng",
          "Instalasi listrik dan plumbing",
          "Finishing lantai dan dinding",
        ];

  return {
    id: row.id as string,
    type: "Bangun Rumah",
    designName: (design.nama as string) || "Desain Rumah",
    location: (design.lokasi as string) || "Jawa Barat",
    image: mainImage,
    style: (design.gaya_arsitektur as string) || "Modern",
    landArea: Number(design.luas_tanah || 0),
    buildingArea: Number(design.luas_bangunan || 0),
    budget: Number(
      dbContracts?.nilai_kontrak ||
        row.budget_proyek ||
        design.estimasi_biaya ||
        0,
    ),
    customerName:
      typeof contractCustomer?.nama === "string"
        ? contractCustomer.nama
        : undefined,
    duration:
      Math.round(((design.estimasi_durasi_hari as number) || 0) / 30) || 8,
    address: (row.alamat_proyek as string) || "Lokasi Belum Ditentukan",
    submittedAt: row.created_at as string,
    status: projectStatus,
    documentStatus,
    adminNote:
      Array.isArray(docs)
        ? (docs as Array<Record<string, unknown>>).find((document) => Boolean(document.catatan))?.catatan as string | undefined
        : undefined,
    team,
    contract,
    payments,
    scope,
  };
}

export async function getUserProjects(
  supabase: SupabaseClient<Database>,
): Promise<Project[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      designs (
        id,
        nama,
        gaya_arsitektur,
        luas_tanah,
        luas_bangunan,
        estimasi_biaya,
        estimasi_durasi_hari,
        lokasi,
        design_images (
          url,
          urutan
        )
      ),
      project_documents (
        id,
        jenis_dokumen,
        nama_dokumen,
        url,
        catatan,
        review_status,
        created_at
      ),
      contracts (
        id,
        ruang_lingkup,
        spesifikasi,
        nilai_kontrak,
        tanggal_mulai,
        tanggal_selesai_estimasi,
        status,
        created_at
      ),
      payment_stages (
        id,
        nama_tahap,
        urutan,
        nominal,
        status,
        tanggal_bayar,
        tanggal_jatuh_tempo
      )
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[getUserProjects] Full query warning:", error?.message);
    const fallbackRes = await supabase
      .from("projects")
      .select(
        `
        *,
        designs (
          id,
          nama,
          gaya_arsitektur,
          luas_tanah,
          luas_bangunan,
          estimasi_biaya,
          estimasi_durasi_hari,
          lokasi,
          design_images (
            url,
            urutan
          )
        ),
        project_documents (
          id,
          jenis_dokumen,
          nama_dokumen,
          url,
          catatan,
          review_status,
          created_at
        ),
        contracts (
          id,
          ruang_lingkup,
          spesifikasi,
          nilai_kontrak,
          tanggal_mulai,
          tanggal_selesai_estimasi,
          status,
          created_at
        ),
        payment_stages (
          id,
          nama_tahap,
          urutan,
          nominal,
          status,
          tanggal_bayar,
          tanggal_jatuh_tempo
        )
      `,
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    // Jalur cadangan memilih kolom lebih ringan (tanpa contracts/payment_stages);
    // transformator menganggapnya opsional.
    data = fallbackRes.data as typeof data;
    error = fallbackRes.error;
  }

  if (error || !data) {
    if (error) {
      console.error(
        "[getUserProjects] Error details:",
        JSON.stringify(error, null, 2),
      );
    }
    return [];
  }

  return data.map((row: Record<string, unknown>) =>
    transformDBProjectToProject(row),
  );
}

export async function getUserProjectById(
  supabase: SupabaseClient<Database>,
  projectId: string,
): Promise<Project | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      designs (
        id,
        nama,
        gaya_arsitektur,
        luas_tanah,
        luas_bangunan,
        estimasi_biaya,
        estimasi_durasi_hari,
        lokasi,
        design_images (
          url,
          urutan
        )
      ),
      project_documents (
        id,
        jenis_dokumen,
        nama_dokumen,
        url,
        catatan,
        review_status,
        created_at
      ),
      contracts (
        id,
        ruang_lingkup,
        spesifikasi,
        nilai_kontrak,
        tanggal_mulai,
        tanggal_selesai_estimasi,
        status,
        created_at
      ),
      payment_stages (
        id,
        nama_tahap,
        urutan,
        nominal,
        status,
        tanggal_bayar,
        tanggal_jatuh_tempo
      )
    `,
    )
    .eq("id", projectId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[getUserProjectById] Full query warning:", error?.message);
    const fallbackRes = await supabase
      .from("projects")
      .select(
        `
        *,
        designs (
          id,
          nama,
          gaya_arsitektur,
          luas_tanah,
          luas_bangunan,
          estimasi_biaya,
          estimasi_durasi_hari,
          lokasi,
          design_images (
            url,
            urutan
          )
        ),
        project_documents (
          id,
          jenis_dokumen,
          nama_dokumen,
          url,
          catatan,
          review_status,
          created_at
        ),
        contracts (
          id,
          ruang_lingkup,
          spesifikasi,
          nilai_kontrak,
          tanggal_mulai,
          tanggal_selesai_estimasi,
          status,
          created_at
        ),
        payment_stages (
          id,
          nama_tahap,
          urutan,
          nominal,
          status,
          tanggal_bayar,
          tanggal_jatuh_tempo
        )
      `,
      )
      .eq("id", projectId)
      .eq("customer_id", user.id)
      .maybeSingle();

    // Jalur cadangan memilih kolom lebih ringan; kontrak & tahap pembayaran
    // diambil terpisah pada langkah berikutnya.
    data = fallbackRes.data as typeof data;
    error = fallbackRes.error;
  }

  if (error || !data) {
    if (error) {
      console.error(
        "[getUserProjectById] Error details:",
        JSON.stringify(error, null, 2),
      );
    }
    return null;
  }

  return transformDBProjectToProject(data);
}
