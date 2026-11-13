"use client";

import { useEffect, useRef, useState } from "react";

type LocationMarqueeProps = {
  locations: string[];
};

export default function LocationMarquee({ locations }: LocationMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfRef = useRef(0);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const [fits, setFits] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const doubled = fits ? locations : [...locations, ...locations];

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const setWidth = track.scrollWidth / 2;
      halfRef.current = setWidth;
      setFits(setWidth <= viewport.clientWidth + 1);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fits) return;
    const track = trackRef.current;
    if (!track) return;

    let rafId: number | null = null;
    let last = performance.now();

    const apply = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const step = (now: number) => {
      rafId = requestAnimationFrame(step);
      const elapsed = now - last;
      last = now;

      if (dragging || hovered) return;

      offsetRef.current -= elapsed * 0.02;
      const half = halfRef.current;
      if (half > 0 && offsetRef.current <= -half) {
        offsetRef.current += half;
      }
      apply();
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [fits, dragging, hovered]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (fits) return;
    dragRef.current = {
      startX: event.clientX,
      startOffset: offsetRef.current,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag) return;

    const half = halfRef.current;
    let next = drag.startOffset + (event.clientX - drag.startX);
    if (half > 0) {
      next = (((next % half) + half) % half) - half;
    }
    offsetRef.current = next;
    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={`w-full overflow-hidden select-none ${
          fits ? "" : dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
      >
        <div
          ref={trackRef}
          className={`flex w-max gap-2 py-1 ${fits ? "" : "will-change-transform"}`}
        >
          {doubled.map((location, index) => (
            <span
              key={`${location}-${index}`}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[#cfe0f1] bg-white px-4 py-1.5 text-sm font-semibold text-[#173f68]"
            >
              {(index === 0 || index === locations.length) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="#0066ffff"
                  aria-label="Lokasi paling cocok"
                >
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z" />
                </svg>
              )}
              {location}
            </span>
          ))}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent"
      />
    </div>
  );
}
