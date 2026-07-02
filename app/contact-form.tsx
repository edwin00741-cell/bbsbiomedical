"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";
type Locale = "es" | "en";

export function ContactForm({ locale = "es" }: { locale?: Locale }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const isEnglish = locale === "en";

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
    <form className="grid max-w-2xl content-start gap-5 self-start" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white">
          {isEnglish ? "Name" : "Nombre"}
          <input
            className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
            name="name"
            placeholder={isEnglish ? "Your name" : "Tu nombre"}
            required
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Email
          <input
            className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
            name="email"
            placeholder={isEnglish ? "email@company.com" : "correo@empresa.com"}
            required
            type="email"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-white">
        {isEnglish ? "Phone" : "Teléfono"}
        <input
          className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
          name="phone"
          placeholder="+507 6202-3206"
          type="tel"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-white">
        {isEnglish ? "Message" : "Mensaje"}
        <textarea
          className="min-h-32 rounded-[8px] border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
          name="message"
          placeholder={
            isEnglish
              ? "Tell us which equipment or service you need reviewed."
              : "Cuéntanos qué equipo o servicio necesitas revisar."
          }
          required
        />
      </label>
      <button
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-slate-950 shadow-[0_14px_32px_rgba(255,255,255,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
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
          className={`text-sm font-bold ${
            status === "success" ? "text-cyan-200" : "text-red-200"
          }`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
