"use server";
import { z } from "zod";
import { createSupabaseServerClient } from "../../../lib/bbs-control/supabase-server";
export async function requestPasswordRecovery(_previous: { error: string; success?: string }, form: FormData): Promise<{ error: string; success?: string }> {
  const identifier = z.string().trim().min(1, "Ingrese su usuario o correo.").max(254).safeParse(form.get("identifier"));
  if (!identifier.success) return { error: "Ingrese su usuario o correo electrónico." };
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("request_password_reset", { p_identifier: identifier.data });
    if (error) return { error: "No se pudo registrar la solicitud. Intente nuevamente más tarde o contacte al administrador." };
    return { error: "", success: "Si existe una cuenta activa con esos datos, su solicitud quedó registrada. Un administrador verificará su identidad y le facilitará el acceso de recuperación." };
  } catch { return { error: "No se pudo registrar la solicitud. Intente nuevamente más tarde o contacte al administrador." }; }
}
