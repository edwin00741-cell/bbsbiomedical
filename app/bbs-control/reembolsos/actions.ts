"use server";
import { submitFinanceCommand } from "../finance-actions";
export async function saveRefund(form: FormData) { return submitFinanceCommand(form, "reembolsos"); }
