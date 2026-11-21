"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronDown, CreditCard, FileMinus, FileText, Gauge, Package, Receipt, RefreshCcw, Settings, Users, Wrench } from "lucide-react";
import {canAccessPath,type BbsRole} from "../../lib/bbs-control/permissions";
const links = [
  { label: "Panel", path: "", icon: Gauge },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Prefacturas", path: "/facturas", icon: FileText, children: [
    { label: "Ver prefacturas", path: "/facturas" },
    { label: "Nueva prefactura", path: "/facturas/nueva" },
    { label: "Recurrentes", path: "/recurrentes" },
  ] },
  { label: "Hojas de trabajo", path: "/hojas-trabajo", icon: FileText },
  { label: "Servicio técnico", path: "/servicio", icon: Wrench },
  { label: "Cotizaciones", path: "/cotizaciones", icon: Receipt, children: [
    { label: "Ver cotizaciones", path: "/cotizaciones" },
    { label: "Nueva cotización", path: "/cotizaciones/nueva" },
  ] },
  { label: "Notas de crédito", path: "/notas-credito", icon: FileMinus },
  { label: "Pagos", path: "/pagos", icon: CreditCard },
  { label: "Reembolsos", path: "/reembolsos", icon: RefreshCcw },
  { label: "Artículos", path: "/articulos", icon: Package },
  { label: "Informes", path: "/informes", icon: BarChart3 },
  { label: "Herramientas", path: "/herramientas", icon: Wrench },
  { label: "Configuración", path: "/configuracion", icon: Settings },
];
export function CommercialNavigation({ mobile = false, role }: { mobile?: boolean; role: BbsRole }) {
  const pathname = usePathname();
  const visible = links.filter(link=>canAccessPath(role,`/bbs-control${link.path}`));
  const active = visible.flatMap(link=>link.children || [link]).filter((link) => pathname === `/bbs-control${link.path}` ||
    (link.path && pathname.startsWith(`/bbs-control${link.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  return <nav aria-label={mobile ? "Módulos en móvil" : "Módulos"} className={mobile ? "bbs-mobile-nav" : "bbs-nav"}>
    {visible.map(({ label, path, icon: Icon, children }) => {
      const sublinks=children?.filter(link=>canAccessPath(role,`/bbs-control${link.path}`));
      if(sublinks?.length)return <details key={path} className="bbs-nav-group">
        <summary className="bbs-nav-link" data-active={sublinks.some(link=>link.path===active)||undefined}>
          <Icon size={16} aria-hidden="true"/><span>{label}</span><ChevronDown className="bbs-nav-chevron" size={16} aria-hidden="true"/>
        </summary>
        <div className="bbs-nav-submenu">{sublinks.map(link=><Link key={link.path} href={`/bbs-control${link.path}`} className="bbs-nav-link bbs-nav-child" aria-current={link.path===active?"page":undefined}>{link.label}</Link>)}</div>
      </details>;
      return <Link key={path} href={`/bbs-control${path}`} aria-current={path===active?"page":undefined} className="bbs-nav-link"><Icon size={16} aria-hidden="true"/><span>{label}</span></Link>;
    })}
  </nav>;
}
