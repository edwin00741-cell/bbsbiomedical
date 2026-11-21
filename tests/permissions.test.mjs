import assert from "node:assert/strict";
import test from "node:test";
import { can,canManageRole,canAccessPath,roleHome } from "../lib/bbs-control/permissions.ts";
test("cotizador reads worksheets and creates quotations without administrative writes",()=>{
 for(const c of ["quotes.read","quotes.write","catalog.read","worksheets.read"])assert.equal(can("cotizador",c),true);
 for(const c of ["worksheets.write","service.manage","quotes.approve","clients.read","clients.write","finance.read","finance.write","users.manage","settings.manage"])assert.equal(can("cotizador",c),false);
});
test("removed approver role has no access",()=>{assert.equal(can("aprobador","quotes.read"),false);assert.equal(canAccessPath("aprobador","/bbs-control/cotizaciones"),false);assert.equal(canManageRole("admin","aprobador"),false);});
test("administrators edit worksheets; only super administrators manage super administrators",()=>{for(const role of ["admin","super_admin"])assert.equal(can(role,"worksheets.write"),true);assert.equal(canManageRole("admin","super_admin"),false);assert.equal(canManageRole("super_admin","super_admin"),true);assert.equal(canManageRole("super_admin","unknown"),false);});
test("routes reject privilege escalation and preserve quotation access",()=>{
 assert.equal(roleHome("cotizador"),"/bbs-control/cotizaciones");
 for(const path of ["/bbs-control/hojas-trabajo","/bbs-control/hojas-trabajo/123","/bbs-control/cotizaciones/123/editar","/api/bbs-control/quotes/123/pdf","/bbs-control/ayuda"])assert.equal(canAccessPath("cotizador",path),true);
 for(const path of ["/bbs-control/hojas-trabajo/nueva","/bbs-control/servicio","/bbs-control/plantillas","/api/bbs-control/private-files/123","/bbs-control/facturas","/bbs-control/clientes","/bbs-control/cotizaciones%2f..%2ffacturas","https://outside.example/bbs-control/cotizaciones"])assert.equal(canAccessPath("cotizador",path),false);
});
