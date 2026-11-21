"use server";
import { submitFinanceCommand } from "../finance-actions";
export async function savePayment(form: FormData) { return submitFinanceCommand(form, "pagos"); }
