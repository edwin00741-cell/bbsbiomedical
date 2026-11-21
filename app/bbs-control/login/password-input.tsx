"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
export function PasswordInput({ label, hint, id: suppliedId, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  const generatedId = useId(), id = suppliedId || generatedId, [visible, setVisible] = useState(false);
  return <div className="bbs-password-field">
    {label ? <label htmlFor={id}>{label}</label> : null}
    <div className="bbs-password-control" style={{ position: "relative", display: "flex", minWidth: 0, width: "100%", alignItems: "stretch" }}>
      <input {...props} id={id} className={className || "bbs-auth-input"} style={{ minWidth: 0, width: "100%", ...props.style }} type={visible ? "text" : "password"} />
      <button type="button" className="bbs-password-toggle" aria-controls={id} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label?.toLocaleLowerCase("es") || "contraseña"}`} aria-pressed={visible} onClick={() => setVisible((value) => !value)} style={{ flexShrink: 0, border: "1px solid #b8c2ce", borderLeft: 0, background: "#edf1f5", color: "#233b5d", padding: "7px 11px", cursor: "pointer", font: "inherit" }}>{visible ? "Ocultar" : "Mostrar"}</button>
    </div>
    {hint ? <p className="bbs-auth-hint">{hint}</p> : null}
  </div>;
}
