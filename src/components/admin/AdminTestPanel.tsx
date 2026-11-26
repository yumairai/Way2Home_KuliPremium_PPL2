"use client";

import { useState } from "react";

export default function AdminTestPanel({
  reset,
}: {
  reset: () => unknown;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[80] w-[min(350px,calc(100vw-2.5rem))]">
      {open && (
        <section className="mb-3 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xl">
          <header className="bg-[#183b57] px-4 py-3 text-white">
            <b className="text-sm">Mode testing admin</b>
            <p className="mt-1 text-[11px] text-blue-100">
              Empat halaman memakai data lokal untuk testing
            </p>
          </header>
          <div className="space-y-2 p-3 text-xs text-slate-600">
            <p className="rounded-xl bg-slate-50 p-3">
              State lokal tersimpan di browser. Tekan tombol untuk mereset semua
              data testing.
            </p>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Kembalikan seluruh halaman admin ke fixture awal? Semua keputusan dan alokasi lokal akan dihapus.",
                  )
                ) {
                  reset();
                }
              }}
              className="w-full rounded-xl border border-rose-200 px-3 py-2.5 text-left font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
            >
              Reset semua data testing
            </button>
          </div>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Mode testing admin aktif"
        className="ml-auto flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#78350f] shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
      >
        MODE TESTING
      </button>
    </div>
  );
}
