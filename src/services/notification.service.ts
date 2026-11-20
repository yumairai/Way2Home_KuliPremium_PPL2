/**
 * notification.service.ts
 *
 * Layanan terpadu notifikasi customer untuk seluruh alur pembangunan:
 * 1. Dokumen pembangunan diverifikasi admin
 * 2. Pengawas dan mandor di-assign
 * 3. Kontrak siap ditandatangani
 * 4. Deadline tanda tangan kontrak tinggal 3 hari lagi
 * 5. Siap bayar Down Payment (DP)
 * 6. Deadline DP tinggal 3 hari lagi
 * 7. Deadline cicilan (1, 2, 3) tinggal 1 bulan, 1 minggu, dan 3 hari lagi
 * 8. Update progres mandor disetujui pengawas
 * 9. Proyek selesai
 *
 * Setiap notifikasi akan:
 * - Dicatat ke tabel `public.notifications` Supabase (in-app notification)
 * - Dikirim via email ke customer melalui Brevo API (email notification)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  buildWay2HomeEmailHtml,
  sendEmailViaBrevo,
  type EmailDetailRow,
} from "./email.service";

const money = (val: number | null | undefined) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const dateIndo = (dateStr: string | null | undefined) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
    }).format(d);
  } catch {
    return dateStr;
  }
};

type ProjectRecipientInfo = {
  projectId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  projectTitle: string;
  projectAddress: string;
  supervisorName: string;
  contractValue: number;
};

/**
 * Mengambil informasi customer, proyek, dan pengawas untuk keperluan pengiriman notifikasi.
 */
async function getProjectRecipientInfo(
  adminClient: SupabaseClient<Database>,
  projectId: string,
): Promise<ProjectRecipientInfo | null> {
  const { data: project, error: pErr } = await adminClient
    .from("projects")
    .select("id, customer_id, alamat_proyek, budget_proyek, nilai_proyek, pengawas_id, design_id")
    .eq("id", projectId)
    .maybeSingle();

  if (pErr || !project) {
    console.warn(`[notification.service] Proyek ${projectId} tidak ditemukan:`, pErr);
    return null;
  }

  const pRow = project as Record<string, unknown>;
  const customerId = String(pRow.customer_id);

  // Ambil nama profil customer
  let customerName = "Pelanggan Way2Home";
  try {
    const { data: prof } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", customerId)
      .maybeSingle();
    if (prof?.full_name) customerName = prof.full_name;
  } catch (err) {
    console.warn(`[notification.service] Gagal mengambil profil customer ${customerId}:`, err);
  }

  // Ambil nama desain
  let projectTitle = "Pembangunan Rumah";
  let designEstimatedCost = 0;
  if (pRow.design_id) {
    try {
      const { data: des } = await adminClient
        .from("designs")
        .select("nama, estimasi_biaya")
        .eq("id", String(pRow.design_id))
        .maybeSingle();
      if (des?.nama) projectTitle = des.nama;
      designEstimatedCost = Number(des?.estimasi_biaya ?? 0);
    } catch (err) {
      console.warn(`[notification.service] Gagal mengambil nama desain ${pRow.design_id}:`, err);
    }
  }

  // Ambil email dari auth.users
  let customerEmail = "";
  try {
    const { data: authData } = await adminClient.auth.admin.getUserById(customerId);
    customerEmail = authData?.user?.email || "";
  } catch (err) {
    console.error(`[notification.service] Gagal mengambil email customer ${customerId}:`, err);
  }

  // Ambil nama pengawas jika sudah ada
  let supervisorName = "Belum ditugaskan";
  if (pRow.pengawas_id) {
    try {
      const { data: sup } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("id", String(pRow.pengawas_id))
        .maybeSingle();
      if (sup?.full_name) supervisorName = sup.full_name;
    } catch (err) {
      console.warn(`[notification.service] Gagal mengambil profil pengawas:`, err);
    }
  }

  const contractValue = designEstimatedCost;

  return {
    projectId,
    customerId,
    customerName,
    customerEmail,
    projectTitle,
    projectAddress: (pRow.alamat_proyek as string) || "Lokasi Proyek",
    supervisorName,
    contractValue,
  };
}

/**
 * Menyimpan notifikasi ke tabel `notifications` dan mengirim email via Brevo.
 */
async function dispatchCustomerNotification(params: {
  adminClient: SupabaseClient<Database>;
  recipient: ProjectRecipientInfo;
  tipe: string;
  judul: string;
  isi: string;
  emailSubject: string;
  emailBadgeText: string;
  emailBadgeType?: "info" | "warning" | "success" | "danger";
  emailDetails?: EmailDetailRow[];
  actionPath?: string;
  actionText?: string;
  metadata?: Record<string, unknown>;
}) {
  const { adminClient, recipient, tipe, judul, isi, metadata } = params;

  // 1. Simpan ke database notifications
  try {
    const { error: notifErr } = await adminClient.from("notifications").insert({
      user_id: recipient.customerId,
      project_id: recipient.projectId,
      judul,
      isi,
      tipe,
      metadata: (metadata || {}) as Json,
    });

    if (notifErr) {
      console.warn(
        `[notification.service] Peringatan: Gagal menyimpan row notifikasi ke database (${notifErr.message}). Pastikan migration 018 sudah dijalankan di SQL Editor.`,
      );
    }
  } catch (err) {
    console.warn("[notification.service] Exception simpan notifikasi:", err);
  }

  // 2. Kirim email via Brevo jika email customer tersedia
  if (recipient.customerEmail) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://way2home.vercel.app";
    const actionUrl = params.actionPath
      ? `${appUrl}${params.actionPath}`
      : `${appUrl}/proyek/${recipient.projectId}`;

    const htmlContent = buildWay2HomeEmailHtml({
      title: judul,
      subtitle: `Proyek: ${recipient.projectTitle}`,
      badgeText: params.emailBadgeText,
      badgeType: params.emailBadgeType || "info",
      customerName: recipient.customerName,
      message: isi,
      details: params.emailDetails,
      actionUrl,
      actionText: params.actionText || "Buka Detail Proyek",
    });

    await sendEmailViaBrevo({
      to: {
        email: recipient.customerEmail,
        name: recipient.customerName,
      },
      subject: params.emailSubject,
      htmlContent,
      textContent: `${judul}\n\n${isi}\n\nKunjungi proyek: ${actionUrl}`,
    });
  } else {
    console.warn(
      `[notification.service] Customer ${recipient.customerId} tidak memiliki email aktif di auth.users. Email dilewati.`,
    );
  }
}

// ============================================================
// 1. DOKUMEN PEMBANGUNAN DIVERIFIKASI OLEH ADMIN
// ============================================================
export async function notifyDocumentVerified(projectId: string): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const judul = "Dokumen Pembangunan Berhasil Diverifikasi";
  const isi =
    "Seluruh dokumen legalitas pembangunan rumah Anda telah disetujui oleh admin. Proyek kini masuk ke tahap penugasan pengawas dan mandor lapangan.";

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "doc_verified",
    judul,
    isi,
    emailSubject: `[Way2Home] Dokumen Disetujui - ${info.projectTitle}`,
    emailBadgeText: "Dokumen Terverifikasi",
    emailBadgeType: "success",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Lokasi Proyek", value: info.projectAddress },
      { label: "Status Saat Ini", value: "Alokasi Tim Lapangan" },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Lihat Status Proyek",
  });
}

// ============================================================
// 2. PENGAWAS DAN MANDOR TELAH DI-ASSIGN
// ============================================================
export async function notifyTeamAssigned(projectId: string): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  // Ambil daftar mandor yang ditugaskan
  const { data: mandorRows } = await adminClient
    .from("project_mandors")
    .select("mandor_profiles(profiles(full_name))")
    .eq("project_id", projectId);

  type MandorRow = {
    mandor_profiles?: {
      profiles?: {
        full_name?: string | null;
      } | null;
    } | null;
  };

  const mandorNames = ((mandorRows || []) as unknown as MandorRow[])
    .map(
      (m) =>
        m.mandor_profiles?.profiles?.full_name || "Mandor Lapangan",
    )
    .join(", ");

  const judul = "Tim Pengawas & Mandor Telah Ditugaskan";
  const isi = `Pengawas ${info.supervisorName} dan mandor (${mandorNames || "Tim Mandor"}) telah dialokasikan untuk memimpin pembangunan rumah Anda. Kontrak kerja resmi sedang disiapkan.`;

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "team_assigned",
    judul,
    isi,
    emailSubject: `[Way2Home] Tim Proyek Telah Ditugaskan - ${info.projectTitle}`,
    emailBadgeText: "Tim Ditugaskan",
    emailBadgeType: "info",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Pengawas Lapangan", value: info.supervisorName },
      { label: "Tim Mandor", value: mandorNames || "Telah Dialokasikan" },
      { label: "Lokasi", value: info.projectAddress },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Lihat Tim & Detail Proyek",
  });
}

// ============================================================
// 3. SUDAH BISA TANDA TANGAN KONTRAK
// ============================================================
export async function notifyContractReady(projectId: string): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const judul = "Kontrak Pembangunan Siap Ditandatangani";
  const isi =
    "Draf kontrak pembangunan rumah Anda telah selesai disusun lengkap dengan spesifikasi teknis dan jadwal pembayaran. Silakan tinjau dan tanda tangani kontrak Anda sekarang.";

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "contract_ready",
    judul,
    isi,
    emailSubject: `[Way2Home] Kontrak Pembangunan Siap Ditandatangani - ${info.projectTitle}`,
    emailBadgeText: "Tanda Tangan Kontrak",
    emailBadgeType: "warning",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Nilai Kontrak", value: money(info.contractValue) },
      { label: "Pengawas", value: info.supervisorName },
      { label: "Batas Waktu Review", value: "7 hari sejak diterbitkan" },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Tinjau & Tanda Tangani Kontrak",
  });
}

// ============================================================
// 4. DEADLINE TANDA TANGAN KONTRAK TINGGAL 3 HARI LAGI
// ============================================================
export async function notifyContractDeadline3Days(
  projectId: string,
  deadlineDateStr?: string,
): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const judul = "Peringatan: Batas Waktu TTD Kontrak Tinggal 3 Hari";
  const isi =
    "Batas waktu penandatanganan kontrak pembangunan rumah Anda tersisa 3 hari lagi. Segera tandatangani kontrak agar alokasi tim dan jadwal pembangunan tidak dibatalkan.";

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "contract_deadline_3d",
    judul,
    isi,
    emailSubject: `[Mendesak] Batas Waktu Tanda Tangan Kontrak Tinggal 3 Hari - ${info.projectTitle}`,
    emailBadgeText: "Batas Waktu H-3",
    emailBadgeType: "danger",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Nilai Kontrak", value: money(info.contractValue) },
      { label: "Jatuh Tempo TTD", value: dateIndo(deadlineDateStr) },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Tanda Tangani Kontrak Sekarang",
    metadata: { deadline: deadlineDateStr },
  });
}

// ============================================================
// 5. SUDAH BISA BAYAR DOWN PAYMENT (DP)
// ============================================================
export async function notifyDpReady(
  projectId: string,
  dpAmount?: number,
): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const nominalDp = dpAmount || Math.round(info.contractValue * 0.3);

  const judul = "Tagihan Down Payment (DP) Telah Terbit";
  const isi = `Kontrak pembangunan telah resmi Anda tandatangani. Tagihan Down Payment (30%) sebesar ${money(nominalDp)} siap dibayar agar pekerjaan persiapan lapangan dapat segera dimulai.`;

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "dp_ready",
    judul,
    isi,
    emailSubject: `[Way2Home] Tagihan Down Payment (DP) Siap Dibayar - ${info.projectTitle}`,
    emailBadgeText: "Menunggu Pembayaran DP",
    emailBadgeType: "warning",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Tahap Pembayaran", value: "Down Payment (30%)" },
      { label: "Nominal DP", value: money(nominalDp) },
      { label: "Batas Waktu Bayar", value: "7 hari kerja" },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Bayar Down Payment",
    metadata: { dpAmount: nominalDp },
  });
}

// ============================================================
// 6. DEADLINE DP TINGGAL 3 HARI LAGI
// ============================================================
export async function notifyDpDeadline3Days(
  projectId: string,
  dueDateStr: string,
  dpAmount?: number,
): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const nominalDp = dpAmount || Math.round(info.contractValue * 0.3);

  const judul = "Peringatan: Batas Waktu Pembayaran DP Tinggal 3 Hari";
  const isi = `Batas waktu pembayaran Down Payment (DP) sebesar ${money(nominalDp)} tersisa 3 hari lagi (jatuh tempo: ${dateIndo(dueDateStr)}). Mohon segera selesaikan pembayaran untuk menghindari penundaan jadwal kerja.`;

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "dp_deadline_3d",
    judul,
    isi,
    emailSubject: `[Mendesak] Batas Waktu Pembayaran DP Tinggal 3 Hari - ${info.projectTitle}`,
    emailBadgeText: "Batas Waktu DP H-3",
    emailBadgeType: "danger",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Tagihan", value: "Down Payment (30%)" },
      { label: "Nominal", value: money(nominalDp) },
      { label: "Jatuh Tempo", value: dateIndo(dueDateStr) },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Selesaikan Pembayaran DP",
    metadata: { dueDate: dueDateStr, dpAmount: nominalDp },
  });
}

// ============================================================
// 7. DEADLINE CICILAN (1, 2, 3) TINGGAL 1 BULAN, 1 MINGGU, 3 HARI
// ============================================================
export async function notifyInstallmentDeadline(params: {
  projectId: string;
  installmentName: string;
  installmentUrutan: number;
  amount: number;
  dueDateStr: string;
  daysLeft: 30 | 7 | 3;
}): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, params.projectId);
  if (!info) return;

  const daysLabel =
    params.daysLeft === 30
      ? "1 Bulan"
      : params.daysLeft === 7
        ? "1 Minggu"
        : "3 Hari";

  const badgeType =
    params.daysLeft === 3
      ? "danger"
      : params.daysLeft === 7
        ? "warning"
        : "info";

  const judul = `Pengingat: Pembayaran ${params.installmentName} Jatuh Tempo dalam ${daysLabel}`;
  const isi = `Tagihan ${params.installmentName} sebesar ${money(params.amount)} akan jatuh tempo pada ${dateIndo(params.dueDateStr)} (${daysLabel} lagi). Pastikan dana pembayaran Anda telah siap.`;

  const tipe = `cicilan_${params.daysLeft}d_termin_${params.installmentUrutan}`;

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe,
    judul,
    isi,
    emailSubject: `[Way2Home] Pengingat Tagihan ${params.installmentName} (${daysLabel} Lagi) - ${info.projectTitle}`,
    emailBadgeText: `Jatuh Tempo ${daysLabel}`,
    emailBadgeType: badgeType,
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Termin Tagihan", value: params.installmentName },
      { label: "Nominal Tagihan", value: money(params.amount) },
      { label: "Tanggal Jatuh Tempo", value: dateIndo(params.dueDateStr) },
    ],
    actionPath: `/proyek/${params.projectId}`,
    actionText: "Lihat Rincian Pembayaran",
    metadata: {
      installmentUrutan: params.installmentUrutan,
      daysLeft: params.daysLeft,
      dueDate: params.dueDateStr,
      amount: params.amount,
    },
  });
}

// ============================================================
// 8. UPDATE PROGRESS DARI MANDOR YANG TELAH DI-ACC PENGAWAS
// ============================================================
export async function notifyProgressApproved(
  projectId: string,
  subtaskTitle: string,
  currentProgressPercentage: number,
  photoUrl?: string | null,
): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const judul = `Update Progres Proyek Telah Diverifikasi (${currentProgressPercentage}%)`;
  const isi = `Pengawas ${info.supervisorName} telah meninjau dan menyetujui laporan pekerjaan "${subtaskTitle}" dari tim mandor. Progres kumulatif pembangunan rumah Anda kini telah mencapai ${currentProgressPercentage}%.`;

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "progress_update",
    judul,
    isi,
    emailSubject: `[Way2Home] Update Progres Proyek ${currentProgressPercentage}% - ${info.projectTitle}`,
    emailBadgeText: `Progres ${currentProgressPercentage}%`,
    emailBadgeType: "success",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Pekerjaan Selesai", value: subtaskTitle },
      { label: "Total Progres Resmi", value: `${currentProgressPercentage}%` },
      { label: "Diverifikasi Oleh", value: info.supervisorName },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Lihat Foto & Detail Progres",
    metadata: {
      subtaskTitle,
      progress: currentProgressPercentage,
      photoUrl,
    },
  });
}

// ============================================================
// 9. PROYEK TELAH SELESAI
// ============================================================
export async function notifyProjectCompleted(projectId: string): Promise<void> {
  const adminClient = createAdminClient();
  const info = await getProjectRecipientInfo(adminClient, projectId);
  if (!info) return;

  const judul = "Selamat! Pembangunan Rumah Anda Telah Selesai 100%";
  const isi =
    "Seluruh rangkaian pekerjaan konstruksi rumah Anda telah selesai 100% dan lolos inspeksi final oleh tim pengawas lapangan. Terima kasih atas kepercayaan Anda membangun hunian impian bersama Way2Home!";

  await dispatchCustomerNotification({
    adminClient,
    recipient: info,
    tipe: "project_completed",
    judul,
    isi,
    emailSubject: `[Selamat] Rumah Anda Telah Selesai Dibangun 100%! - ${info.projectTitle}`,
    emailBadgeText: "Proyek Selesai 100%",
    emailBadgeType: "success",
    emailDetails: [
      { label: "Nama Proyek", value: info.projectTitle },
      { label: "Lokasi", value: info.projectAddress },
      { label: "Pengawas Lapangan", value: info.supervisorName },
      { label: "Status Pekerjaan", value: "Selesai & Lolos Uji Serah Terima" },
    ],
    actionPath: `/proyek/${projectId}`,
    actionText: "Lihat Laporan Akhir Proyek",
  });
}

// ============================================================
// SCHEDULER / CRON CHECKER: PENGECEKAN DEADLINE OTOMATIS
// ============================================================

/**
 * Memeriksa seluruh deadline yang mendekat dan mengirim notifikasi jika belum pernah dikirim:
 * - Deadline TTD Kontrak (H-3)
 * - Deadline DP (H-3)
 * - Deadline Cicilan 1, 2, 3 (H-30, H-7, H-3)
 */
export async function checkAndSendDeadlineReminders(): Promise<{
  processed: number;
  remindersSent: string[];
}> {
  const adminClient = createAdminClient();
  const remindersSent: string[] = [];
  const now = new Date();
  const nowMs = now.getTime();

  // Helper untuk cek apakah notifikasi tipe tertentu sudah pernah dikirim untuk proyek ini
  const isAlreadySent = async (projectId: string, tipe: string) => {
    try {
      const { data } = await adminClient
        .from("notifications")
        .select("id")
        .eq("project_id", projectId)
        .eq("tipe", tipe)
        .limit(1)
        .maybeSingle();
      return Boolean(data);
    } catch {
      return false;
    }
  };

  // ------------------------------------------------------------
  // A. Cek Deadline Tanda Tangan Kontrak (H-3)
  // ------------------------------------------------------------
  const { data: contractProjects } = await adminClient
    .from("projects")
    .select(`
      id,
      created_at,
      status,
      contracts (
        id,
        status,
        created_at
      )
    `)
    .eq("status", "finalisasi_kontrak");

  type ContractInfo = {
    id: string;
    status: string;
    created_at: string;
  };

  type ProjectWithContract = {
    id: string;
    created_at: string;
    status: string;
    contracts: ContractInfo | ContractInfo[] | null;
  };

  for (const rawProject of contractProjects || []) {
    const p = rawProject as unknown as ProjectWithContract;
    const contracts = p.contracts;
    const contract = Array.isArray(contracts) ? contracts[0] : contracts;
    if (contract && contract.status !== "aktif" && contract.status !== "selesai") {
      const contractCreated = new Date(contract.created_at || p.created_at).getTime();
      const deadlineMs = contractCreated + 7 * 86400000;
      const msLeft = deadlineMs - nowMs;
      const daysLeft = msLeft / 86400000;

      // Jika tersisa <= 3 hari dan belum lewat deadline
      if (daysLeft <= 3 && daysLeft >= -1) {
        const already = await isAlreadySent(p.id, "contract_deadline_3d");
        if (!already) {
          await notifyContractDeadline3Days(
            p.id,
            new Date(deadlineMs).toISOString(),
          );
          remindersSent.push(`contract_deadline_3d:${p.id}`);
        }
      }
    }
  }

  // ------------------------------------------------------------
  // B. Cek Deadline Down Payment (H-3)
  // ------------------------------------------------------------
  const { data: dpStages } = await adminClient
    .from("payment_stages")
    .select("id, project_id, nominal, status, tanggal_jatuh_tempo")
    .eq("urutan", 0)
    .eq("status", "belum");

  for (const dp of dpStages || []) {
    if (dp.tanggal_jatuh_tempo) {
      const dueMs = new Date(dp.tanggal_jatuh_tempo).getTime();
      const msLeft = dueMs - nowMs;
      const daysLeft = msLeft / 86400000;

      if (daysLeft <= 3 && daysLeft >= -1) {
        const already = await isAlreadySent(dp.project_id, "dp_deadline_3d");
        if (!already) {
          await notifyDpDeadline3Days(
            dp.project_id,
            dp.tanggal_jatuh_tempo,
            Number(dp.nominal),
          );
          remindersSent.push(`dp_deadline_3d:${dp.project_id}`);
        }
      }
    }
  }

  // ------------------------------------------------------------
  // C. Cek Deadline Cicilan Termin 1, 2, 3 (H-30, H-7, H-3)
  // ------------------------------------------------------------
  const { data: installmentStages } = await adminClient
    .from("payment_stages")
    .select("id, project_id, nama_tahap, urutan, nominal, status, tanggal_jatuh_tempo")
    .in("urutan", [1, 2, 3])
    .eq("status", "belum");

  for (const stage of installmentStages || []) {
    if (stage.tanggal_jatuh_tempo) {
      const dueMs = new Date(stage.tanggal_jatuh_tempo).getTime();
      const msLeft = dueMs - nowMs;
      const daysLeft = msLeft / 86400000;

      // Evaluasi H-3, H-7, H-30
      let targetTier: 30 | 7 | 3 | null = null;
      if (daysLeft <= 3 && daysLeft >= -1) {
        targetTier = 3;
      } else if (daysLeft <= 7 && daysLeft > 3) {
        targetTier = 7;
      } else if (daysLeft <= 30 && daysLeft > 7) {
        targetTier = 30;
      }

      if (targetTier) {
        const tipe = `cicilan_${targetTier}d_termin_${stage.urutan}`;
        const already = await isAlreadySent(stage.project_id, tipe);
        if (!already) {
          await notifyInstallmentDeadline({
            projectId: stage.project_id,
            installmentName: stage.nama_tahap,
            installmentUrutan: stage.urutan,
            amount: Number(stage.nominal),
            dueDateStr: stage.tanggal_jatuh_tempo,
            daysLeft: targetTier,
          });
          remindersSent.push(`${tipe}:${stage.project_id}`);
        }
      }
    }
  }

  return {
    processed: remindersSent.length,
    remindersSent,
  };
}

// ============================================================
// 10. NOTIFIKASI MANDOR DIVERIFIKASI / DISETUJUI ADMIN
// ============================================================
export async function notifyMandorApproved(mandorId: string): Promise<void> {
  const adminClient = createAdminClient();

  let mandorName = "Mitra Mandor";
  let mandorEmail = "";

  try {
    const { data: prof } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", mandorId)
      .maybeSingle();
    if (prof?.full_name) mandorName = prof.full_name;
  } catch (err) {
    console.warn("[notifyMandorApproved] Gagal ambil profil:", err);
  }

  try {
    const { data: authData } = await adminClient.auth.admin.getUserById(mandorId);
    mandorEmail = authData?.user?.email || "";
  } catch (err) {
    console.warn("[notifyMandorApproved] Gagal ambil auth user:", err);
  }

  const judul = "Selamat! Pendaftaran Mandor Anda Telah Disetujui";
  const isi =
    "Berkas dan kualifikasi Anda telah diverifikasi oleh admin Way2Home. Akun Anda kini aktif sebagai Mitra Mandor Resmi dan siap menerima penugasan proyek pembangunan.";

  // In-app notification
  try {
    await adminClient.from("notifications").insert({
      user_id: mandorId,
      judul,
      isi,
      tipe: "mandor_verified",
      metadata: { role: "mandor" },
    });
  } catch (err) {
    console.warn("[notifyMandorApproved] Gagal simpan notifikasi in-app:", err);
  }

  // Kirim email
  if (mandorEmail) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://way2home.vercel.app";
    const htmlContent = buildWay2HomeEmailHtml({
      title: judul,
      subtitle: "Kemitraan Mandor Way2Home",
      badgeText: "Verifikasi Disetujui",
      badgeType: "success",
      customerName: mandorName,
      message: isi,
      details: [
        { label: "Status Kemitraan", value: "Mitra Mandor Aktif" },
        { label: "Portal", value: "Dashboard Mandor Way2Home" },
      ],
      actionUrl: `${appUrl}/mandor`,
      actionText: "Masuk ke Dashboard Mandor",
    });

    await sendEmailViaBrevo({
      to: { email: mandorEmail, name: mandorName },
      subject: "[Way2Home] Pendaftaran Mitra Mandor Anda Telah Disetujui",
      htmlContent,
      textContent: `${judul}\n\n${isi}\n\nKunjungi portal mandor: ${appUrl}/mandor`,
    });
  }
}

// ============================================================
// 11. NOTIFIKASI MANDOR DITOLAK ADMIN (DENGAN ALASAN ADMIN)
// ============================================================
export async function notifyMandorRejected(
  mandorEmail: string,
  mandorName: string,
  reason: string,
): Promise<void> {
  if (!mandorEmail) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://way2home.vercel.app";
  const judul = "Hasil Verifikasi Pendaftaran Mitra Mandor";
  const alasanTeks = reason.trim() || "Dokumen atau kualifikasi belum memenuhi persyaratan kemitraan.";
  const isi = `Terima kasih atas minat Anda mendaftar sebagai mitra mandor di Way2Home. Berdasarkan peninjauan tim verifikasi kami, pendaftaran Anda saat ini belum dapat disetujui.\n\nCatatan verifikator:\n"${alasanTeks}"\n\nData pendaftaran sebelumnya telah dibersihkan dari sistem kami sehingga Anda dapat melakukan registrasi ulang kapan saja setelah melengkapi persyaratan yang sesuai.`;

  const htmlContent = buildWay2HomeEmailHtml({
    title: judul,
    subtitle: "Kemitraan Mandor Way2Home",
    badgeText: "Pendaftaran Belum Disetujui",
    badgeType: "danger",
    customerName: mandorName || "Calon Mitra Mandor",
    message: isi,
    details: [
      {
        label: "Catatan Verifikator",
        value: alasanTeks,
      },
      {
        label: "Tindakan Lanjutan",
        value: "Dapat mendaftar ulang kembali dengan persyaratan yang telah dilengkapi.",
      },
    ],
    actionUrl: `${appUrl}/mandor/register`,
    actionText: "Daftar Ulang Mandor",
  });

  await sendEmailViaBrevo({
    to: { email: mandorEmail, name: mandorName || "Calon Mitra Mandor" },
    subject: "[Way2Home] Informasi Verifikasi Pendaftaran Mitra Mandor",
    htmlContent,
    textContent: `${judul}\n\n${isi}\n\nDaftar ulang: ${appUrl}/mandor/register`,
  });
}
