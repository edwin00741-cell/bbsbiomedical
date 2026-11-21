"use client";
import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateWorksheet, type Worksheet, type WorksheetInput, type WorksheetLine } from "../../../lib/bbs-control/worksheets";
import { saveWorksheet, createWorksheetQuote } from "./actions";
const blank:WorksheetLine={description:"",catalog:"",provider:"",quantity:1,list_price:0,net_price:0,expenses_percent:0,shipping:"Local",import_tax_percent:0,margin_percent:10};
const money=(n:number)=>new Intl.NumberFormat("es-PA",{style:"currency",currency:"USD"}).format(n);
export function WorksheetForm({sheet,clients,seller,today,readOnly=false}:{sheet?:Worksheet;clients:{id:string;name:string;tax_exempt?:boolean}[];seller:string;today:string;readOnly?:boolean}){
 const router=useRouter();const request=useRef<string|null>(null);
 const [draft,setDraft]=useState<WorksheetInput>(sheet?.payload||{client_id:"",title:"",seller_name:seller,issue_date:today,notes:"",sales_tax_percent:7,items:[{...blank}]});
 const [result,action,pending]=useActionState(async(p:{error:string},f:FormData)=>{
  request.current ||= crypto.randomUUID();f.set("request_id",request.current);f.set("payload",JSON.stringify(draft));if(sheet){f.set("id",sheet.id);f.set("version",sheet.updated_at);}
  const out=await saveWorksheet(p,f);if("id" in out&&out.id){router.push(`/bbs-control/hojas-trabajo/${out.id}`);router.refresh();}return out;
 },{error:""});
 const exempt=clients.find(c=>c.id===draft.client_id)?.tax_exempt===true;
 let totals:ReturnType<typeof calculateWorksheet>|undefined;try{totals=calculateWorksheet({...draft,sales_tax_percent:exempt?0:draft.sales_tax_percent});}catch{/* Incomplete fields remain editable. */}
 const field=(key: keyof Omit<WorksheetInput,"items">,label:string,type="text")=><label key={key}>{label}<input className="bbs-input" type={type} step={type==="number"?"0.0001":undefined} min={type==="number"?0:undefined} max={type==="number"?100:undefined} minLength={type==="text"?2:undefined} maxLength={type==="text"?200:undefined} value={draft[key]} required={!["notes"].includes(key)} onChange={e=>setDraft(d=>({...d,[key]:type==="number"?Number(e.target.value):e.target.value}))}/></label>;
 const update=(i:number,key:keyof WorksheetLine,v:string)=>setDraft(d=>({...d,items:d.items.map((r,j)=>j===i?{...r,[key]:typeof blank[key]==="number"?Number(v):v}:r)}));
 const cols:[keyof WorksheetLine,string][]=[["description","Descripci�n"],["catalog","Cat�logo"],["provider","Proveedor"],["quantity","Cantidad"],["list_price","Precio lista"],["net_price","Precio neto"],["expenses_percent","Gastos %"],["shipping","Env�o"],["import_tax_percent","TAX importaci�n %"],["margin_percent","Margen %"]];
 const dirty=!!sheet&&JSON.stringify(draft)!==JSON.stringify(sheet.payload);
 return <>{sheet?<div className="bbs-toolbar"><CreateQuoteButton sheet={sheet} disabled={dirty||pending}/>{dirty?<p role="status">Guarde los cambios antes de crear la cotizaci�n.</p>:null}</div>:null}<form action={action} className="bbs-card">
  {result.error?<p className="bbs-message bbs-message-error" role="alert">{result.error}</p>:null}
  <fieldset disabled={pending||readOnly}><div className="bbs-fields">
   <label>Cliente<select className="bbs-select" required value={draft.client_id} onChange={e=>setDraft(d=>({...d,client_id:e.target.value}))}><option value="">Seleccione</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   {field("title","T�tulo / proyecto")}{field("seller_name","Vendedor")}{field("issue_date","Fecha","date")}{field("sales_tax_percent","Impuesto de venta %","number")}
  </div>
  {exempt?<p className="bbs-field-hint">Este cliente est� exento. El total cotizable aplica impuesto de venta de 0%.</p>:null}
  <p className="bbs-field-hint">Precio neto es el costo despu�s del descuento. El margen se calcula sobre la venta. Los precios de venta se redondean a dos decimales para coincidir con la cotizaci�n.</p>
  <p className="bbs-table-hint">Deslice la tabla horizontalmente para ver costos y precios de venta.</p><div className="bbs-table-scroll" role="region" aria-label="�tems y c�lculo de la hoja de trabajo" tabIndex={0}><table className="bbs-table" style={{minWidth:1550}}><thead><tr>{cols.map(([k,l])=><th key={k}>{l}</th>)}<th>Neto total</th><th>CIF unit.</th><th>Costo local unit.</th><th>P/V unit.</th><th>Total venta</th>{!readOnly?<th>Acci�n</th>:null}</tr></thead><tbody>{draft.items.map((row,i)=><tr key={i}>{cols.map(([k,l])=><td key={k}><input aria-label={`${l} ${i+1}`} className="bbs-input" style={{minWidth:k==="description"?220:90}} value={row[k]} type={typeof blank[k]==="number"?"number":"text"} step={k.includes("percent")?"0.0001":"0.01"} min={k==="quantity"?.01:0} minLength={k==="description"?2:undefined} maxLength={k==="description"?4000:k==="catalog"?100:typeof blank[k]==="string"?200:undefined} max={k==="quantity"?999999.99:k==="margin_percent"?99.9999:k.includes("percent")?100:99999999.99} required={k==="description"||typeof blank[k]==="number"} onChange={e=>update(i,k,e.target.value)}/></td>)}{["netTotal","freight","localCost","unitPrice","total"].map(k=><td key={k} className="bbs-money">{totals?money(totals.items[i][k as "total"]):"-"}</td>)}{!readOnly?<td><button className="bbs-button" type="button" aria-label={`Eliminar fila ${i+1}`} disabled={draft.items.length===1} onClick={()=>setDraft(d=>({...d,items:d.items.filter((_,j)=>j!==i)}))}>Quitar</button></td>:null}</tr>)}</tbody></table></div>
  {!readOnly?<button type="button" className="bbs-button mt-4" disabled={draft.items.length>=300} onClick={()=>setDraft(d=>({...d,items:[...d.items,{...blank}]}))}>Agregar fila</button>:null}
  <div className="bbs-fields"><label className="bbs-wide">Observaciones internas<textarea className="bbs-textarea" value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label></div>
  </fieldset>
  {totals?<div className="bbs-metrics"><div className="bbs-metric">Costo total<strong>{money(totals.cost)}</strong>Flete incluido: {money(totals.freight)}</div><div className="bbs-metric">Ganancia antes de impuesto<strong>{money(totals.profit)}</strong>Margen: {totals.margin.toFixed(2)}%</div><div className="bbs-metric">Total cotizable<strong>{money(totals.total)}</strong>Subtotal: {money(totals.subtotal)} � Impuesto: {money(totals.tax)}</div></div>:null}
  <div className="bbs-toolbar">{!readOnly?<button className="bbs-button bbs-button-primary" disabled={pending}>{pending?"Guardando.":"Guardar hoja de trabajo"}</button>:null}<Link className="bbs-button" href="/bbs-control/hojas-trabajo">Volver</Link></div>
 </form></>;
}
export function CreateQuoteButton({sheet,disabled=false}:{sheet:Worksheet;disabled?:boolean}){
 const request=useRef<string|null>(null);const [state,action,pending]=useActionState(async(p:{error:string},f:FormData)=>{request.current ||= crypto.randomUUID();f.set("id",sheet.id);f.set("version",sheet.updated_at);f.set("request_id",request.current);return createWorksheetQuote(p,f);},{error:""});
 return <form action={action}><button className="bbs-button bbs-button-primary" disabled={pending||disabled}>{pending?"Creando.":"Crear cotizaci�n"}</button>{state.error?<p role="alert" className="bbs-message-error">{state.error}</p>:null}</form>;
}
