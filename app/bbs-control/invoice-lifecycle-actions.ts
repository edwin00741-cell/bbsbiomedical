"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient, requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
export async function invoiceLifecycleAction(_previous: { error: string; success?: string }, form: FormData) {
  await requireBackOfficeUser();
  const parsed = z.object({ id: z.uuid(), version: z.iso.datetime({ offset: true }), action: z.enum(["void", "delete_draft", "mark_emailed"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Referencia de factura inválida. Recargue la página." };
  const row = parsed.data, supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("invoice_lifecycle_action", { p_id: row.id, p_version: row.version, p_action: row.action });
  if (error) return { error: error.message };
  revalidatePath(`/bbs-control/facturas/${row.id}`); revalidatePath("/bbs-control/facturas"); revalidatePath("/bbs-control/clientes"); revalidatePath("/bbs-control");
  if (row.action === "delete_draft") redirect("/bbs-control/facturas?success=Borrador%20eliminado.");
  redirect(`/bbs-control/facturas/${row.id}?success=${encodeURIComponent(row.action === "void" ? "Factura anulada." : "Envío registrado manualmente.")}`);
}
