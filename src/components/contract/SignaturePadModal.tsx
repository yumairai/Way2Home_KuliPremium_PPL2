"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function SignaturePadModal({
  onContinue,
  onClose,
  busy = false,
}: {
  onContinue: (signature: string) => void | Promise<void>;
  onClose: () => void;
  busy?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);
  const [ready, setReady] = useState(false);
  const [inked, setInked] = useState(false);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const old = document.createElement("canvas");
    old.width = canvas.width;
    old.height = canvas.height;
    old.getContext("2d")?.drawImage(canvas, 0, 0);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineWidth = 2.4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#102b43";
    if (old.width && old.height)
      context.drawImage(old, 0, 0, rect.width, rect.height);
    setReady(true);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [busy, onClose, resize]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    previous.current = point(event);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !previous.current) return;
    const next = point(event);
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    context.beginPath();
    context.moveTo(previous.current.x, previous.current.y);
    context.lineTo(next.x, next.y);
    context.stroke();
    previous.current = next;
    hasInk.current = true;
    setInked(true);
  };
  const stop = () => {
    drawing.current = false;
    previous.current = null;
  };
  const reset = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setInked(false);
  };
  const proceed = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk.current) return;
    await onContinue(canvas.toDataURL("image/png"));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b1b2b]/65 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-title"
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="border-b border-slate-200 px-6 py-5">
          <h2 id="signature-title" className="text-lg font-bold text-[#17344e]">
            Tanda tangan digital
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Gambar tanda tangan di area berikut. Tanda tangan tersimpan sebagai
            persetujuan digital pada kontrak ini.
          </p>
        </header>
        <canvas
          ref={canvasRef}
          aria-label="Area gambar tanda tangan"
          className="m-5 h-52 w-[calc(100%-2.5rem)] touch-none rounded-xl border border-dashed border-slate-400 bg-[#fbfcfd]"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
        {!ready && (
          <p className="px-6 text-xs text-slate-500">
            Menyiapkan area tanda tangan…
          </p>
        )}
        <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={reset}
            className="min-h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={busy || !inked}
            onClick={proceed}
            className="min-h-11 rounded-lg bg-[#183b57] px-6 text-sm font-semibold text-white hover:bg-[#234f70] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Continue"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="min-h-11 rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
          >
            Batal
          </button>
        </footer>
      </section>
    </div>
  );
}
