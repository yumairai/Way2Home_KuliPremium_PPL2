import { describe, expect, it } from "vitest";
import {
  assignTestForemen,
  canPayTestInstallment,
  completeTestIssues,
  countTestIssuesWithoutApproval,
  decideTestCustomerIssue,
  loadPengawasTestState,
  payTestInstallment,
  progressCapForTestState,
  saveTestIssueResolution,
  signTestContract,
  type PengawasTestState,
} from "./pengawas-test";
import type { IssueResolution } from "./pengawas";

function createPendingIssueResolution(
  state: PengawasTestState,
): IssueResolution {
  const issue = state.issueReports[0];
  if (!issue) throw new Error("Expected a seeded test issue.");

  return {
    id: `resolution-${issue.id}`,
    projectId: issue.projectId,
    issueId: issue.id,
    solution: "Gunakan material setara yang tersedia dari pemasok alternatif.",
    source: "Pengawas",
    aiAnalysis: null,
    status: "Menunggu approval customer",
    requiresCustomerApproval: true,
    approvalReason: "Usulan memiliki tambahan biaya yang perlu disetujui.",
    approvalEvidence: null,
    impactType: "biaya",
    additionalCost: 1_000_000,
    additionalDays: null,
    customerFeedback: "",
    discussion: [],
    submitted: "26 November 2026",
  };
}

describe("signTestContract", () => {
  it("stores the supervisor signature locally and keeps the customer test asset", () => {
    const initial = loadPengawasTestState("signature-test-user");
    const assigned = assignTestForemen(initial, ["test-mandor-1"]);
    const signature = "data:image/png;base64,local-signature";

    const signed = signTestContract(assigned, signature);

    expect(signed.project.supervisorSignaturePath).toBe(signature);
    expect(signed.project.customerSignaturePath).toBe(
      "/test-assets/signatures/pengawas-signature.png",
    );
    expect(signed.project.payments[0].status).toBe("Lunas");
    expect(signed.testStage).toBe("berjalan");
  });
});

describe("test installment payments", () => {
  it("unlocks each installment at a reachable progress threshold", () => {
    const initial = loadPengawasTestState("installment-test-user");
    const assigned = assignTestForemen(initial, ["test-mandor-1"]);
    const signed = signTestContract(
      assigned,
      "data:image/png;base64,local-signature",
    );
    let state = {
      ...signed,
      project: { ...signed.project, progress: 30 },
    };

    expect(canPayTestInstallment(state, 1)).toBe(true);
    state = payTestInstallment(state, 1);
    expect(progressCapForTestState(state)).toBe(55);

    state = { ...state, project: { ...state.project, progress: 55 } };
    expect(canPayTestInstallment(state, 2)).toBe(true);
    state = payTestInstallment(state, 2);
    expect(progressCapForTestState(state)).toBe(78);

    state = { ...state, project: { ...state.project, progress: 78 } };
    expect(canPayTestInstallment(state, 3)).toBe(true);
    state = payTestInstallment(state, 3);
    expect(progressCapForTestState(state)).toBe(100);
  });
});

describe("test issue approval workflow", () => {
  it("only bypasses approval for issues without an existing resolution", () => {
    const initial = loadPengawasTestState("issue-bypass-test-user");
    const completed = completeTestIssues(initial);

    expect(countTestIssuesWithoutApproval(initial)).toBe(1);
    expect(completed.issueReports[0].status).toBe("Ditindaklanjuti");
    expect(completed.resolutions[0].requiresCustomerApproval).toBe(false);
    expect(countTestIssuesWithoutApproval(completed)).toBe(0);

    const awaitingCustomer = saveTestIssueResolution(
      initial,
      createPendingIssueResolution(initial),
    );
    expect(countTestIssuesWithoutApproval(awaitingCustomer)).toBe(0);
    expect(completeTestIssues(awaitingCustomer)).toBe(awaitingCustomer);
  });

  it("records customer rejection, resubmission, and approval locally", () => {
    const initial = loadPengawasTestState("issue-decision-test-user");
    const awaitingCustomer = saveTestIssueResolution(
      initial,
      createPendingIssueResolution(initial),
    );
    const issueId = initial.issueReports[0].id;

    const rejected = decideTestCustomerIssue(
      awaitingCustomer,
      issueId,
      "reject",
      "Mohon sesuaikan biaya dengan anggaran.",
    );
    expect(rejected.resolutions[0].status).toBe("Diskusi dengan pengawas");
    expect(rejected.issueReports[0].status).toBe("Menunggu");
    expect(rejected.resolutions[0].discussion[0].author).toBe("Customer");

    const resubmitted = saveTestIssueResolution(rejected, {
      ...rejected.resolutions[0],
      solution: "Gunakan material setara tanpa tambahan biaya.",
      status: "Menunggu approval customer",
      customerFeedback: "",
    });
    const approved = decideTestCustomerIssue(
      resubmitted,
      issueId,
      "approve",
    );

    expect(approved.resolutions[0].status).toBe("Ditindaklanjuti");
    expect(approved.issueReports[0].approvedResolution?.decisionLabel).toBe(
      "Disetujui customer",
    );
    expect(approved.issueReports[0].followUp).toBe(
      "Gunakan material setara tanpa tambahan biaya.",
    );
  });

  it("records the supervisor final-decision path after customer rejection", () => {
    const initial = loadPengawasTestState("issue-final-test-user");
    const awaitingCustomer = saveTestIssueResolution(
      initial,
      createPendingIssueResolution(initial),
    );
    const issueId = initial.issueReports[0].id;
    const rejected = decideTestCustomerIssue(
      awaitingCustomer,
      issueId,
      "reject",
      "Mohon tinjau lagi usulannya.",
    );
    const finalResolution = {
      ...rejected.resolutions[0],
      solution: "Keputusan final: lanjutkan dengan material alternatif.",
      status: "Ditindaklanjuti" as const,
    };
    const finalized = saveTestIssueResolution(
      rejected,
      finalResolution,
      "Keputusan final pengawas",
    );

    expect(finalized.issueReports[0].status).toBe("Ditindaklanjuti");
    expect(finalized.issueReports[0].approvedResolution?.decisionLabel).toBe(
      "Keputusan final pengawas",
    );
  });
});
