import Link from "next/link";
import { pageHref, type SearchParams } from "../../lib/bbs-control/list-filters";
export function Pagination({ path, params, page, count, pageSize = 20 }: {
  path: string; params: SearchParams; page: number; count: number; pageSize?: number;
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  return <nav className="bbs-pagination" aria-label="Paginación">
    <span>Página {page} de {pages} · {count} registros</span>
    <div>
      {page > 1 ? <Link className="bbs-button" href={pageHref(path, params, page - 1)}>Anterior</Link> : <span className="bbs-button" aria-disabled="true">Anterior</span>}
      {page < pages ? <Link className="bbs-button" href={pageHref(path, params, page + 1)}>Siguiente</Link> : <span className="bbs-button" aria-disabled="true">Siguiente</span>}
      <form action={path} method="get">
        {Object.entries(params).filter(([key, value]) => typeof value === "string" && !["page", "success", "error"].includes(key))
          .map(([key, value]) => <input type="hidden" key={key} name={key} value={String(value)} />)}
        <label>Saltar<input className="bbs-input" type="number" name="page" min={1} max={pages} defaultValue={page} required /></label>
        <button className="bbs-button">Ir</button>
      </form>
    </div>
  </nav>;
}
