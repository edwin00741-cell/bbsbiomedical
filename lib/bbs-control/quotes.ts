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
  const { data } = await supabase
    .from("business_settings")
    .select("id, business_name, legal_name, email, phone, address, currency, quote_prefix, default_validity_days")
    .limit(1)
    .maybeSingle();

  return (data as BusinessSettings | null) || defaultBusinessSettings;
}

export async function getQuoteWithItems(id: string): Promise<QuoteWithItems | null> {
  const supabase = await createSupabaseServerClient();
  const { data: quote, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !quote) {
    return null;
  }

  const [{ data: items }, { data: client }, { data: events }] = await Promise.all([
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

  return {
    ...(quote as QuoteWithItems),
    client,
    items: items || [],
    events: events || [],
  };
}


