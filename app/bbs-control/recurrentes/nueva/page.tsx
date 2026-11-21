import { BackOfficeShell, DataError, PageHeader } from "../../components";
import { getRecurringSourceInvoices } from "../../../../lib/bbs-control/recurrence";
import { requireBackOfficeUser } from "../../../../lib/bbs-control/supabase-server";
import { panamaToday, param, type SearchParams } from "../../../../lib/bbs-control/list-filters";
import { RecurrenceForm } from "../forms";
import "../recurrence.css";
export const dynamic = "force-dynamic";
export default async function NewRecurrencePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const user = await requireBackOfficeUser(), params = searchParams ? await searchParams : {};
  let sources;
  try { sources = await getRecurringSourceInvoices(); } catch { return <BackOfficeShell user={user}><PageHeader eyebrow="Facturas recurrentes" title="Nueva programación" /><DataError /></BackOfficeShell>; }
  return <BackOfficeShell user={user}><PageHeader eyebrow="Facturas recurrentes" title="Nueva programación" />
    {sources.length ? <RecurrenceForm sources={sources} invoiceId={param(params, "invoice_id")} today={panamaToday()} /> : <section className="bbs-card"><p>Guarde una factura con el editor comercial para utilizar sus artículos y condiciones como plantilla recurrente.</p><Link className="bbs-button bbs-button-primary mt-4" href="/bbs-control/facturas/nueva">Crear factura</Link></section>}
  </BackOfficeShell>;
}
import Link from "next/link";
