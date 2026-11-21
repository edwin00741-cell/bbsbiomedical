import Link from "next/link";
import {BackOfficeShell,PageHeader,FlashMessage,DataError} from "../components";
import {RecordDialog} from "../record-dialog";
import {RowActions,ActionSubmit} from "../row-actions";
import {Pagination} from "../pagination";
import {ItemForm} from "./item-form";
import {setItemActive} from "./actions";
import {createSupabaseServerClient,requireBackOfficeUser} from "../../../lib/bbs-control/supabase-server";
import {param,searchOr,pageHref, type SearchParams} from "../../../lib/bbs-control/list-filters";
import {money} from "../../../lib/bbs-control/format";
import type {CatalogItem} from "../../../lib/bbs-control/catalog";
export const dynamic="force-dynamic";
export default async function ItemsPage({searchParams}:{searchParams?:Promise<SearchParams>}){
 const user=await requireBackOfficeUser();const params=await searchParams||{};const db=await createSupabaseServerClient();const keyword=param(params,"keyword");const inactive=param(params,"inactive")==="1";const page=Math.max(1,Number.parseInt(param(params,"page"))||1);
 let query=db.from("items").select("*",{count:"exact"}).order("name").order("id");if(!inactive)query=query.eq("is_active",true);if(keyword)query=query.or(searchOr(["sku","name","description","supplier"],keyword));
 const [result,taxes]=await Promise.all([query.range((page-1)*20,page*20-1),db.from("tax_rates").select("id,name,rate").eq("is_active",true).order("rate")]);
 const id=param(params,"edit")||param(params,"history");const selected=id?(await db.from("items").select("*").eq("id",id).maybeSingle()).data:null;
 const movements=param(params,"history")&&selected?(await db.from("inventory_movements").select("id,quantity,reason,created_at").eq("item_id",selected.id).order("created_at",{ascending:false}).limit(100)).data:null;
 return <BackOfficeShell user={user}><PageHeader title="Artículos" eyebrow="Catálogo" action={<Link className="bbs-button bbs-button-primary" href="/bbs-control/articulos?new=1">+ Nuevo artículo</Link>}/><FlashMessage searchParams={Promise.resolve(params)}/>
 <form className="bbs-filters"><label>Buscar:<input className="bbs-input" name="keyword" defaultValue={keyword} placeholder="Código o descripción"/></label><label className="bbs-checkbox"><input type="checkbox" name="inactive" value="1" defaultChecked={inactive}/>Incluir inactivos</label><button className="bbs-button">Buscar</button></form>
 {result.error||taxes.error?<DataError>No se pudo cargar el catálogo.</DataError>:<><div className="bbs-table-scroll"><table className="bbs-table" style={{minWidth:850}}><thead><tr>{["Código","Descripción","Impuesto","Valor","Cantidad","Estado","Acción"].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{((result.data||[]) as CatalogItem[]).map(item=><tr key={item.id}><td>{item.sku||"—"}</td><td><Link href={`/bbs-control/articulos?edit=${item.id}`}>{item.name}</Link><p>{item.description}</p></td><td>{taxes.data?.find(t=>t.id===item.tax_rate_id)?.name||"Ninguno"}</td><td className="bbs-money">{money(Number(item.unit_price))}</td><td>{item.manage_stock?<span className={Number(item.stock_quantity)<=Number(item.warning_quantity)?"bbs-badge bbs-badge-overdue":""}>{item.stock_quantity}</span>:"—"}</td><td>{item.is_active?"Activo":"Inactivo"}</td><td><RowActions label={`Acciones de ${item.name}`}><Link href={`/bbs-control/articulos?edit=${item.id}`}>Editar</Link><Link href={`/bbs-control/articulos?history=${item.id}`}>Movimientos</Link><form action={setItemActive}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="version" value={item.updated_at}/><input type="hidden" name="active" value={item.is_active?"0":"1"}/><ActionSubmit>{item.is_active?"Desactivar":"Reactivar"}</ActionSubmit></form></RowActions></td></tr>)}{!result.data?.length?<tr><td colSpan={7} className="bbs-empty">No se encontraron artículos.</td></tr>:null}</tbody></table></div><Pagination path="/bbs-control/articulos" params={params} page={page} count={result.count||0}/>{page>1&&page>Math.max(1,Math.ceil((result.count||0)/20))?<Link className="bbs-button" href={pageHref("/bbs-control/articulos",params,1)}>Volver a la primera página</Link>:null}</>}
 {param(params,"new")==="1"||param(params,"edit")?<RecordDialog title={selected?"Editar artículo":"Nuevo artículo"} closeHref="/bbs-control/articulos"><ItemForm item={selected||undefined} taxes={taxes.data||[]}/></RecordDialog>:null}
 {param(params,"history")&&selected?<RecordDialog title={`Movimientos de ${selected.name}`} closeHref="/bbs-control/articulos"><p>Existencias actuales: {selected.stock_quantity}. Se muestran los últimos 100 movimientos.</p><div className="bbs-table-scroll"><table className="bbs-table"><thead><tr><th>Fecha</th><th>Cantidad</th><th>Motivo</th></tr></thead><tbody>{(movements||[]).map(m=><tr key={m.id}><td>{m.created_at.slice(0,16).replace("T"," ")}</td><td>{m.quantity}</td><td>{m.reason}</td></tr>)}</tbody></table></div></RecordDialog>:null}
 </BackOfficeShell>;
}
