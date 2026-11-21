import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, roleHome } from "./lib/bbs-control/permissions";
import { canUseTemplates } from "./lib/bbs-control/service";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const api = path.startsWith("/api/bbs-control/");
  if (!api && path !== "/bbs-control" && !path.startsWith("/bbs-control/")) return NextResponse.next();
  if (path === "/bbs-control/login" || path === "/bbs-control/recuperar" || path === "/bbs-control/recuperar/confirmar") return NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (api) return NextResponse.json({message:"Servicio no configurado."},{status:503});
    const url = new URL("/bbs-control/login",request.url); url.searchParams.set("error","config");
    return NextResponse.redirect(url);
  }
  let response = NextResponse.next({request});
  const supabase = createServerClient(supabaseUrl,supabaseAnonKey,{cookies:{
    getAll(){return request.cookies.getAll();},
    setAll(values){
      values.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      values.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }
  }});
  const finish = (result:NextResponse) => { for (const cookie of response.cookies.getAll()) result.cookies.set(cookie); return result; };
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) {
    if(api)return finish(NextResponse.json({message:"No autorizado."},{status:401}));
    const url=new URL("/bbs-control/login",request.url);url.searchParams.set("next",path+request.nextUrl.search);
    return finish(NextResponse.redirect(url));
  }
  const {data:profile}=await supabase.from("profiles").select("id,role,username,must_change_password").eq("id",user.id).eq("is_active",true).maybeSingle();
  if(!profile){
    await supabase.auth.signOut({scope:"local"});
    if(api)return finish(NextResponse.json({message:"No autorizado."},{status:401}));
    return finish(NextResponse.redirect(new URL("/bbs-control/login?error=Usuario%20interno%20no%20activo.",request.url)));
  }
  if(profile.must_change_password && path!=="/bbs-control/cambiar-contrasena"){
    if(api)return finish(NextResponse.json({message:"Debe cambiar su contraseña antes de continuar."},{status:403}));
    return finish(NextResponse.redirect(new URL("/bbs-control/cambiar-contrasena",request.url)));
  }
  if(path==="/bbs-control" && roleHome(profile.role)!==path) return finish(NextResponse.redirect(new URL(roleHome(profile.role),request.url)));
  if(!canAccessPath(profile.role,path)||(path==="/bbs-control/plantillas"&&!canUseTemplates(profile))){
    if(api)return finish(NextResponse.json({message:"Su rol no tiene permiso para esta operación."},{status:403}));
    return finish(NextResponse.redirect(new URL("/bbs-control/acceso-denegado",request.url)));
  }
  return response;
}
export const config={matcher:["/bbs-control/:path*","/api/bbs-control/:path*"]};
