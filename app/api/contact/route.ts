import { NextResponse } from "next/server";
import { Resend } from "resend";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const contactToEmail = process.env.CONTACT_TO_EMAIL;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "BBS Biomedical <onboarding@resend.dev>";

export async function POST(request: Request) {
  const payload = (await request.json()) as ContactPayload;
  const name = payload.name?.trim();
  const email = payload.email?.trim();
  const phone = payload.phone?.trim();
  const message = payload.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { message: "Nombre, email y mensaje son requeridos." },
      { status: 400 },
    );
  }

  if (!resendApiKey || !contactToEmail) {
    return NextResponse.json(
      { message: "Formulario no configurado todavía." },
      { status: 503 },
    );
  }

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: resendFromEmail,
    to: contactToEmail,
    replyTo: email,
    subject: `Nueva solicitud web de ${name}`,
    text: [
      `Nombre: ${name}`,
      `Email: ${email}`,
      `Teléfono: ${phone || "No indicado"}`,
      "",
      "Mensaje:",
      message,
    ].join("\n"),
  });

  return NextResponse.json({ message: "Mensaje enviado." });
}
