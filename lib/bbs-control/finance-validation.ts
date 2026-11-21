import { z } from "zod";
import { documentInputSchema } from "./document-validation";

const money = z.coerce.number().finite().positive().max(9999999999.99).multipleOf(0.01);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform((value) => value || null);
const nullableId = z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable());
const reason = z.string().trim().min(2, "Indique el motivo.").max(2000);
const allocation = z.object({ invoice_id: z.uuid(), amount: money });
const allocations = z.array(allocation).max(100).refine((rows) => new Set(rows.map((row) => row.invoice_id)).size === rows.length, "Cada factura debe aparecer una sola vez.");
const metadata = { date: z.iso.date(), payment_method_id: nullableId, reference: optionalText(300), notes: optionalText(5000) };
export const financeCommandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("payment.create"), client_id: z.uuid(), amount: money, ...metadata, allocations }),
  z.object({ operation: z.literal("payment.update"), id: z.uuid(), version: z.iso.datetime({ offset: true }), ...metadata }),
  z.object({ operation: z.literal("payment.void"), id: z.uuid(), reason }),
  z.object({ operation: z.literal("application.apply"), source_kind: z.enum(["payment", "credit"]), source_id: z.uuid(), allocations: allocations.refine((rows) => rows.length > 0, "Seleccione una factura.") }),
  z.object({ operation: z.literal("application.unapply"), application_id: z.uuid(), reason }),
  z.object({ operation: z.literal("credit.create"), document: documentInputSchema, source_invoice_id: nullableId, reason, allocations }),
  z.object({ operation: z.literal("credit.update"), id: z.uuid(), version: z.iso.datetime({ offset: true }), document: documentInputSchema, reason }),
  z.object({ operation: z.literal("credit.void"), id: z.uuid(), reason }),
  z.object({ operation: z.literal("refund.create"), client_id: z.uuid(), payment_id: z.uuid(), credit_note_id: nullableId, amount: money, date: z.iso.date(), payment_method_id: nullableId, reference: optionalText(300), reason }),
  z.object({ operation: z.literal("refund.void"), id: z.uuid(), reason }),
]);
