import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DocumentJenis } from "@/types/database.types";
import { requireRole, ServiceError } from "@/services/access.service";
import type {
  VerificationDocumentStatus,
  VerificationRequest,
} from "@/data/admin-verification";

const REVIEW_STATUS_TO_UI: Record<
  "pending" | "approved" | "rejected",
  VerificationDocumentStatus
> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

const UI_STATUS_TO_REVIEW: Record<
  VerificationDocumentStatus,
  "pending" | "approved" | "rejected"
> = {
  Menunggu: "pending",
  Disetujui: "approved",
  Ditolak: "rejected",
};

const DOCUMENT_LABEL: Record<DocumentJenis, string> = {
  sertifikat_tanah: "Sertifikat Tanah",
  ktp_pemilik: "KTP Pemilik",
  imb_pbg: "IMB/PBG",
  surat_kuasa: "Surat Kuasa",
};

const REVIEWABLE_PROJECT_STATUSES: Database["public"]["Enums"]["project_status"][] = [
  "draft",
  "verifikasi_dokumen",
  "revisi_dokumen",
];

type ReviewDecision = {
  id: string;
  status: VerificationDocumentStatus;
};

export async function getDocumentVerificationRequests(
  supabase: SupabaseClient<Database>,
): Promise<VerificationRequest[]> {
  await requireRole(supabase, "admin");

  const { data, error } = await supabase
    .from("projects")
    .select(`
      id,
      customer_id,
      created_at,
      status,
      budget_proyek,
      designs (
        nama,
        gaya_arsitektur,
        lokasi,
        luas_tanah,
        luas_bangunan,
        jumlah_kamar_tidur,
        jumlah_kamar_mandi,
        jumlah_lantai,
        estimasi_biaya,
        estimasi_durasi_hari,
        deskripsi,
        highlights,
        design_images (url, urutan)
      ),
      project_documents (
        id,
        jenis_dokumen,
        nama_dokumen,
        url,
        mime_type,
        review_status,
        catatan
      )
    `)
    .in("status", REVIEWABLE_PROJECT_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getDocumentVerificationRequests]", error.message);
    throw new ServiceError("Gagal memuat daftar dokumen untuk diverifikasi.", 500);
  }

  const projects = (data || []) as unknown as Array<Record<string, unknown>>;
  if (projects.length === 0) return [];

  const customerIds = [...new Set(projects.map((project) => String(project.customer_id)))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", customerIds);

  if (profilesError) {
    console.error("[getDocumentVerificationRequests] profiles:", profilesError.message);
  }

  const profileById = new Map(
    ((profiles || []) as unknown as Array<Record<string, unknown>>).map((profile) => [
      String(profile.id),
      String(profile.full_name || "Customer"),
    ]),
  );

  return Promise.all(
    projects.map(async (project) => {
      const design = (project.designs || {}) as Record<string, unknown>;
      const images = (design.design_images || []) as Array<Record<string, unknown>>;
      const mainImage = [...images].sort(
        (left, right) => Number(left.urutan || 0) - Number(right.urutan || 0),
      )[0]?.url;
      const rawDocuments = (project.project_documents || []) as Array<Record<string, unknown>>;
      const documents = await Promise.all(
        rawDocuments.map(async (document) => {
          const { data: signedData, error: signedError } = await supabase.storage
            .from("project-documents")
            .createSignedUrl(String(document.url), 300);
          if (signedError || !signedData?.signedUrl) {
            throw new ServiceError("Gagal membuka pratinjau dokumen pemohon.", 500);
          }
          const kind: "image" | "pdf" = String(document.mime_type || "").includes("pdf")
            ? "pdf"
            : "image";
          return {
            id: String(document.id),
            name: DOCUMENT_LABEL[document.jenis_dokumen as DocumentJenis] || "Dokumen",
            status: REVIEW_STATUS_TO_UI[(document.review_status as keyof typeof REVIEW_STATUS_TO_UI) || "pending"],
            kind,
            fileName: String(document.nama_dokumen || "Dokumen pemohon"),
            dataUrl: signedData.signedUrl,
          };
        }),
      );
      const createdAt = new Date(String(project.created_at));
      const imageUrls = images
        .sort((left, right) => Number(left.urutan || 0) - Number(right.urutan || 0))
        .map((image) => String(image.url));

      return {
        id: String(project.id),
        applicant: profileById.get(String(project.customer_id)) || "Customer",
        email: "",
        submittedAt: new Intl.DateTimeFormat("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(createdAt),
        adminNote:
          rawDocuments.find((document) => Boolean(document.catatan))?.catatan as string || "",
        budget: Number(project.budget_proyek || 0),
        house: {
          slug: String(project.id),
          name: String(design.nama || "Desain Rumah"),
          style: String(design.gaya_arsitektur || "-"),
          location: String(design.lokasi || "-"),
          landArea: Number(design.luas_tanah || 0),
          buildingArea: Number(design.luas_bangunan || 0),
          bedrooms: Number(design.jumlah_kamar_tidur || 0),
          bathrooms: Number(design.jumlah_kamar_mandi || 0),
          floors: Number(design.jumlah_lantai || 1),
          estimatedCost: Number(design.estimasi_biaya || 0),
          estimatedDuration: Math.round(Number(design.estimasi_durasi_hari || 0) / 30),
          description: String(design.deskripsi || ""),
          highlights: (design.highlights || []) as string[],
          image: imageUrls[0] || String(mainImage || "/images/katalog/house-dummy1.webp"),
          images: imageUrls,
        },
        documents,
      } satisfies VerificationRequest;
    }),
  );
}

export async function saveDocumentVerification(
  supabase: SupabaseClient<Database>,
  projectId: string,
  decisions: ReviewDecision[],
  adminNote: string,
): Promise<void> {
  await requireRole(supabase, "admin");
  if (!projectId || decisions.length === 0) {
    throw new ServiceError("Data hasil review tidak lengkap.", 400);
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, status")
    .eq("id", projectId)
    .maybeSingle();
  if (projectError || !project) {
    throw new ServiceError("Pengajuan proyek tidak ditemukan.", 404);
  }
  if (!REVIEWABLE_PROJECT_STATUSES.includes(project.status)) {
    throw new ServiceError("Dokumen proyek ini tidak dapat direview pada tahap saat ini.", 409);
  }

  const { data: projectDocuments, error: documentsError } = await supabase
    .from("project_documents")
    .select("id, jenis_dokumen")
    .eq("project_id", projectId);
  if (documentsError || !projectDocuments) {
    throw new ServiceError("Gagal memuat dokumen proyek.", 500);
  }

  const storedDocuments = projectDocuments as unknown as Array<Record<string, unknown>>;
  if (
    decisions.length !== storedDocuments.length ||
    decisions.some((decision) => !storedDocuments.some((document) => document.id === decision.id))
  ) {
    throw new ServiceError("Daftar dokumen review tidak sesuai dengan pengajuan.", 400);
  }

  const trimmedNote = adminNote.trim();
  for (const decision of decisions) {
    const { error } = await supabase
      .from("project_documents")
      .update({
        review_status: UI_STATUS_TO_REVIEW[decision.status],
        catatan: decision.status === "Ditolak" ? trimmedNote || "Dokumen perlu diperbaiki." : null,
      })
      .eq("project_id", projectId)
      .eq("id", decision.id);
    if (error) {
      console.error("[saveDocumentVerification] document:", error.message);
      throw new ServiceError("Gagal menyimpan status dokumen.", 500);
    }
  }

  const hasRejection = decisions.some((decision) => decision.status === "Ditolak");
  const requiredKinds: DocumentJenis[] = [
    "sertifikat_tanah",
    "ktp_pemilik",
    "imb_pbg",
  ];
  const allRequiredApproved = requiredKinds.every((kind) => {
    const stored = storedDocuments.find((document) => document.jenis_dokumen === kind);
    const decision = decisions.find((item) => item.id === stored?.id);
    return decision?.status === "Disetujui";
  });

  const nextStatus = hasRejection
    ? "revisi_dokumen"
    : allRequiredApproved
      ? "alokasi_mandor_pengawas"
      : project.status;
  const { error: projectUpdateError } = await supabase
    .from("projects")
    .update({ status: nextStatus })
    .eq("id", projectId);

  if (projectUpdateError) {
    console.error("[saveDocumentVerification] project:", projectUpdateError.message);
    throw new ServiceError("Status proyek gagal diperbarui.", 500);
  }
}