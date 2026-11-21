"use server";
import { submitFinanceCommand } from "../finance-actions";
export async function saveCredit(form: FormData) { return submitFinanceCommand(form, "notas-credito"); }
