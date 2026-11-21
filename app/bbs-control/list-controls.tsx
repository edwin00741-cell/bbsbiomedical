"use client";
import { useState } from "react";
import { dateRange, periods } from "../../lib/bbs-control/list-filters";
export function ListFilters({ period = "all", start = "", end = "", keyword = "", today, children, placeholder = "Cliente, número, vendedor" }: {
  period?: string; start?: string; end?: string; keyword?: string; today: string; children?: React.ReactNode; placeholder?: string;
}) {
  const [selected, setSelected] = useState(period);
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);
  const invalid = Boolean(from && to && from > to);
  return <form className="bbs-filters" method="get">
    <label>Período:<select name="period" className="bbs-select" value={selected} onChange={(event) => {
      const value = event.target.value; setSelected(value);
      if (value !== "custom") { const range = dateRange(value, today); setFrom(range.start); setTo(range.end); }
    }}>{periods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label>Inicio:<input className="bbs-input" name="start" type="date" value={from} onChange={(event) => { setSelected("custom"); setFrom(event.target.value); }} /></label>
    <label>Fin:<input className="bbs-input" name="end" type="date" min={from || undefined} value={to} onChange={(event) => { setSelected("custom"); setTo(event.target.value); }} /></label>
    <label>Palabra clave:<input className="bbs-input bbs-keyword" name="keyword" defaultValue={keyword} maxLength={200} placeholder={placeholder} /></label>
    {children}<button className="bbs-button" type="submit" disabled={invalid}>Buscar</button>
    {invalid ? <span className="bbs-filter-error" role="alert">Inicio no puede ser posterior a fin.</span> : null}
  </form>;
}
