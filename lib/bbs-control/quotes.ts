import { createSupabaseServerClient } from "./supabase-server";
import type { BusinessSettings, QuoteWithItems } from "./types";

export const defaultBusinessSettings: BusinessSettings = {
  id: "default",
  business_name: "Biomedical Business and Service",
  legal_name: "Biomedical Business and Service",
  email: "brodriguez@rysbioservices.com",
  phone: "+507 6202-3206 / 6631-2007",
  address:
    "Panama, Panama Oeste, La Chorrera, Ave. Libertadores, Calle Los Libertadores, Edificio 1, Local 1.",
  currency: "USD",
  quote_prefix: "BBS",
  default_validity_days: 30,
};

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la configuración de la empresa.");

  return data ? {...data,business_name:data.company_name,legal_name:data.legal_name||data.company_name} as BusinessSettings : defaultBusinessSettings;
}

export async function getQuoteWithItems(id: string): Promise<QuoteWithItems | null> {
  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("No se pudo cargar la cotización.");
  if (!quote) {
    return null;
  }

  const [{ data: items, error: itemsError }, { data: client }, { data: events }] = await Promise.all([
    supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", id)
      .order("position", { ascending: true }),
    quote.client_id
      ? supabase.from("clients").select("*").eq("id", quote.client_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("quote_events")
      .select("*")
      .eq("quote_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (itemsError) throw new Error("No se pudieron cargar los artículos de la cotización.");

  return {
    ...(quote as QuoteWithItems),
    client,
    items: items || [],
    events: events || [],
  };
}


