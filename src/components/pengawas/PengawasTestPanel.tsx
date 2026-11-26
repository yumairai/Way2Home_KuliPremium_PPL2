"use client";

import { useState } from "react";
import {
  completeTestIssues,
  canPayTestInstallment,
  countTestIssuesWithoutApproval,
  createTestMilestoneReports,
  payTestInstallment,
  progressCapForTestState,
  resetPengawasTestState,
  TEST_INSTALLMENT_PROGRESS_CAPS,
  TEST_INSTALLMENT_UNLOCK_PROGRESS,
  type PengawasTestState,
} from "@/data/pengawas-test";

type TestStateProps = {
  state: PengawasTestState;
  setState: (next: PengawasTestState) => void;
};

export function PengawasTestControls({
  state,
  setState,
  userId,
}: TestStateProps & { userId: string }) {
  const issuesWithoutApproval = countTestIssuesWithoutApproval(state);
  const next = state.project.milestones[state.reportableMilestone];
  const hasPendingReport = state.project.reports.some(
    (report) => report.milestoneId === next?.id && report.decision === "Menunggu",
  );
  const canCreateReports =
    state.testStage === "berjalan" && !!next && !hasPendingReport;

  return (
    <section className="rounded-2xl border border-[#e3e9ee] bg-white p-5 md:p-6">
      <div>
        <h2 className="text-[15px] font-bold text-[#263d53]">
          Kontrol simulasi proyek
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Buat laporan mandor dummy dan uji penanganan kendala. Keputusan
          customer dan tindak lanjut hanya tersimpan secara lokal.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canCreateReports}
          onClick={() => setState(createTestMilestoneReports(state))}
          className="min-h-10 rounded-lg bg-[#183b57] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {next
            ? `Buat laporan milestone ${state.reportableMilestone + 1}`
            : "Semua milestone selesai"}
        </button>
        <button
          type="button"
          disabled={!issuesWithoutApproval}
          onClick={() => setState(completeTestIssues(state))}
          className="min-h-10 rounded-lg border border-[#dfe6ed] px-4 py-2 text-xs font-semibold text-[#355c78] hover:bg-[#f3f7fa] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Selesaikan tanpa approval ({issuesWithoutApproval})
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Reset project ke tahap awal assignment admin? Mandor, kontrak, pembayaran, laporan, dan progress akan dihapus.",
              )
            ) {
              setState(resetPengawasTestState(userId));
            }
          }}
          className="min-h-10 rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
        >
          Reset simulasi
        </button>
      </div>
    </section>
  );
}

export default function PengawasTestPanel({
  state,
  setState,
}: TestStateProps) {
  const [open, setOpen] = useState(false);
  const nextPayment = [1, 2, 3].find(
    (item) => !state.paidInstallments.includes(item),
  );
  const currentCap = progressCapForTestState(state);
  const progressTarget = nextPayment
    ? TEST_INSTALLMENT_PROGRESS_CAPS[nextPayment - 1]
    : null;
  const progressUnlock = nextPayment
    ? TEST_INSTALLMENT_UNLOCK_PROGRESS[nextPayment - 1]
    : null;
  const canPayNext =
    nextPayment !== undefined &&
    canPayTestInstallment(state, nextPayment);
  const isPaymentReady = state.testStage === "berjalan";

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[min(360px,calc(100vw-2.5rem))]">
      {open && (
        <section className="mb-3 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
          <header className="bg-amber-100 px-4 py-3 text-[#3c341a]">
            <b className="text-sm">Pembayaran testing</b>
            <p className="mt-0.5 text-[11px]">
              Simulasikan pembayaran cicilan dan batas progres.
            </p>
          </header>
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span>Progres proyek</span>
              <b>{state.project.progress}%</b>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span>Batas verifikasi</span>
              <b>{currentCap}%</b>
            </div>
            {nextPayment && progressTarget && progressUnlock && (
              <button
                type="button"
                disabled={!canPayNext}
                onClick={() =>
                  setState(payTestInstallment(state, nextPayment))
                }
                className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bayar cicilan {nextPayment}
                <small className="mt-1 block font-normal">
                  {canPayNext
                    ? `Batas progres menjadi ${progressTarget}%`
                    : `Tersedia saat progres mencapai ${progressUnlock}%`}
                </small>
              </button>
            )}
            {!isPaymentReady && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                Pembayaran cicilan tersedia setelah kontrak ditandatangani.
                Tanda tangan customer dan pembayaran DP disimulasikan otomatis.
              </p>
            )}
            {isPaymentReady && !nextPayment && (
              <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">
                Semua cicilan sudah lunas.
              </p>
            )}
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="Mode testing aktif"
        className="ml-auto flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#78350f] shadow-lg hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
      >
        MODE TESTING
      </button>
    </div>
  );
}
