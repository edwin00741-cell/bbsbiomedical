"use client";

import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type MaintenanceRevealProps = {
  imageSrc: string;
  beforeLabel: string;
  afterLabel: string;
  ariaLabel: string;
};

export function MaintenanceReveal({
  imageSrc,
  beforeLabel,
  afterLabel,
  ariaLabel,
}: MaintenanceRevealProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const x = clientX - rect.left;
    const next = Math.max(4, Math.min(96, (x / rect.width) * 100));
    setPosition(next);
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (isDragging) {
        updatePosition(event.clientX);
      }
    }

    function handlePointerUp() {
      setIsDragging(false);
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(position)}
      className="relative aspect-[16/10] w-full cursor-ew-resize touch-none overflow-hidden rounded-[8px] border border-white/10 bg-slate-200 shadow-[0_28px_70px_rgba(0,0,0,0.28)] select-none"
      onPointerDown={(event) => {
        setIsDragging(true);
        updatePosition(event.clientX);
      }}
      ref={containerRef}
      role="slider"
      tabIndex={0}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-left bg-no-repeat"
        style={{ backgroundImage: `url("${imageSrc}")`, backgroundSize: "200% 100%" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-right bg-no-repeat"
        style={{
          backgroundImage: `url("${imageSrc}")`,
          backgroundSize: "200% 100%",
          clipPath: `inset(0 0 0 ${position}%)`,
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.18))]" />

      <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white backdrop-blur">
        {beforeLabel}
      </span>
      <span className="absolute right-4 top-4 rounded-full bg-cyan-500/90 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white backdrop-blur">
        {afterLabel}
      </span>

      <div
        className="absolute bottom-0 top-0 z-10 w-1 bg-white shadow-[0_0_28px_rgba(15,23,42,0.35)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-cyan-500 bg-white text-cyan-700 shadow-2xl">
          <GripVertical size={22} strokeWidth={2.6} />
        </div>
      </div>
    </div>
  );
}
