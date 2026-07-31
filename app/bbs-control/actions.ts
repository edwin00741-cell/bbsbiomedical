"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { renderQuotePdfBuffer } from "../../lib/bbs-control/quote-pdf";
import { getBusinessSettings, getQuoteWithItems } from "../../lib/bbs-control/quotes";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getBackOfficeUser,
  requireBackOfficeUser,
} from "../../lib/bbs-control/supabase-server";
import type { BbsRole, QuoteStatus } from "../../lib/bbs-control/types";
import {
  businessSettingsSchema,
  clientSchema,
  itemSchema,
  quoteSchema,
  quoteStatusSchema,
  userSchema,
} from "../../lib/bbs-control/validation";
import { usernameToInternalEmail } from "../../lib/bbs-control/env";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function safeBackOfficePath(path: string) {
  return path.startsWith("/bbs-control") && !path.startsWith("/bbs-control/login")
    ? path
    : "/bbs-control";
}

function parseQuoteItems(formData: FormData) {
  return Array.from({ length: 8 })
    .map((_, index) => ({
      item_id: formValue(formData, `item_id_${index}`) || null,
      description: formValue(formData, `item_description_${index}`),
      quantity: formValue(formData, `item_quantity_${index}`),
      unit_price: formValue(formData, `item_unit_price_${index}`),
    }))
    .filter((item) => item.description.trim().length > 0);
}

async function insertQuoteEvent(quoteId: string, eventType: string, note?: string) {
  const actor = await requireBackOfficeUser();
  const supabase = await createSupabaseServerClient();

  await supabase.from("quote_events").insert({
    quote_id: quoteId,
    actor_id: actor.id,
    event_type: eventType,
    note: note || null,
  });
}

export async function signInAction(formData: FormData) {
  const username = formValue(formData, "username").trim().toLowerCase();
  const password = formValue(formData, "password");
  const nextPath = safeBackOfficePath(formValue(formData, "next"));

  if (!username || !password) {
    redirectWithError("/bbs-control/login", "Usuario y contraseña requeridos.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToInternalEmail(username),
    password,
  });

  if (error) {
    const message = error.message.toLowerCase().includes("fetch")
      ? "No se pudo conectar con Supabase. Reinicia el servidor local con acceso de red."
      : "Credenciales inválidas.";
    redirectWithError("/bbs-control/login", message);
  }

  const actor = await getBackOfficeUser();

  if (!actor) {
    await supabase.auth.signOut();
    redirectWithError("/bbs-control/login", "El usuario no tiene un perfil interno activo.");
  }

  if (!actor.is_active) {
    await supabase.auth.signOut();
    redirectWithError("/bbs-control/login", "Usuario inactivo.");
  }

  redirect(nextPath);
}
export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/bbs-control/login");
}

export async function createClientAction(formData: FormData) {
  const actor = await requireBackOfficeUser();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError("/bbs-control/clientes", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").insert({
    ...parsed.data,
    created_by: actor.id,
  });

  if (error) {
    redirectWithError("/bbs-control/clientes", error.message);
  }

  revalidatePath("/bbs-control/clientes");
  redirect("/bbs-control/clientes?success=Cliente creado.");
}

export async function updateClientAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "client_id");
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));

  if (!id) {
    redirectWithError("/bbs-control/clientes", "Cliente no encontrado.");
  }

  if (!parsed.success) {
    redirectWithError("/bbs-control/clientes", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);

  if (error) {
    redirectWithError("/bbs-control/clientes", error.message);
  }

  revalidatePath("/bbs-control/clientes");
  redirect("/bbs-control/clientes?success=Cliente actualizado.");
}

export async function createUserAction(formData: FormData) {
  const actor = await requireBackOfficeUser();
  const parsed = userSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError("/bbs-control/usuarios", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const role = parsed.data.role as BbsRole;

  if (role === "super_admin" && actor.role !== "super_admin") {
    redirectWithError("/bbs-control/usuarios", "Solo super admin puede crear otro super admin.");
  }

  const admin = createSupabaseAdminClient();
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: usernameToInternalEmail(parsed.data.username),
    password: parsed.data.password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    redirectWithError("/bbs-control/usuarios", authError?.message || "No se pudo crear el usuario.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    username: parsed.data.username,
    full_name: parsed.data.full_name,
    role,
    created_by: actor.id,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    redirectWithError("/bbs-control/usuarios", profileError.message);
  }

  revalidatePath("/bbs-control/usuarios");
  redirect("/bbs-control/usuarios?success=Usuario creado.");
}
export async function createItemAction(formData: FormData) {
  const actor = await requireBackOfficeUser();
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError("/bbs-control/articulos", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("items").insert({
    ...parsed.data,
    created_by: actor.id,
  });

  if (error) {
    redirectWithError("/bbs-control/articulos", error.message);
  }

  revalidatePath("/bbs-control/articulos");
  redirect("/bbs-control/articulos?success=Artículo creado.");
}

export async function updateBusinessSettingsAction(formData: FormData) {
  await requireBackOfficeUser();
  const parsed = businessSettingsSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirectWithError("/bbs-control/configuracion", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const supabase = await createSupabaseServerClient();
  const { id, ...values } = parsed.data;
  const payload = {
    ...values,
    legal_name: values.legal_name || values.business_name,
  };
  const { error } = id
    ? await supabase.from("business_settings").update(payload).eq("id", id)
    : await supabase.from("business_settings").insert(payload);

  if (error) {
    redirectWithError("/bbs-control/configuracion", error.message);
  }

  revalidatePath("/bbs-control/configuracion");
  redirect("/bbs-control/configuracion?success=Configuración actualizada.");
}

export async function createQuoteAction(formData: FormData) {
  const actor = await requireBackOfficeUser();
  const items = parseQuoteItems(formData);
  const raw = {
    client_id: formValue(formData, "client_id") || null,
    client_name: formValue(formData, "client_name"),
    client_email: formValue(formData, "client_email"),
    seller_name: formValue(formData, "seller_name"),
    issue_date: formValue(formData, "issue_date"),
    valid_until: formValue(formData, "valid_until"),
    project_description: formValue(formData, "project_description"),
    notes: formValue(formData, "notes"),
    items,
  };
  const parsed = quoteSchema.safeParse(raw);

  if (!parsed.success) {
    redirectWithError("/bbs-control/cotizaciones/nueva", parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase.from("quotes")
    .insert({
      client_id: parsed.data.client_id,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      seller_name: parsed.data.seller_name,
      issue_date: parsed.data.issue_date,
      valid_until: parsed.data.valid_until,
      project_description: parsed.data.project_description,
      notes: parsed.data.notes,
      subtotal,
      total: subtotal,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !quote) {
    redirectWithError("/bbs-control/cotizaciones/nueva", error?.message || "No se pudo crear la cotización.");
  }

  const { error: itemsError } = await supabase.from("quote_items").insert(
    parsed.data.items.map((item, index) => ({
      quote_id: quote.id,
      item_id: item.item_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: index,
    })),
  );

  if (itemsError) {
    redirectWithError(`/bbs-control/cotizaciones/${quote.id}`, itemsError.message);
  }

  await insertQuoteEvent(quote.id, "created", "Cotización creada.");
  revalidatePath("/bbs-control/cotizaciones");
  redirect(`/bbs-control/cotizaciones/${quote.id}?success=Cotización creada.`);
}

export async function updateQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const items = parseQuoteItems(formData);
  const raw = {
    client_id: formValue(formData, "client_id") || null,
    client_name: formValue(formData, "client_name"),
    client_email: formValue(formData, "client_email"),
    seller_name: formValue(formData, "seller_name"),
    issue_date: formValue(formData, "issue_date"),
    valid_until: formValue(formData, "valid_until"),
    project_description: formValue(formData, "project_description"),
    notes: formValue(formData, "notes"),
    items,
  };
  const parsed = quoteSchema.safeParse(raw);

  if (!parsed.success) {
    redirectWithError(`/bbs-control/cotizaciones/${id}/editar`, parsed.error.issues[0]?.message || "Datos inválidos.");
  }

  const subtotal = parsed.data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0,
  );
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("quotes")
    .update({
      client_id: parsed.data.client_id,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      seller_name: parsed.data.seller_name,
      issue_date: parsed.data.issue_date,
      valid_until: parsed.data.valid_until,
      project_description: parsed.data.project_description,
      notes: parsed.data.notes,
      subtotal,
      total: subtotal,
    })
    .eq("id", id);

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}/editar`, error.message);
  }

  await supabase.from("quote_items").delete().eq("quote_id", id);
  const { error: itemsError } = await supabase.from("quote_items").insert(
    parsed.data.items.map((item, index) => ({
      quote_id: id,
      item_id: item.item_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: index,
    })),
  );

  if (itemsError) {
    redirectWithError(`/bbs-control/cotizaciones/${id}/editar`, itemsError.message);
  }

  await insertQuoteEvent(id, "updated", "Cotización editada.");
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Cotización actualizada.`);
}

export async function updateQuoteStatusAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const status = quoteStatusSchema.parse(formValue(formData, "status")) as QuoteStatus;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.message);
  }

  await insertQuoteEvent(id, "status_changed", `Estado actualizado a ${status}.`);
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Estado actualizado.`);
}

export async function markQuoteSentAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("quotes").update({ status: "sent" }).eq("id", id);

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.message);
  }

  await insertQuoteEvent(id, "marked_sent", "Marcada como enviada manualmente.");
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Cotización marcada como enviada.`);
}

export async function deleteQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.message);
  }

  revalidatePath("/bbs-control/cotizaciones");
  redirect("/bbs-control/cotizaciones?success=Cotización borrada.");
}

export async function duplicateQuoteAction(formData: FormData) {
  const actor = await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const source = await getQuoteWithItems(id);

  if (!source) {
    redirectWithError("/bbs-control/cotizaciones", "Cotización no encontrada.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase.from("quotes")
    .insert({
      client_id: source.client_id,
      client_name: source.client_name,
      client_email: source.client_email,
      seller_name: source.seller_name,
      project_description: source.project_description,
      notes: source.notes,
      subtotal: source.subtotal,
      total: source.total,
      created_by: actor.id,
    })
    .select("id")
    .single();

  if (error || !quote) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error?.message || "No se pudo duplicar.");
  }

  await supabase.from("quote_items").insert(
    source.items.map((item, index) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position: index,
    })),
  );
  await insertQuoteEvent(quote.id, "duplicated", `Duplicada desde ${source.quote_number}.`);
  revalidatePath("/bbs-control/cotizaciones");
  redirect(`/bbs-control/cotizaciones/${quote.id}?success=Cotización duplicada.`);
}

export async function sendQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const quote = await getQuoteWithItems(id);

  if (!quote) {
    redirectWithError("/bbs-control/cotizaciones", "Cotización no encontrada.");
  }

  if (!quote.client_email) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, "El cliente no tiene correo.");
  }

  if (!process.env.RESEND_API_KEY) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, "Resend no está configurado.");
  }

  const settings = await getBusinessSettings();
  const pdf = await renderQuotePdfBuffer(quote, settings);
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from:
      process.env.RESEND_FROM_EMAIL ||
      "Biomedical Business and Service <no-reply@bbsbiomedical.com>",
    to: quote.client_email,
    subject: `Cotización ${quote.quote_number} - Biomedical Business and Service`,
    text: [
      `Estimado cliente,`,
      "",
      `Adjuntamos la cotización ${quote.quote_number}.`,
      "",
      "Biomedical Business and Service",
      "brodriguez@rysbioservices.com",
      "+507 6202-3206",
    ].join("\n"),
    attachments: [
      {
        filename: `${quote.quote_number}.pdf`,
        content: pdf,
      },
    ],
  });

  const supabase = await createSupabaseServerClient();
  await supabase.from("quotes").update({ status: "sent" }).eq("id", id);
  await insertQuoteEvent(id, "sent", `Enviada a ${quote.client_email}.`);
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Cotización enviada.`);
}




