"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function PrivateUpload({kind,reportId}:{kind:"service"|"template";reportId?:string}){
 const router=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 return <form className="bbs-toolbar" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);data.set("kind",kind);if(reportId)data.set("report_id",reportId);setBusy(true);setError("");try{const response=await fetch("/api/bbs-control/private-files",{method:"POST",body:data});const result=await response.json();if(!response.ok)throw new Error(result.error||"No se pudo cargar el archivo.");form.reset();router.refresh();}catch(e){setError(e instanceof Error?e.message:"No se pudo cargar el archivo.");}finally{setBusy(false);}}}>
  <label>{kind==="service"?"Reporte firmado / sellado":"Documento de plantilla"}<input className="bbs-input mt-2" name="file" type="file" required disabled={busy} accept={kind==="service"?".pdf,.png,.jpg,.jpeg":".pdf,.png,.jpg,.jpeg,.docx,.xlsx"}/></label>
  <button className="bbs-button bbs-button-primary" disabled={busy}>{busy?"Cargando…":"Guardar archivo"}</button><small>Máximo 10 MB.</small>{error?<p role="alert" className="bbs-message bbs-message-error">{error}</p>:null}
 </form>;
}
