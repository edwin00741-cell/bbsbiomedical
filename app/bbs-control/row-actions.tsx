"use client";
import { useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown } from "lucide-react";
export function RowActions({ label = "Acciones", children }: { label?: string; children: React.ReactNode }) {
  const id = useId();
  const menu = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  return <>
    <button type="button" className="bbs-button bbs-button-primary" popoverTarget={id} aria-label={label}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const height = Math.min(menu.current?.scrollHeight || 340, window.innerHeight - 24);
        const top = rect.bottom + height + 8 < window.innerHeight ? rect.bottom + 2 : Math.max(8, rect.top - height);
        setPosition({ top, left: Math.max(8, Math.min(rect.right - 230, window.innerWidth - 238)) });
      }}><span>Acciones</span><ChevronDown size={13} aria-hidden="true" /></button>
    <div ref={menu} id={id} popover="auto" className="bbs-row-popover" style={position}>{children}</div>
  </>;
}
export function ActionSubmit({ children, confirmMessage, danger = false }: { children: React.ReactNode; confirmMessage?: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={danger ? "bbs-danger" : undefined}
    onClick={(event) => { if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault(); }}>
    {pending ? "Procesando…" : children}
  </button>;
}
