import type { Project } from "@/types/proyek";
import { formatDate, formatRupiah } from "@/utils/format";

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  lunas: { label: "Lunas", style: "bg-[#ecfdf5] text-[#065f46]" },
  aktif: { label: "Berjalan", style: "bg-[#eef5ff] text-[#004796]" },
  menunggu: { label: "Menunggu", style: "bg-[#fffaf0] text-[#92400e]" },
  akan_datang: { label: "Akan Datang", style: "bg-[#f1f5f9] text-[#475569]" },
};

export default function PaymentsSection({ project }: { project: Project }) {
  return (
    <section className="rounded-[1.5rem] border border-[#dbe4f2] bg-white p-6 shadow-[0_12px_30px_rgba(17,30,63,0.06)] md:p-8">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#475569]">Tahapan Pembayaran</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {project.payments.map((payment) => {
          const badge = STATUS_BADGE[payment.status];
          return (
            <div
              key={payment.periode}
              className={`rounded-2xl border p-4 ${payment.status === "aktif"
                ? "border-[#004796] bg-[#eef5ff]"
                : "border-[#dbe4f2] bg-white"
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">{payment.label}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${badge.style}`}>
                  {badge.label}
                </span>
              </div>
              <p className="mt-2 text-lg font-bold text-[#111e3f]">{formatRupiah(payment.amount)}</p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#64748b]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                </svg>
                Jatuh tempo {formatDate(payment.dueDate)}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#fffaf0] p-4 text-sm leading-6 text-[#92400e]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <p><strong>Informasi penting:</strong> Jika pembayaran belum dilunasi sesuai jadwal, pengerjaan proyek akan ditunda sementara.</p>
      </div>
    </section>
  );
}
