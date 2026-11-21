import Link from"next/link";
import{BackOfficeShell,PageHeader,DataError}from"../components";
import{SettingsForm,TaxForm}from"./settings-form";
import{getBusinessSettings}from"../../../lib/bbs-control/quotes";
import{createSupabaseServerClient,requireBackOfficeUser}from"../../../lib/bbs-control/supabase-server";
export const dynamic="force-dynamic";
export default async function SettingsPage(){
 const user=await requireBackOfficeUser();const db=await createSupabaseServerClient();const[settings,raw,taxes,history]=await Promise.all([getBusinessSettings(),db.from("business_settings").select("updated_at").limit(1).maybeSingle(),db.from("tax_rates").select("*").order("rate"),db.from("quotes").select("id",{count:"exact",head:true})]);
 return<BackOfficeShell user={user}><PageHeader eyebrow="Preferencias" title="Configuración"/><nav className="bbs-inline-actions mb-5" aria-label="Secciones de configuración">{[["#empresa","Empresa"],["#regional","Regional y números"],["#diseno","Diseño, plantillas y texto"],["#notas","Notas"],["#impuestos","Impuestos"],["/bbs-control/clientes?catalog=salespeople","Vendedores"],["/bbs-control/clientes?catalog=methods","Métodos de pago"],["/bbs-control/articulos","Inventario"],["/bbs-control/recurrentes","Recurrencia"],["/bbs-control/usuarios","Usuarios"]].map(([href,label])=><Link className="bbs-button" key={href} href={href}>{label}</Link>)}</nav>
 {raw.error||!raw.data?<DataError>No se pudo cargar la configuración.</DataError>:<SettingsForm settings={settings} version={raw.data.updated_at} currencyLocked={Boolean(history.count)}/>}
 <section className="bbs-card mt-5" id="impuestos"><h2>Impuestos</h2><p>El porcentaje se copia al documento. Modificar una tasa no cambia los documentos ya guardados.</p>{taxes.error?<DataError>No se pudieron cargar los impuestos.</DataError>:<>{(taxes.data||[]).map(t=><TaxForm key={t.id} tax={t}/>)}<h3 className="mt-5">Nuevo impuesto</h3><TaxForm/></>}</section>
 <section className="bbs-card mt-5"><h2>Cobros y comunicaciones</h2><p>Los pagos registran el dinero recibido por el método seleccionado. La gestión de usuarios está disponible para el administrador principal.</p><p className="mt-4">Correo: {process.env.RESEND_API_KEY ? "proveedor conectado" : "pendiente de conectar el proveedor de BBS; descarga e impresión disponibles"}.</p><Link className="bbs-button mt-4" href="/bbs-control/ayuda">Ver guías operativas</Link></section>
 </BackOfficeShell>;
}
