/** RFC4180-style parsing, including quoted newlines and escaped quotes. */
export function parseCsv(source:string,delimiter=","):string[][]{
 if(![",",";","\t"].includes(delimiter))throw new Error("Separador inválido.");
 const text=source.replace(/^\uFEFF/,"");const rows:string[][]=[];let row:string[]=[],cell="",quoted=false,closed=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c==='"'&&!cell&&!closed){quoted=true;continue;}
  if(c===delimiter){row.push(cell);cell="";closed=false;continue;}
  if(c==="\r"||c==="\n"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell="";closed=false;continue;}
  if(closed&&c.trim())throw new Error(`Carácter después de comillas, cerca de la posición ${i+1}.`);
  if(!closed)cell+=c;
 }
 if(quoted)throw new Error("El archivo tiene comillas sin cerrar.");row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(rows.length>2001)throw new Error("Máximo 2000 líneas por archivo.");return rows;
}
export function csvCell(value:unknown){
 let text=String(value??"");if(typeof value!=="number"&&/^[\s]*[=+@-]/.test(text))text="'"+text;
 return /[",\r\n]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
}
export function toCsv(rows:unknown[][]){return "\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n");}
export const importFields={
 clients:["name","email","phone","contact_name","address","shipping_address","payment_terms","payment_terms_days","tax_exempt","public_notes","statement_footer","notes"],
 items:["sku","name","description","unit_price","unit","tax_rate","manage_stock","stock_quantity","ideal_quantity","warning_quantity","supplier","private_notes"],
 quotes:["number","client_name","client_email","issue_date","description","quantity","unit_price","tax_rate","seller_name","payment_terms_days","billing_address","shipping_address","discount_mode","discount_value","discount_percent","shipping_amount","shipping_tax_rate","public_notes","private_notes","footer_notes"],
 invoices:["number","client_name","client_email","issue_date","description","quantity","unit_price","tax_rate","seller_name","payment_terms_days","billing_address","shipping_address","discount_mode","discount_value","discount_percent","shipping_amount","shipping_tax_rate","public_notes","private_notes","footer_notes"],
 credits:["number","client_name","client_email","issue_date","description","quantity","unit_price","tax_rate","seller_name","payment_terms_days","billing_address","shipping_address","discount_mode","discount_value","discount_percent","shipping_amount","shipping_tax_rate","public_notes","private_notes","footer_notes"],
}as const;
export type ImportKind=keyof typeof importFields;
