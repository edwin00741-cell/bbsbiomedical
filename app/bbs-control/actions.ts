"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCommercialDocument } from "../../lib/bbs-control/documents";
import { duplicateDocument } from "./document-output-actions";
import {signInAction as signInWithPassword} from "./login/actions";
import {createManagedUser,updateManagedUser,resetManagedPassword} from "./usuarios/actions";
import {can} from "../../lib/bbs-control/permissions";
import { getBusinessSettings, getQuoteWithItems } from "../../lib/bbs-control/quotes";
import {
  createSupabaseServerClient,
  requireBackOfficeUser,
} from "../../lib/bbs-control/supabase-server";
import type { QuoteStatus } from "../../lib/bbs-control/types";
import {
  businessSettingsSchema,
  clientSchema,
  itemSchema,
  quoteSchema,
  quoteStatusSchema,
} from "../../lib/bbs-control/validation";
import { addDaysForInput, dateForInput } from "../../lib/bbs-control/format";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseQuoteItems(formData: FormData) {
  const indices = new Set<number>();

  for (const key of formData.keys()) {
    const match = key.match(/^item_(?:id|description|quantity|unit_price)_(\d+)$/);
    if (match) {
      indices.add(Number(match[1]));
    }
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => ({
      item_id: formValue(formData, `item_id_${index}`) || null,
      description: formValue(formData, `item_description_${index}`),
      quantity: formValue(formData, `item_quantity_${index}`),
      unit_price: formValue(formData, `item_unit_price_${index}`),
    }));
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
  const result=await signInWithPassword({error:""},formData);
  if(result.error)redirectWithError("/bbs-control/login",result.error);
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
  const result=await createManagedUser({error:""},formData);
  if(result.error)redirectWithError("/bbs-control/usuarios",result.error);
  redirect("/bbs-control/usuarios?success=Usuario%20creado.");
}

export async function updateUserAction(formData: FormData) {
  const result=await updateManagedUser({error:""},formData);
  if(result.error)redirectWithError("/bbs-control/usuarios",result.error);
  redirect("/bbs-control/usuarios?success=Usuario%20actualizado.");
}

export async function resetUserPasswordAction(formData: FormData) {
  const result=await resetManagedPassword({error:""},formData);
  if(result.error)redirectWithError("/bbs-control/usuarios",result.error);
  redirect("/bbs-control/usuarios?success=Contraseña%20actualizada.");
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
  const { business_name, ...rest } = values;
  const payload = { ...rest, company_name: business_name, legal_name: values.legal_name || business_name, updated_at: new Date().toISOString() };
  const { error } = id
    ? await supabase.from("business_settings").update(payload).eq("id", id)
    : await supabase.from("business_settings").insert(payload);

  if (error) {
    redirectWithError("/bbs-control/configuracion", error.message);
  }

  revalidatePath("/bbs-control/configuracion");
  redirect("/bbs-control/configuracion?success=Configuración actualizada.");
}

async function saveQuote(formData: FormData, quoteId?: string) {
  await requireBackOfficeUser();
  if (quoteId !== undefined && !z.uuid().safeParse(quoteId).success) {
    return { error: "Cotización inválida." };
  }
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
    return { error: parsed.error.issues[0]?.message || "Datos inválidos." };
  }

  const supabase = await createSupabaseServerClient();
  const { items: quoteItems, ...values } = parsed.data;
  let id: string;
  try {
    const { data, error } = await supabase.rpc("save_quote", {
      p_quote: values,
      p_items: quoteItems,
      p_quote_id: quoteId || null,
    });
    if (error || !data) {
      return { error: error?.message || "No se pudo guardar la cotización." };
    }
    id = data;
  } catch {
    return { error: "No se pudo conectar. Los datos del formulario se conservan; intenta guardar nuevamente." };
  }
  revalidatePath("/bbs-control/cotizaciones");
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=${quoteId ? "Cotización actualizada." : "Cotización creada."}`);
}

export async function createQuoteAction(formData: FormData) {
  return saveQuote(formData);
}

export async function updateQuoteAction(formData: FormData) {
  return saveQuote(formData, formValue(formData, "quote_id"));
}

export async function updateQuoteStatusAction(formData: FormData) {
  const actor=await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  const parsed = quoteStatusSchema.safeParse(formValue(formData, "status"));
  if (!z.uuid().safeParse(id).success || !parsed.success) redirectWithError("/bbs-control/cotizaciones", "Estado o cotización inválidos.");
  const status = parsed.data as QuoteStatus;
  if(!can(actor.role,"quotes.approve")&&!["draft","sent"].includes(status))redirectWithError(`/bbs-control/cotizaciones/${id}`,"La aprobación o rechazo requiere un administrador.");
  const supabase = await createSupabaseServerClient();
  const { data,error } = await supabase.from("quotes").update({ status }).eq("id", id).select("id").maybeSingle();

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.message);
  }

  if(!data)redirectWithError(`/bbs-control/cotizaciones/${id}`,"La cotización no está disponible o su rol no permite este cambio.");
  await insertQuoteEvent(id, "status_changed", `Estado actualizado a ${status}.`);
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Estado actualizado.`);
}

export async function markQuoteSentAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  if (!z.uuid().safeParse(id).success) redirectWithError("/bbs-control/cotizaciones", "Cotización inválida.");
  const supabase = await createSupabaseServerClient();
  const { data,error } = await supabase.from("quotes").update({ status: "sent", emailed_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.message);
  }

  if(!data)redirectWithError(`/bbs-control/cotizaciones/${id}`,"La cotización no está disponible o su rol no permite este cambio.");
  await insertQuoteEvent(id, "marked_sent", "Marcada como enviada manualmente.");
  revalidatePath(`/bbs-control/cotizaciones/${id}`);
  redirect(`/bbs-control/cotizaciones/${id}?success=Cotización marcada como enviada.`);
}

export async function deleteQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  if (!z.uuid().safeParse(id).success) redirectWithError("/bbs-control/cotizaciones", "Cotización inválida.");
  const supabase = await createSupabaseServerClient();
  const { data,error } = await supabase.from("quotes").delete().eq("id", id).select("id").maybeSingle();

  if (error) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error.code === "23503" ? "Esta cotización tiene una factura asociada y debe conservarse." : "No se pudo borrar la cotización.");
  }

  if(!data)redirectWithError("/bbs-control/cotizaciones","No tiene permiso para borrar esta cotización o ya no está disponible.");

  revalidatePath("/bbs-control/cotizaciones");
  redirect("/bbs-control/cotizaciones?success=Cotización borrada.");
}

export async function duplicateQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  if (!z.uuid().safeParse(id).success) redirectWithError("/bbs-control/cotizaciones", "Cotización inválida.");
  const commercial = await getCommercialDocument("quote", id);
  if (commercial?.commercial_version) {
    const data = new FormData(); data.set("kind", "quote"); data.set("document_id", id);
    return duplicateDocument(data);
  }
  const source = await getQuoteWithItems(id);

  if (!source) {
    redirectWithError("/bbs-control/cotizaciones", "Cotización no encontrada.");
  }

  const supabase = await createSupabaseServerClient();
  const settings = await getBusinessSettings();
  const { data: newId, error } = await supabase.rpc("save_quote", {
    p_quote: {
      client_id: source.client_id,
      client_name: source.client_name,
      client_email: source.client_email,
      seller_name: source.seller_name,
      project_description: source.project_description,
      notes: source.notes,
      issue_date: dateForInput(),
      valid_until: addDaysForInput(settings.default_validity_days || 30),
    },
    p_items: source.items.map((item) => ({
      item_id: item.item_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })),
    p_quote_id: null,
  });

  if (error || !newId) {
    redirectWithError(`/bbs-control/cotizaciones/${id}`, error?.message || "No se pudo duplicar.");
  }

  await insertQuoteEvent(newId, "duplicated", `Duplicada desde ${source.quote_number}.`);
  revalidatePath("/bbs-control/cotizaciones");
  redirect(`/bbs-control/cotizaciones/${newId}?success=Cotización duplicada.`);
}

export async function sendQuoteAction(formData: FormData) {
  await requireBackOfficeUser();
  const id = formValue(formData, "quote_id");
  if (!z.uuid().safeParse(id).success) redirectWithError("/bbs-control/cotizaciones", "Cotización inválida.");
  redirect(`/bbs-control/cotizaciones/${id}?email=1`);
}
