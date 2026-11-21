import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBackOfficeUser } from "../../lib/bbs-control/supabase-server";
import { executeFinanceCommand } from "../../lib/bbs-control/finance";
import type { FinanceCommand } from "../../lib/bbs-control/finance-types";

export type FinanceActionResult = { error: string; success?: string };

export async function submitFinanceCommand(form: FormData, module: "pagos" | "notas-credito" | "reembolsos"): Promise<FinanceActionResult> {
  await requireBackOfficeUser();
  const metadata = z.object({ request_id: z.uuid(), return_id: z.uuid().optional() }).safeParse({
    request_id: form.get("request_id"), return_id: form.get("return_id") || undefined,
  });
  if (!metadata.success) return { error: "Referencia del formulario inválida. Recargue la página." };
  let command: FinanceCommand;
  try { command = JSON.parse(String(form.get("command") || "")); }
  catch { return { error: "Formulario inválido. Revise los datos." }; }
  const permitted = module === "pagos" ? ["payment.create", "payment.update", "payment.void", "application.apply", "application.unapply"]
    : module === "notas-credito" ? ["credit.create", "credit.update", "credit.void", "application.apply", "application.unapply"] : ["refund.create", "refund.void"];
  if (!command || !permitted.includes(command.operation)) return { error: "Operación inválida." };
  let recordId: string;
  try { recordId = await executeFinanceCommand(command, metadata.data.request_id); }
  catch (error) { return { error: error instanceof z.ZodError ? error.issues[0]?.message || "Revise los datos." : error instanceof Error ? error.message : "No se pudo guardar. Intente nuevamente." }; }
  for (const path of ["", "/pagos", "/notas-credito", "/reembolsos", "/facturas", "/clientes", "/informes"]) revalidatePath(`/bbs-control${path}`);
  const id = metadata.data.return_id || recordId;
  redirect(`/bbs-control/${module}/${id}?success=Operación%20guardada.`);
}
