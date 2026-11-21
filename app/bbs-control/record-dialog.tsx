"use client";
import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
export function RecordDialog({ title, closeHref, children }: { title: string; closeHref: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const router = useRouter();
  useEffect(() => { if (!ref.current?.open) ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="bbs-dialog" aria-labelledby={id} onClose={(event) => {
    if (event.target === event.currentTarget) router.replace(closeHref, { scroll: false });
  }}>
    <div className="bbs-dialog-header"><h2 id={id}>{title}</h2><button className="bbs-button" type="button" aria-label="Cerrar" onClick={() => ref.current?.close()}><X size={18} /></button></div>
    {children}
  </dialog>;
}
