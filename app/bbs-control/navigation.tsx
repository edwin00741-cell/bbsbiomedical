"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, FileMinus, FileText, Gauge, Package, Receipt, RefreshCcw, Settings, Users, Wrench } from "lucide-react";
import {canAccessPath,type BbsRole} from "../../lib/bbs-control/permissions";
const links = [
  { label: "Panel", path: "", icon: Gauge },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Prefacturas", path: "/facturas", icon: FileText },
  { label: "Nueva prefactura", path: "/facturas/nueva", child: true },
  { label: "Recurrentes", path: "/recurrentes", child: true },
  { label: "Hojas de trabajo", path: "/hojas-trabajo", icon: FileText },
  { label: "Servicio técnico", path: "/servicio", icon: Wrench },
  { label: "Cotizaciones", path: "/cotizaciones", icon: Receipt },
  { label: "Nueva cotización", path: "/cotizaciones/nueva", child: true },
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
  const active = links.filter((link) => pathname === `/bbs-control${link.path}` ||
    (link.path && pathname.startsWith(`/bbs-control${link.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  return <nav aria-label={mobile ? "Módulos en móvil" : "Módulos"} className={mobile ? "bbs-mobile-nav" : "bbs-nav"}>
    {links.filter(link=>canAccessPath(role,`/bbs-control${link.path}`)).map(({ label, path, icon: Icon, child }) => <Link key={path} href={`/bbs-control${path}`}
      aria-current={path === active ? "page" : undefined} className={`bbs-nav-link${child ? " bbs-nav-child" : ""}`}>
      {Icon ? <Icon size={16} aria-hidden="true" /> : null}<span>{label}</span>
    </Link>)}
  </nav>;
}
