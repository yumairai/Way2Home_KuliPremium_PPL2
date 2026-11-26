import type { MandorIssueReport } from "@/data/mandor";
import type { IssueResolution, SupervisorProject, SupervisorReport } from "@/data/pengawas";

export const PENGAWAS_TEST_EMAILS = [
  "pengawas-testing-1@way2home.test",
  "pengawas-testing-2@way2home.test",
  "pengawas-testing-3@way2home.test",
] as const;
export const PENGAWAS_TEST_PROJECT_ID = "TP-001";
export const TEST_INSTALLMENT_UNLOCK_PROGRESS = [30, 55, 78] as const;
export const TEST_INSTALLMENT_PROGRESS_CAPS = [55, 78, 100] as const;
const VERSION = 2;

type TestIssue = MandorIssueReport & { supervisorState: "Menunggu" | "Ditindaklanjuti" };
export type PengawasTestState = {
  project: SupervisorProject;
  reportableMilestone: number;
  testStage: "alokasi_mandor_pengawas" | "finalisasi_kontrak" | "berjalan";
  supervisorSigned: boolean;
  customerSigned: boolean;
  mandorIds: string[];
  paidInstallments: number[];
  issueReports: TestIssue[];
  resolutions: IssueResolution[];
  aiAnalyses: Record<string, unknown>;
};

export const TEST_FOREMEN = [
  { id: "test-mandor-1", name: "Agus Santoso", phone: "+6281290001201", specialties: ["Pondasi", "Struktur"], area: "Jakarta Selatan", experience: 9 },
  { id: "test-mandor-2", name: "Bima Saputra", phone: "+6281290001802", specialties: ["Struktur", "Atap"], area: "Jakarta Selatan · Depok", experience: 7 },
  { id: "test-mandor-3", name: "Teguh Wibowo", phone: "+6281290002403", specialties: ["Finishing", "Instalasi"], area: "Depok · Bogor", experience: 11 },
];
const milestones = [
  ["Persiapan & Fondasi", ["Pembersihan lahan", "Pengukuran (bowplank)", "Galian tanah", "Pengecoran fondasi & sloof"], 15],
  ["Struktur Utama", ["Pengerjaan kolom", "Pengerjaan balok", "Pelat lantai", "Rangka atap"], 20],
  ["Dinding & Penutup Atap", ["Pemasangan bata", "Plesteran awal", "Pengerjaan kusen", "Pemasangan genteng / atap"], 20],
  ["Instalasi Jalur MEP", ["Pipa air bersih & kotor", "Pipa kabel listrik", "Pembuatan septic tank"], 15],
  ["Finishing", ["Acian dinding", "Pemasangan keramik / granit", "Pemasangan plafon", "Pengecatan interior & eksterior", "Pemasangan lampu, keran & sanitari"], 20],
  ["Lingkungan Luar & Serah Terima", ["Pengerjaan pagar & carport", "Pembuatan taman", "Pembersihan total", "Inspeksi punch list & penyerahan kunci"], 10],
] as const;
const photos = ["progress-01-pondasi.jpg", "progress-02-struktur.webp", "progress-03-dinding.jpg", "progress-04-atap.jpg", "progress-05-plester.webp", "progress-06-instalasi.jpeg", "progress-07-keramik.jpg", "progress-08-pengecatan.webp"];

function createProject(): SupervisorProject {
  const stages = milestones.map(([name, tasks, weight], i) => ({
    id: `test-stage-${i + 1}`, name, start: `2026-0${i + 6}-01`, end: `2026-0${i + 6}-28`, status: "Menunggu" as const, progress: 0,
    tasks: tasks.map((title, j) => ({ id: `test-task-${i + 1}-${j + 1}`, title, weight: weight / tasks.length, done: false })),
  }));
  return {
    id: PENGAWAS_TEST_PROJECT_ID, title: "Griya Embun Flamboyan", customer: "Robby Azwan", customerPhone: "+62 812-0000-0000", customerEmail: "robby.azwan@example.test", customerNik: "3174010101900001", design: "Griya Embun Flamboyan", architecturalStyle: "Skandinavia", landArea: 180, buildingArea: 98, floors: 1, bedrooms: 3, bathrooms: 2, duration: 5, category: "Rumah tinggal", address: "Jl. Melati No. 18, Jakarta Selatan", status: "Berjalan", progress: 0, deadline: "30 November 2026", started: "1 Juni 2026", value: 608000000, customerBudget: 650000000, estimatedCost: 608000000, supervisor: "Pengawas Testing", foreman: null, foremen: [], needs: "Pembangunan rumah tinggal dengan desain Griya Embun Flamboyan.", specifications: ["Rumah 1 lantai bergaya Skandinavia", "Luas tanah 180 m²", "Luas bangunan 98 m²", "3 kamar tidur", "2 kamar mandi", "Estimasi durasi konstruksi 5 bulan"], contractId: "KONTRAK-TEST-001", contractStatus: "draft", projectStageStatus: "alokasi_mandor_pengawas", supervisorSignedAt: null, supervisorSignaturePath: null, customerSignedAt: null, customerSignaturePath: null,
    milestones: stages.map((stage) => ({ id: stage.id, name: stage.name, start: stage.start, end: stage.end, status: stage.status, progress: stage.progress })), tasks: stages.flatMap((stage) => stage.tasks.map((task) => ({ id: task.id, milestoneId: stage.id, title: task.title, done: false }))), reports: [], issues: [], customerUpdates: [], documentation: [], payments: [
      { id: "test-payment-0", stage: "Down Payment (30%)", amount: 182400000, status: "Belum jatuh tempo", dueDate: "Setelah kontrak ditandatangani" },
      { id: "test-payment-1", stage: "Cicilan 1 (25%)", amount: 152000000, status: "Belum jatuh tempo", dueDate: "1 Juli 2026" },
      { id: "test-payment-2", stage: "Cicilan 2 (25%)", amount: 152000000, status: "Belum jatuh tempo", dueDate: "1 Agustus 2026" },
      { id: "test-payment-3", stage: "Cicilan 3 (20%)", amount: 121600000, status: "Belum jatuh tempo", dueDate: "1 September 2026" },
    ],
  };
}
function createState(): PengawasTestState {
  const project = createProject();
  const issueReports: TestIssue[] = [{ id: "test-issue-1", projectId: project.id, category: "MATERIAL_PERALATAN", categoryLabel: "Material dan peralatan", description: "Pengiriman material utama mengalami keterlambatan dan berpotensi menggeser jadwal pekerjaan.", affectedMilestoneId: project.milestones[1].id, affectedMilestoneTitle: project.milestones[1].name, affectedSubtaskId: project.tasks[4].id, affectedSubtaskTitle: project.tasks[4].title, workCondition: "TERHAMBAT_SEBAGIAN", estimatedDelayDays: 3, additionalInfo: "Kendala dummy untuk uji alur pengawas.", attachment: null, attachmentName: "", submitted: new Date().toISOString(), status: "Menunggu", followUp: "", supervisorState: "Menunggu" }];
  return { project, reportableMilestone: 0, testStage: "alokasi_mandor_pengawas", supervisorSigned: false, customerSigned: false, mandorIds: [], paidInstallments: [], issueReports, resolutions: [], aiAnalyses: {} };
}
const key = (userId: string) => `way2home-pengawas-test:${userId}`;
const activeKey = "way2home-pengawas-test-active-user";
export function isPengawasTestAccount(email: string, isTestUser: boolean) { return isTestUser && (PENGAWAS_TEST_EMAILS as readonly string[]).includes(email.toLowerCase()); }
export function loadPengawasTestState(userId: string): PengawasTestState {
  if (typeof window === "undefined") return createState();
  try { const raw = window.localStorage.getItem(key(userId)); if (raw) { const saved = JSON.parse(raw) as { version: number; state: PengawasTestState }; if (saved.version === VERSION && saved.state?.project?.milestones?.length === 6) return reconcileSavedTestIssueState(saved.state); } }
  catch (error) { console.warn("Tidak dapat membaca state testing pengawas lokal.", error); }
  return createState();
}
export function savePengawasTestState(userId: string, state: PengawasTestState) { if (typeof window === "undefined") return; window.localStorage.setItem(key(userId), JSON.stringify({ version: VERSION, state })); window.localStorage.setItem(activeKey, userId); }
export function resetPengawasTestState(userId: string) { const state = createState(); savePengawasTestState(userId, state); return state; }
export function clearPengawasTestState(userId: string) { if (typeof window === "undefined") return; window.localStorage.removeItem(key(userId)); if (window.localStorage.getItem(activeKey) === userId) window.localStorage.removeItem(activeKey); }
if (typeof window !== "undefined") window.addEventListener("pagehide", () => { const userId = window.localStorage.getItem(activeKey); if (userId) clearPengawasTestState(userId); });

export function assignTestForemen(state: PengawasTestState, ids: string[]): PengawasTestState {
  if (state.testStage !== "alokasi_mandor_pengawas" || ids.length < 1 || ids.length > 3) return state;
  const foremen = ids.map((id) => TEST_FOREMEN.find((item) => item.id === id)).filter((item): item is (typeof TEST_FOREMEN)[number] => !!item);
  if (foremen.length !== ids.length) return state;
  return { ...state, mandorIds: ids, testStage: "finalisasi_kontrak", project: { ...state.project, foremen: foremen.map((item) => item.name), foreman: foremen[0].name, projectStageStatus: "finalisasi_kontrak" } };
}
export function signTestContract(
  state: PengawasTestState,
  supervisorSignature: string,
): PengawasTestState {
  if (
    state.testStage !== "finalisasi_kontrak" ||
    !state.mandorIds.length ||
    !supervisorSignature.trim()
  ) {
    return state;
  }
  return {
    ...state,
    supervisorSigned: true,
    customerSigned: true,
    paidInstallments: [0],
    testStage: "berjalan",
    project: {
      ...state.project,
      status: "Berjalan",
      projectStageStatus: "berjalan",
      contractStatus: "Ditandatangani",
      contractIssuedAt: "1 Juni 2026",
      supervisorSignedAt: new Date().toISOString(),
      supervisorSignaturePath: supervisorSignature,
      customerSignedAt: new Date().toISOString(),
      customerSignaturePath: "/test-assets/signatures/pengawas-signature.png",
      started: "1 Juni 2026",
      payments: state.project.payments.map((payment, index) => ({
        ...payment,
        status:
          index === 0
            ? "Lunas"
            : index === 1
              ? "Menunggu"
              : "Belum jatuh tempo",
      })),
    },
  };
}
export function canPayTestInstallment(
  state: PengawasTestState,
  installment: number,
) {
  if (
    !Number.isInteger(installment) ||
    installment < 1 ||
    installment > TEST_INSTALLMENT_UNLOCK_PROGRESS.length
  ) {
    return false;
  }
  const unlockProgress = TEST_INSTALLMENT_UNLOCK_PROGRESS[installment - 1];
  return (
    state.testStage === "berjalan" &&
    state.paidInstallments.includes(installment - 1) &&
    !state.paidInstallments.includes(installment) &&
    state.project.progress >= unlockProgress
  );
}

export function payTestInstallment(
  state: PengawasTestState,
  installment: number,
): PengawasTestState {
  if (!canPayTestInstallment(state, installment)) return state;
  const paidInstallments = [...state.paidInstallments, installment];
  return { ...state, paidInstallments, project: { ...state.project, payments: state.project.payments.map((payment, index) => ({ ...payment, status: paidInstallments.includes(index) ? "Lunas" : index === installment + 1 ? "Menunggu" : "Belum jatuh tempo" })) } };
}
export function progressCapForTestState(state: PengawasTestState) { return state.paidInstallments.includes(3) ? 100 : state.paidInstallments.includes(2) ? 78 : state.paidInstallments.includes(1) ? 55 : state.paidInstallments.includes(0) ? 30 : 0; }
export function createTestMilestoneReports(state: PengawasTestState): PengawasTestState {
  const index = state.reportableMilestone;
  if (index >= state.project.milestones.length || state.testStage !== "berjalan") return state;
  const milestone = state.project.milestones[index];
  const tasks = state.project.tasks.filter((task) => task.milestoneId === milestone.id);
  const reports: SupervisorReport[] = tasks.map((task, taskIndex) => {
    const weight = milestones[index][2] / tasks.length;
    return { id: `test-report-${index + 1}-${taskIndex + 1}`, foreman: state.project.foreman ?? "Mandor testing", milestoneId: milestone.id, title: task.title, subtaskTitle: task.title, note: `Laporan dummy pekerjaan ${task.title.toLowerCase()} telah selesai dan siap diverifikasi.`, submitted: new Date().toISOString(), progress: weight, decision: "Menunggu", photo: `/test-assets/progress/${photos[(index * 4 + taskIndex) % photos.length]}`, weight };
  });
  return { ...state, project: { ...state.project, reports: [...state.project.reports, ...reports] } };
}
export function decideTestReport(state: PengawasTestState, id: string, decision: "Disetujui" | "Perlu revisi", feedback = ""): PengawasTestState {
  const report = state.project.reports.find((item) => item.id === id);
  if (!report || report.decision !== "Menunggu") return state;
  if (decision === "Disetujui" && state.project.progress + report.weight > progressCapForTestState(state) + 0.001) return state;
  const reports = state.project.reports.map((item) => item.id === id ? { ...item, decision, note: decision === "Perlu revisi" && feedback ? `${item.note}\nCatatan revisi: ${feedback}` : item.note } : item);
  const tasks = state.project.tasks.map((task) => task.title === report.subtaskTitle && task.milestoneId === report.milestoneId && decision === "Disetujui" ? { ...task, done: true } : task);
  const approvedReports = reports.filter((item) => item.decision === "Disetujui");
  const progress = Math.min(100, approvedReports.reduce((sum, item) => sum + item.weight, 0));
  const nextMilestones = state.project.milestones.map((item) => { const stageTasks = tasks.filter((task) => task.milestoneId === item.id); const done = stageTasks.filter((task) => task.done).length; return { ...item, progress: stageTasks.length ? Math.round(done / stageTasks.length * 100) : 0, status: done === stageTasks.length ? "Selesai" as const : done ? "Berjalan" as const : "Menunggu" as const }; });
  const current = nextMilestones[state.reportableMilestone];
  const canAdvance = !!current && tasks.filter((task) => task.milestoneId === current.id).every((task) => task.done);
  return { ...state, reportableMilestone: canAdvance ? state.reportableMilestone + 1 : state.reportableMilestone, project: { ...state.project, tasks, reports, milestones: nextMilestones, progress, status: progress === 100 ? "Selesai" : "Berjalan" } };
}

function supervisorIssuesFromReports(issueReports: TestIssue[]): SupervisorProject["issues"] {
  return issueReports.map((issue) => ({
    id: issue.id,
    title: issue.categoryLabel,
    description: issue.description,
    priority: "Sedang",
    state: issue.supervisorState === "Menunggu" ? "Baru" : "Ditindaklanjuti",
    reportDate: issue.submitted,
    followUp: issue.followUp,
  }));
}

function withTestIssueReports(
  state: PengawasTestState,
  issueReports: TestIssue[],
): PengawasTestState {
  return {
    ...state,
    issueReports,
    project: {
      ...state.project,
      issues: supervisorIssuesFromReports(issueReports),
    },
  };
}

function reconcileSavedTestIssueState(
  state: PengawasTestState,
): PengawasTestState {
  return state.resolutions.reduce((current, resolution) => {
    const decisionLabel =
      resolution.status === "Ditindaklanjuti" &&
      resolution.requiresCustomerApproval
        ? resolution.customerFeedback === "Usulan disetujui customer."
          ? "Disetujui customer"
          : "Keputusan final pengawas"
        : undefined;
    return saveTestIssueResolution(current, resolution, decisionLabel);
  }, state);
}

export function saveTestIssueResolution(
  state: PengawasTestState,
  resolution: IssueResolution,
  decisionLabel?: "Disetujui customer" | "Keputusan final pengawas",
): PengawasTestState {
  const resolutions = [
    ...state.resolutions.filter((item) => item.issueId !== resolution.issueId),
    resolution,
  ];
  const issueReports = state.issueReports.map((issue) => {
    if (issue.id !== resolution.issueId) return issue;
    if (
      resolution.status === "Menunggu approval customer" ||
      resolution.status === "Diskusi dengan pengawas"
    ) {
      return {
        ...issue,
        supervisorState: "Menunggu" as const,
        status: "Menunggu" as const,
        followUp: "",
        approvedResolution: null,
      };
    }
    if (resolution.status !== "Ditindaklanjuti") return issue;
    return {
      ...issue,
      supervisorState: "Ditindaklanjuti" as const,
      status: "Ditindaklanjuti" as const,
      followUp: resolution.solution,
      approvedResolution: decisionLabel
        ? {
            solution: resolution.solution,
            impactType: resolution.impactType,
            additionalCost: resolution.additionalCost,
            additionalDays: resolution.additionalDays,
            decisionLabel,
          }
        : (issue.approvedResolution ?? null),
    };
  });

  return withTestIssueReports({ ...state, resolutions }, issueReports);
}

export function decideTestCustomerIssue(
  state: PengawasTestState,
  issueId: string,
  decision: "approve" | "reject",
  feedback = "",
): PengawasTestState {
  const resolution = state.resolutions.find((item) => item.issueId === issueId);
  if (!resolution || resolution.status !== "Menunggu approval customer") {
    return state;
  }

  const message =
    decision === "approve"
      ? "Usulan disetujui customer."
      : feedback.trim();
  if (decision === "reject" && message.length < 5) return state;

  const nextResolution: IssueResolution = {
    ...resolution,
    status:
      decision === "approve"
        ? "Ditindaklanjuti"
        : "Diskusi dengan pengawas",
    customerFeedback: message,
    discussion: [
      ...resolution.discussion,
      {
        id: `test-discussion-${issueId}-${resolution.discussion.length + 1}`,
        author: "Customer",
        message,
        date: new Date().toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      },
    ],
  };

  return saveTestIssueResolution(
    state,
    nextResolution,
    decision === "approve" ? "Disetujui customer" : undefined,
  );
}

export function countTestIssuesWithoutApproval(state: PengawasTestState) {
  return state.issueReports.filter(
    (issue) =>
      issue.supervisorState === "Menunggu" &&
      !state.resolutions.some((resolution) => resolution.issueId === issue.id),
  ).length;
}

export function completeTestIssues(state: PengawasTestState): PengawasTestState {
  const eligibleIssueIds = new Set(
    state.issueReports
      .filter(
        (issue) =>
          issue.supervisorState === "Menunggu" &&
          !state.resolutions.some((resolution) => resolution.issueId === issue.id),
      )
      .map((issue) => issue.id),
  );
  if (!eligibleIssueIds.size) return state;

  const issueReports = state.issueReports.map((issue) =>
    eligibleIssueIds.has(issue.id)
      ? {
          ...issue,
          supervisorState: "Ditindaklanjuti" as const,
          status: "Ditindaklanjuti" as const,
          followUp: "Kendala ditindaklanjuti tanpa memerlukan persetujuan customer.",
        }
      : issue,
  );
  const resolutions = [...state.resolutions];
  for (const issue of issueReports) {
    if (!eligibleIssueIds.has(issue.id)) continue;
    resolutions.push({
      id: `resolution-${issue.id}`,
      projectId: issue.projectId,
      issueId: issue.id,
      solution:
        "Gunakan pemasok alternatif dan sesuaikan urutan pekerjaan agar pekerjaan tetap berjalan.",
      source: "Pengawas",
      aiAnalysis: null,
      status: "Ditindaklanjuti",
      requiresCustomerApproval: false,
      approvalReason: "",
      approvalEvidence: null,
      impactType: null,
      additionalCost: null,
      additionalDays: null,
      customerFeedback: "",
      discussion: [],
      submitted: new Date().toISOString(),
    });
  }
  return withTestIssueReports({ ...state, resolutions }, issueReports);
}
export function syncTestProject(state: PengawasTestState): SupervisorProject {
  return { ...state.project, issues: supervisorIssuesFromReports(state.issueReports), issueReports: state.issueReports as MandorIssueReport[], resolutions: state.resolutions };
}
