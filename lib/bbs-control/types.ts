export type BbsRole = "super_admin" | "admin";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired";

export type BackOfficeUser = {
  id: string;
  username: string;
  full_name: string;
  role: BbsRole;
  is_active: boolean;
};

export type Client = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

export type Quote = {
  id: string;
  quote_number: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  seller_name: string;
  project_description: string | null;
  notes: string | null;
  status: QuoteStatus;
  issue_date: string;
  valid_until: string;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  quote_id: string;
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  position: number;
};

export type QuoteEvent = {
  id: string;
  quote_id: string;
  actor_id: string | null;
  event_type: string;
  note: string | null;
  created_at: string;
};

export type QuoteWithItems = Quote & {
  client?: Client | null;
  items: QuoteItem[];
  events?: QuoteEvent[];
};

export type BusinessSettings = {
  id: string;
  business_name: string;
  legal_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  quote_prefix: string;
  default_validity_days: number;
};

export type Item = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
};

export type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "void";

export type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  seller_name: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  created_at: string;
};


