import{createHash}from"node:crypto";
import{parseCsv,importFields,type ImportKind}from"./csv";
import{catalogItemSchema}from"./catalog";
import{commercialClientSchema}from"./client-commercial";
import{documentInputSchema}from"./document-validation";
import{calculateDocumentTotals}from"./document-math";
import{readAllPages}from"./dashboard";
import{createSupabaseServerClient}from"./supabase-server";
import{getBusinessSettings}from"./quotes";
import{panamaToday}from"./list-filters";

type DataRow=Record<string,unknown>;
const truth=(v:unknown)=>["1","true","sí","si","yes","on"].includes(String(v).toLowerCase());
const normalize=(v:unknown)=>String(v||"").trim().toLocaleLowerCase("es");
export async function prepareImport(form:FormData){
 const kind=String(form.get("kind")) as ImportKind;if(!(kind in importFields))throw new Error("Tipo de importación inválido.");
 const csv=String(form.get("csv")||"");if(csv.length>300000)throw new Error("El archivo supera 300 KB.");
 const parsed=parseCsv(csv,String(form.get("delimiter")||","));if(parsed.length<2)throw new Error("El archivo debe incluir encabezados y datos.");
 let mapping:Record<string,string>;try{mapping=JSON.parse(String(form.get("mapping")||"{}"));}catch{throw new Error("Mapeo inválido.");}
 const offset=Math.max(1,Number(form.get("start_row")||2)-1);if(!Number.isInteger(offset)||offset>parsed.length)throw new Error("Línea inicial inválida.");
 const source=parsed.slice(offset);if(!source.length)throw new Error("No hay filas para importar.");
 const records=source.map((line,i)=>{const r:Record<string,string>={_line:String(i+offset+1)};for(const field of importFields[kind]){const col=Number(mapping[field]);if(mapping[field]!==undefined&&mapping[field]!==""&&Number.isInteger(col)&&col>=0&&col<parsed[0].length)r[field]=(line[col]||"").trim();}return r;});
 const db=await createSupabaseServerClient();
 const read=async(table:string)=>{const result=await readAllPages<DataRow>((from,to)=>db.from(table).select("*",{count:"exact"}).order("id").range(from,to));if(result.error)throw new Error("No se pudo consultar el catálogo para validar el archivo.");return result.data||[];};
 const[clients,items,taxes,settings]=await Promise.all([read("clients"),read("items"),read("tax_rates"),getBusinessSettings()]);
 const overwrite=form.get("overwrite")==="on";const rows:DataRow[]=[];const errors:string[]=[];
 const findClient=(r:Record<string,string>)=>{const matches=clients.filter(c=>r.client_email?normalize(c.email)===normalize(r.client_email):normalize(c.name)===normalize(r.client_name));if(matches.length!==1)throw new Error(matches.length?"Cliente ambiguo; use correo único.":"Cliente no encontrado. Importe o cree los clientes primero.");return matches[0];};
 const parseNumber=(v:string|undefined,def=0)=>v===undefined||v===""?def:Number(v.replace(/\s/g,""));
 if(kind==="clients"||kind==="items")for(const r of records){try{
  if(kind==="clients"){
   const match=clients.filter(c=>r.email?normalize(c.email)===normalize(r.email):normalize(c.name)===normalize(r.name));if(match.length>1)throw new Error("Cliente ambiguo.");if(match.length&&!overwrite)throw new Error("Cliente existente; active sobrescribir.");
   const base:DataRow=match[0]||{name:"",email:"",phone:"",contact_name:"",address:"",shipping_address:"",notes:"",public_notes:"",statement_footer:"",payment_terms:"days",payment_terms_days:settings.document_preferences?.default_terms_days??30,is_active:true,tax_exempt:false,group_id:null,salesperson_id:null,payment_method_id:null};
   const supplied={...Object.fromEntries(Object.entries(base).map(([k,v])=>[k,v??""])),...r};delete supplied._line;
   const value=commercialClientSchema.parse({...supplied,is_active:base.is_active,tax_exempt:r.tax_exempt!==undefined?truth(r.tax_exempt):base.tax_exempt,payment_terms_days:parseNumber(r.payment_terms_days,Number(base.payment_terms_days))});rows.push({...value,_import_version:match[0]?.updated_at||null});
  }else{
   const match=items.filter(c=>r.sku&&normalize(c.sku)===normalize(r.sku));if(match.length>1)throw new Error("Código ambiguo.");if(match.length&&!overwrite)throw new Error("Código existente; active sobrescribir.");
   const base=match[0]||{sku:null,name:"",description:null,unit_price:0,unit:"unidad",is_active:true,tax_rate_id:null,manage_stock:false,stock_quantity:0,ideal_quantity:0,warning_quantity:0,supplier:null,private_notes:null};
   const tax=r.tax_rate!==undefined?taxes.find(t=>normalize(t.name)===normalize(r.tax_rate)||Math.abs(Number(t.rate)*100-parseNumber(r.tax_rate))<.00001):null;if(r.tax_rate&&parseNumber(r.tax_rate)!==0&&!tax)throw new Error("Impuesto no encontrado; agréguelo en Configuración.");
   const value=catalogItemSchema.parse({...base,...r,sku:r.sku||base.sku||null,description:r.description??base.description,unit_price:parseNumber(r.unit_price,Number(base.unit_price)),tax_rate_id:r.tax_rate!==undefined?tax?.id||null:base.tax_rate_id,manage_stock:r.manage_stock!==undefined?truth(r.manage_stock):base.manage_stock,stock_quantity:parseNumber(r.stock_quantity,Number(base.stock_quantity)),ideal_quantity:parseNumber(r.ideal_quantity,Number(base.ideal_quantity)),warning_quantity:parseNumber(r.warning_quantity,Number(base.warning_quantity))});rows.push({...value,_import_version:match[0]?.updated_at||null});
  }
 }catch(error){errors.push(`Línea ${r._line}: ${error instanceof Error?error.message:"Datos inválidos."}`);}}
 else{
  const groups=new Map<string,Record<string,string>[]>();for(const r of records){const key=r.number||`line-${r._line}`;groups.set(key,[...(groups.get(key)||[]),r]);}
  for(const group of groups.values()){const r=group[0];try{
   const client=findClient(r);if(!client.is_active)throw new Error("Cliente inactivo.");
   if(group.some(x=>normalize(x.client_name)!==normalize(r.client_name)||normalize(x.client_email)!==normalize(r.client_email)))throw new Error("Un mismo número agrupa clientes distintos.");
   const date=r.issue_date||panamaToday();const until=new Date(date+"T12:00:00Z");until.setUTCDate(until.getUTCDate()+settings.default_validity_days);
   const input=documentInputSchema.parse({kind:kind==="quotes"?"quote":"invoice",document_kind:"quote",client_id:client.id,client_name:client.name,client_email:client.email,seller_name:r.seller_name||"Importación BBS",billing_address:r.billing_address??client.address,shipping_address:r.shipping_address??client.shipping_address,payment_terms:client.payment_terms,payment_terms_days:parseNumber(r.payment_terms_days,Number(client.payment_terms_days)),payment_method_id:client.payment_method_id,payment_method_name:null,tax_exempt:client.tax_exempt,issue_date:date,valid_until:until.toISOString().slice(0,10),purchase_order:null,project_description:null,public_notes:r.public_notes||null,private_notes:r.private_notes||null,footer_notes:r.footer_notes||null,discount_mode:r.discount_mode||"none",discount_value:parseNumber(r.discount_value),shipping_amount:parseNumber(r.shipping_amount),shipping_tax_rate:parseNumber(r.shipping_tax_rate),items:group.map(x=>({item_id:null,description:x.description,quantity:parseNumber(x.quantity,1),unit_price:parseNumber(x.unit_price),tax_rate:parseNumber(x.tax_rate),discount_percent:parseNumber(x.discount_percent)}))});
   calculateDocumentTotals(input);rows.push({...input,import_number:kind==="credits"?null:r.number||null});
  }catch(error){errors.push(`Documento en línea ${r._line}: ${error instanceof Error?error.message:"Datos inválidos."}`);}}
 }
 if(rows.length>500)errors.push("Máximo 500 registros o documentos por lote.");
 if(!rows.length&&!errors.length)errors.push("No hay registros válidos.");
 const hash=createHash("sha256").update(JSON.stringify({kind,rows,overwrite})).digest("hex");
 return{kind,rows,errors,hash,overwrite,fileName:String(form.get("file_name")||"importacion.csv").slice(0,200),summary:rows.slice(0,20).map((r,i)=>({row:i+1,name:String(r.name||r.client_name||""),description:String(r.sku||r.import_number||""),total:Number(r.unit_price??((r.items as unknown[])?.length?calculateDocumentTotals(r as never).total:0))}))};
}
