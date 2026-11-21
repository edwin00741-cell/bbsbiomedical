"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createHash } from "node:crypto";
import { Resend } from "resend";
import { catalogSchema, clientReturnPath, commercialClientSchema, statementEmailSchema } from "../../../lib/bbs-control/client-commercial";
import { getClientStatement } from "../../../lib/bbs-control/client-statement";
import { renderClientStatementPdf } from "../../../lib/bbs-control/client-statement-pdf";
import { getBusinessSettings } from "../../../lib/bbs-control/quotes";
import { panamaToday } from "../../../lib/bbs-control/list-filters";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../../lib/bbs-control/supabase-server";

export type ClientActionResult = { error: string; success?: string; entry?: { id: string; name: string } };

function databaseMessage(error: { code?: string }) {
  if (error.code === "23505") return "Ya existe un registro con ese nombre.";
  if (error.code === "23503") return "Registro en uso o referencia eliminada. Revise grupo, vendedor y método de pago.";
  return "No se pudieron guardar los cambios. Intente nuevamente.";
}

export async function saveCommercialClient(formData: FormData): Promise<ClientActionResult> {
  const actor = await requireBackOfficeUser();
  const parsed = commercialClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Datos inválidos." };
  const id = formData.get("client_id");
  const version = formData.get("version");
  if (id && (!z.uuid().safeParse(id).success || !z.iso.datetime({ offset: true }).safeParse(version).success)) {
    return { error: "Referencia del cliente inválida. Cierre y vuelva a abrir el formulario." };
  }
  const supabase = await createSupabaseServerClient();
  const query = id ? supabase.from("clients").update(parsed.data).eq("id", id).eq("updated_at", version)
    : supabase.from("clients").insert({ ...parsed.data, created_by: actor.id });
  const { data, error } = await query.select("id").maybeSingle();
  if (error) return { error: databaseMessage(error) };
  if (!data) return { error: "Otro usuario modificó este cliente. Cierre y vuelva a abrir el formulario antes de guardar." };
  revalidatePath("/bbs-control/clientes");
  revalidatePath("/bbs-control/cotizaciones/nueva");
  const url = new URL(clientReturnPath(formData.get("return_to")), "http://bbs.local");
  url.searchParams.set("selected", data.id);
  url.searchParams.set("success", id ? "Cliente actualizado." : "Cliente creado.");
  redirect(`${url.pathname}${url.search}`);
}

export async function setClientActive(formData: FormData): Promise<ClientActionResult> {
  await requireBackOfficeUser();
  const id = z.uuid().safeParse(formData.get("client_id"));
  const version = z.iso.datetime({ offset: true }).safeParse(formData.get("version"));
  const active = formData.get("active");
  if (!id.success || !version.success || !["true", "false"].includes(String(active))) return { error: "Referencia inválida." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").update({ is_active: active === "true" })
    .eq("id", id.data).eq("updated_at", version.data).select("id").maybeSingle();
  if (error) return { error: databaseMessage(error) };
  if (!data) return { error: "Cliente modificado por otro usuario. Actualice la página." };
  revalidatePath("/bbs-control/clientes");
  revalidatePath("/bbs-control/cotizaciones/nueva");
  return { error: "", success: active === "true" ? "Cliente activado." : "Cliente desactivado." };
}

export async function deleteCommercialClient(formData: FormData): Promise<ClientActionResult> {
  await requireBackOfficeUser();
  const id = z.uuid().safeParse(formData.get("client_id"));
  const version = z.iso.datetime({ offset: true }).safeParse(formData.get("version"));
  if (!id.success || !version.success) return { error: "Referencia inválida." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("clients").delete()
    .eq("id", id.data).eq("updated_at", version.data).select("id").maybeSingle();
  if (error?.code === "23503") return { error: "Cliente con documentos asociados. Desactívelo para conservar su historial." };
  if (error) return { error: "No se pudo borrar el cliente." };
  if (!data) return { error: "Cliente modificado por otro usuario. Actualice la página." };
  revalidatePath("/bbs-control/clientes");
  revalidatePath("/bbs-control/cotizaciones/nueva");
  const url = new URL(clientReturnPath(formData.get("return_to")), "http://bbs.local");
  url.searchParams.delete("selected");
  url.searchParams.set("success", "Cliente eliminado.");
  redirect(url.pathname + url.search);
}

export async function saveClientCatalog(formData: FormData): Promise<ClientActionResult> {
  await requireBackOfficeUser();
  const parsed = catalogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Datos inválidos." };
  const { kind, id, name } = parsed.data;
  const table = { group: "client_groups", salesperson: "salespeople", payment_method: "payment_methods" }[kind];
  const supabase = await createSupabaseServerClient();
  const query = id ? supabase.from(table).update({ name }).eq("id", id) : supabase.from(table).insert({ name });
  const { data, error } = await query.select("id").maybeSingle();
  if (error) return { error: databaseMessage(error) };
  if (!data) return { error: "Registro no encontrado. Actualice la página." };
  revalidatePath("/bbs-control/clientes");
  return { error: "", success: "Registro guardado.", entry: { id: data.id, name } };
}

export async function deleteClientCatalog(formData: FormData): Promise<ClientActionResult> {
  await requireBackOfficeUser();
  const kind = z.enum(["group", "salesperson"]).safeParse(formData.get("kind"));
  const id = z.uuid().safeParse(formData.get("id"));
  if (!kind.success || !id.success) return { error: "Referencia inválida." };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from(kind.data === "group" ? "client_groups" : "salespeople")
    .delete().eq("id", id.data).select("id").maybeSingle();
  if (error?.code === "23503") return { error: "Registro asignado a clientes. Cambie esas asignaciones antes de borrarlo." };
  if (error) return { error: "No se pudo borrar el registro." };
  if (!data) return { error: "Registro no encontrado." };
  revalidatePath("/bbs-control/clientes");
  return { error: "", success: "Registro eliminado." };
}

export async function sendClientStatement(formData: FormData): Promise<ClientActionResult> {
  await requireBackOfficeUser();
  const parsed = statementEmailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Datos inválidos." };
  if (!process.env.RESEND_API_KEY) return { error: "El envío de correo no está configurado. Puede descargar el estado de cuenta." };
  try {
    const statement = await getClientStatement(parsed.data.client_id);
    if (!statement) return { error: "Cliente no encontrado." };
    const settings = await getBusinessSettings();
    const pdf = await renderClientStatementPdf(statement.client, statement.invoices, settings, panamaToday());
    const key = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Biomedical Business and Service <no-reply@bbsbiomedical.com>",
      to: parsed.data.recipients, subject: parsed.data.subject, text: parsed.data.message,
      attachments: [{ filename: "estado-de-cuenta.pdf", content: pdf }],
    }, { idempotencyKey: `bbs-client-statement-${key}` });
    if (result.error) return { error: "No se pudo enviar el correo. Revise los datos e intente nuevamente." };
    return { error: "", success: "Estado de cuenta enviado." };
  } catch { return { error: "No se pudo confirmar el envío. Revise su correo antes de reenviar." }; }
}
