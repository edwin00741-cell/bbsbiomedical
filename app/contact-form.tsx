"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

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
        throw new Error(result.message || "No se pudo enviar el formulario.");
      }

      form.reset();
      setStatus("success");
      setMessage("Mensaje enviado. Te contactaremos pronto.");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el formulario.",
      );
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white">
          Nombre
          <input
            className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
            name="name"
            placeholder="Tu nombre"
            required
            type="text"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-white">
          Email
          <input
            className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
            name="email"
            placeholder="correo@empresa.com"
            required
            type="email"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-bold text-white">
        Teléfono
        <input
          className="h-12 rounded-[8px] border border-white/15 bg-white/10 px-4 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
          name="phone"
          placeholder="+507 6000-0000"
          type="tel"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-white">
        Mensaje
        <textarea
          className="min-h-32 rounded-[8px] border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300"
          name="message"
          placeholder="Cuéntanos qué equipo o servicio necesitas revisar."
          required
        />
      </label>
      <button
        className="btn-light w-fit disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "loading"}
        type="submit"
      >
        <Send size={18} />
        {status === "loading" ? "Enviando..." : "Enviar solicitud"}
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
