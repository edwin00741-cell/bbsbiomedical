"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Plus, RotateCcw, Trash2, Truck } from "lucide-react";
import type { BusinessSettings, Client, Item, QuoteWithItems } from "../../../lib/bbs-control/types";
import { quoteLineTotal } from "../../../lib/bbs-control/quote-totals";

type QuoteFormAction = (formData: FormData) => Promise<void | { error: string }>;

type QuoteFormRow = {
  key: string;
  item_id: string;
  description: string;
  quantity: string;
  unit_price: string;
};

type QuoteFormProps = {
  action: QuoteFormAction;
  clients: (Pick<Client, "id" | "name" | "email" | "address"> & { salesperson_name?: string | null; is_active?: boolean })[];
  items: Pick<Item, "id" | "sku" | "name" | "description" | "unit_price">[];
  mode: "create" | "edit";
  quote?: QuoteWithItems;
  sellerName: string;
  settings: BusinessSettings;
  issueDate: string;
  validUntil: string;
  defaultNote: string;
};

function money(value: number) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function nextRow(overrides: Partial<QuoteFormRow> = {}): QuoteFormRow {
  return {
    key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    item_id: "",
    description: "",
    quantity: "1",
    unit_price: "0",
    ...overrides,
  };
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function QuoteForm({
  action,
  clients,
  items,
  mode,
  quote,
  sellerName,
  settings,
  issueDate,
  validUntil,
  defaultNote,
}: QuoteFormProps) {
  const initialRows = quote?.items.length
    ? quote.items.map((item) =>
        nextRow({
          key: item.id,
          item_id: item.item_id || "",
          description: item.description,
          quantity: String(item.quantity),
          unit_price: String(item.unit_price),
        }),
      )
    : [nextRow()];

  const [clientId, setClientId] = useState(quote?.client_id || "");
  const [clientName, setClientName] = useState(quote?.client_name || "");
  const [clientEmail, setClientEmail] = useState(quote?.client_email || "");
  const [rows, setRows] = useState<QuoteFormRow[]>(initialRows);
  const [date, setDate] = useState(issueDate);
  const [validity, setValidity] = useState(validUntil);
  const [seller, setSeller] = useState(quote?.seller_name || sellerName);
  const [project, setProject] = useState(quote?.project_description || "");
  const [notes, setNotes] = useState(quote ? quote.notes || "" : defaultNote);
  const [result, formAction, pending] = useActionState(
    async (_previous: { error: string }, formData: FormData) =>
      (await action(formData)) || { error: "" },
    { error: "" },
  );

  const subtotal = rows.reduce(
    (sum, row) => sum + Math.round(quoteLineTotal(toNumber(row.quantity), toNumber(row.unit_price)) * 100),
    0,
  ) / 100;

  function selectClient(value: string) {
    setClientId(value);
    const client = clients.find((entry) => entry.id === value);

    if (client) {
      setClientName(client.name);
      setClientEmail(client.email || "");
      setSeller(client.salesperson_name || sellerName);
    }
  }

  function updateRow(index: number, patch: Partial<QuoteFormRow>) {
    setRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  }

  function selectCatalogItem(index: number, value: string) {
    const catalogItem = items.find((entry) => entry.id === value);

    updateRow(index, {
      item_id: value,
      description: catalogItem ? catalogItem.description || catalogItem.name : rows[index]?.description || "",
      unit_price: catalogItem ? String(catalogItem.unit_price) : rows[index]?.unit_price || "0",
    });
  }

  function addRow(overrides: Partial<QuoteFormRow> = {}) {
    setRows((current) => [...current, nextRow(overrides)]);
  }

  function removeRow(index: number) {
    setRows((current) => {
      if (current.length === 1) {
        return [nextRow()];
      }

      return current.filter((_, rowIndex) => rowIndex !== index);
    });
  }

  function resetRows() {
    setClientId("");
    setClientName("");
    setClientEmail("");
    setRows([nextRow()]);
    setDate(issueDate);
    setValidity(validUntil);
    setSeller(sellerName);
    setProject("");
    setNotes(defaultNote);
  }

  return (
    <form action={formAction} aria-busy={pending} className="mx-auto w-full min-w-0 max-w-6xl rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
      {result.error ? <p className="mb-5 rounded-[8px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800" role="alert">{result.error}</p> : null}
      {quote ? <input name="quote_id" type="hidden" value={quote.id} /> : null}
      <div className="grid min-w-0 gap-8 border-b border-slate-200 pb-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <Image
            alt="Biomedical Business and Service"
            className="h-auto w-60 max-w-full"
            height={98}
            priority
            src="/brand/bbs-primary-horizontal-color.png"
            width={382}
          />
          <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-slate-600">
            {settings.address}
          </p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {settings.phone} · {settings.email}
          </p>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-black text-slate-900">
            Cliente
            <select
              className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              name="client_id"
              onChange={(event) => selectClient(event.target.value)}
              value={clientId}
            >
              <option value="">Cliente manual</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}{client.is_active === false ? " (inactivo)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-900">
            Nombre del cliente
            <input
              className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              name="client_name"
              minLength={2}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Nombre o empresa"
              required
              value={clientName}
            />
          </label>
          <label className="grid gap-2 text-sm font-black text-slate-900">
            Email del cliente
            <input
              className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
              name="client_email"
              onChange={(event) => setClientEmail(event.target.value)}
              placeholder="correo@empresa.com"
              type="email"
              value={clientEmail}
            />
          </label>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-black text-slate-900">
          Fecha
          <input
            className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            name="issue_date"
            required
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-900">
          Nº de cotización
          <input
            className="h-12 w-full rounded-[8px] border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500 outline-none"
            defaultValue={quote?.quote_number || "Automático"}
            disabled
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-900">
          Válida hasta
          <input
            className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            value={validity}
            onChange={(event) => setValidity(event.target.value)}
            min={date}
            name="valid_until"
            required
            type="date"
          />
        </label>
        <label className="grid gap-2 text-sm font-black text-slate-900">
          Vendedor
          <input
            className="h-12 w-full rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            value={seller}
            onChange={(event) => setSeller(event.target.value)}
            minLength={2}
            name="seller_name"
            required
          />
        </label>
      </div>

      <label className="mt-6 grid gap-2 text-sm font-black text-slate-900">
        Descripción del proyecto
        <textarea
          className="min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          value={project}
          onChange={(event) => setProject(event.target.value)}
          name="project_description"
          placeholder="Descripción general del alcance técnico."
        />
      </label>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[860px] border border-slate-200 text-sm">
          <thead className="bg-[#075985] text-left text-xs uppercase tracking-[0.14em] text-white">
            <tr>
              <th className="w-24 px-3 py-3">Cant.</th>
              <th className="w-44 px-3 py-3">Cód. artículo</th>
              <th className="px-3 py-3">Descripción</th>
              <th className="w-40 px-3 py-3 text-right">Precio unitario</th>
              <th className="w-36 px-3 py-3 text-right">Total</th>
              <th className="w-12 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td className="p-2 align-top">
                  <input
                    className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    min="0.01"
                    name={`item_quantity_${index}`}
                    aria-label={`Cantidad ${index + 1}`}
                    required
                    onChange={(event) => updateRow(index, { quantity: event.target.value })}
                    step="0.01"
                    type="number"
                    value={row.quantity}
                  />
                </td>
                <td className="p-2 align-top">
                  <select
                    className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-sm font-black text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    name={`item_id_${index}`}
                    aria-label={`Artículo ${index + 1}`}
                    onChange={(event) => selectCatalogItem(index, event.target.value)}
                    value={row.item_id}
                  >
                    <option value="">Manual</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.sku || item.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2 align-top">
                  <textarea
                    className="min-h-10 w-full rounded-[8px] border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    name={`item_description_${index}`}
                    aria-label={`Descripción ${index + 1}`}
                    minLength={2}
                    required
                    rows={2}
                    onChange={(event) => updateRow(index, { description: event.target.value })}
                    placeholder={index === 0 ? "Descripción" : "Producto o servicio"}
                    value={row.description}
                  />
                </td>
                <td className="p-2 align-top">
                  <input
                    className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-2 text-right text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
                    min="0"
                    name={`item_unit_price_${index}`}
                    aria-label={`Precio unitario ${index + 1}`}
                    required
                    onChange={(event) => updateRow(index, { unit_price: event.target.value })}
                    step="0.01"
                    type="number"
                    value={row.unit_price}
                  />
                </td>
                <td className="p-2 text-right align-middle font-black text-slate-600">
                  {money(quoteLineTotal(toNumber(row.quantity), toNumber(row.unit_price)))}
                </td>
                <td className="p-2 text-center align-middle">
                  <button
                    className="inline-flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-700"
                    onClick={() => removeRow(index)}
                    title="Quitar línea"
                    type="button"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-cyan-200 bg-cyan-50 px-4 text-sm font-black text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
          onClick={() => addRow()}
          type="button"
        >
          <Plus size={16} />
          Agregar artículo
        </button>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-cyan-200 hover:text-cyan-800"
          onClick={() => addRow({ description: "Envío", quantity: "1", unit_price: "0" })}
          type="button"
        >
          <Truck size={16} />
          Añadir envío
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <label className="grid gap-2 text-sm font-black text-slate-900">
          Nota pública
          <textarea
            className="min-h-28 w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            name="notes"
          />
        </label>
        <div className="rounded-[8px] bg-slate-50 p-5">
          <div className="flex justify-between border-b border-slate-200 pb-3 text-sm font-bold text-slate-600">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between pt-4 text-xl font-black text-slate-950">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
        {mode === "create" ? (
          <button
            className="inline-flex h-12 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 text-sm font-black text-red-700 transition hover:bg-red-100"
            onClick={resetRows}
            disabled={pending}
            type="reset"
          >
            <RotateCcw size={16} />
            Borrar cotización
          </button>
        ) : (
          <span />
        )}
        <button
          className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-500 px-6 text-sm font-black text-slate-950 shadow-[0_16px_34px_rgba(34,211,238,0.22)] transition hover:-translate-y-0.5 hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Guardando..." : mode === "create" ? "Crear cotización" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
