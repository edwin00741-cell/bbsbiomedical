"use server";
import { redirect } from "next/navigation";
import { passwordChangeSchema } from "../../../lib/bbs-control/auth-input";
import { roleHome } from "../../../lib/bbs-control/permissions";
import { createSupabaseAdminClient, createSupabaseServerClient, getBackOfficeUser } from "../../../lib/bbs-control/supabase-server";
export async function changeOwnPassword(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  const actor = await getBackOfficeUser();
  if (!actor) redirect("/bbs-control/login");
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revise las contraseñas." };
  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id,is_active,must_change_password,updated_at").eq("id", actor.id).eq("is_active", true).single();
  if (profileError || !profile) return { error: "No se pudo comprobar su perfil activo. Vuelva a iniciar sesión." };
  if (!profile.must_change_password) {
    if (!parsed.data.current_password) return { error: "Ingrese su contraseña actual." };
    const { data: current } = await supabase.auth.getUser();
    if (!current.user?.email) return { error: "Vuelva a iniciar sesión antes de cambiar su contraseña." };
    const verify = await supabase.auth.signInWithPassword({ email: current.user.email, password: parsed.data.current_password });
    if (verify.error || verify.data.user?.id !== actor.id) return { error: "La contraseña actual no es correcta." };
  }
  const update = await supabase.auth.updateUser({ password: parsed.data.password });
  if (update.error || update.data.user?.id !== actor.id) return { error: update.error?.code === "same_password" ? "La nueva contraseña debe ser diferente a la actual." : "No se pudo actualizar la contraseña. Use una contraseña nueva y vuelva a intentar." };
  if (profile.must_change_password) {
    const admin = createSupabaseAdminClient();
    const cleared = await admin.from("profiles").update({ must_change_password: false }).eq("id", actor.id).eq("is_active", true).eq("updated_at", profile.updated_at).select("id").maybeSingle();
    if (cleared.error || !cleared.data) return { error: "La contraseña se actualizó, pero el perfil cambió durante la operación. Inicie sesión de nuevo con su contraseña nueva." };
  }
  const admin = createSupabaseAdminClient();
  await admin.from("password_reset_requests").update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: actor.id }).eq("user_id", actor.id).eq("status", "pending");
  await supabase.auth.signOut({ scope: "others" });
  redirect(`${roleHome(actor.role)}?success=Contraseña%20actualizada.`);
}
