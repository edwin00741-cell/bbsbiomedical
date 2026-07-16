"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";
type Locale = "es" | "en";

export function ContactForm({ locale = "es" }: { locale?: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const isEnglish = locale === "en";
  const fieldClass =
    "h-12 rounded-[8px] border border-slate-200 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/12";
  const labelClass = "grid gap-2 text-sm font-black text-slate-900";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(
          result.message ||
            (isEnglish ? "The form could not be sent." : "No se pudo enviar el formulario."),
        );
      }

      form.reset();
      setStatus("success");
      setMessage(
        isEnglish
          ? "Message sent. We will contact you soon."
          : "Mensaje enviado. Te contactaremos pronto.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : isEnglish
            ? "The form could not be sent."
            : "No se pudo enviar el formulario.",
      );
    }
  }

  return (
    <form
      className="relative grid max-w-2xl content-start gap-5 self-start overflow-hidden rounded-[8px] border border-cyan-200/40 bg-white p-6 text-slate-950 shadow-[0_26px_70px_rgba(8,47,73,0.22)] sm:p-8"
      onSubmit={handleSubmit}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-sky-300/35 blur-3xl" />

      <div className="relative border-b border-slate-200 pb-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">
          {isEnglish ? "Technical request" : "Solicitud técnica"}
        </p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">
          {isEnglish ? "Tell us what you need" : "Cuéntanos qué necesitas"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isEnglish
            ? "We will review your request and coordinate the next technical step."
            : "Revisaremos tu solicitud y coordinaremos el siguiente paso técnico."}
        </p>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {isEnglish ? "Name" : "Nombre"}
          <input
            className={fieldClass}
            name="name"
            placeholder={isEnglish ? "Your name" : "Tu nombre"}
            required
            type="text"
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            className={fieldClass}
            name="email"
            placeholder={isEnglish ? "email@company.com" : "correo@empresa.com"}
            required
            type="email"
          />
        </label>
      </div>

      <div className="relative grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {isEnglish ? "Phone" : "Teléfono"}
          <input
            className={fieldClass}
            name="phone"
            placeholder="+507 6202-3206"
            type="tel"
          />
        </label>
        <label className={labelClass}>
          {isEnglish ? "Service" : "Servicio"}
          <select
            className={`${fieldClass} appearance-none`}
            defaultValue=""
            name="service"
          >
            <option disabled value="">
              {isEnglish ? "Select service" : "Selecciona servicio"}
            </option>
            <option>{isEnglish ? "Technical service" : "Servicio técnico"}</option>
            <option>{isEnglish ? "Metrology" : "Metrología"}</option>
            <option>{isEnglish ? "Radiological protection" : "Protección radiológica"}</option>
            <option>{isEnglish ? "Regulatory management" : "Gestión regulatoria"}</option>
            <option>{isEnglish ? "Other request" : "Otra solicitud"}</option>
          </select>
        </label>
      </div>

      <label className={`${labelClass} relative`}>
        {isEnglish ? "Message" : "Mensaje"}
        <textarea
          className="min-h-32 rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/12"
          name="message"
          placeholder={
            isEnglish
              ? "Tell us which equipment or service you need reviewed."
              : "Cuéntanos qué equipo o servicio necesitas revisar."
          }
          required
        />
      </label>

      <div className="relative flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
        <button
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-7 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.28)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
          disabled={status === "loading"}
          type="submit"
        >
          <Send size={17} />
          {status === "loading"
            ? isEnglish
              ? "Sending..."
              : "Enviando..."
            : isEnglish
              ? "Send request"
              : "Enviar solicitud"}
        </button>
        {message ? (
          <p
            className={`inline-flex items-center gap-2 text-sm font-bold ${
              status === "success" ? "text-cyan-700" : "text-red-600"
            }`}
          >
            {status === "success" ? <CheckCircle2 size={17} /> : null}
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
