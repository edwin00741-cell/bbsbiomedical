import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadLocalEnv();

const [usernameArg, fullNameArg, roleArg] = process.argv.slice(2);
const username = (usernameArg || "").trim().toLowerCase();
const fullName = fullNameArg || username;
const role = roleArg || "admin";
const password = `BBS-${crypto.randomBytes(4).toString("hex")}-2026!`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!username) {
  console.error("Falta username.");
  process.exit(1);
}

if (!["admin", "super_admin"].includes(role)) {
  console.error("Rol inválido.");
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const email = `${username}@bbsbiomedical.local`;
const { data: existingProfile, error: profileLookupError } = await supabase
  .from("profiles")
  .select("id")
  .eq("username", username)
  .maybeSingle();

if (profileLookupError) {
  console.error(profileLookupError.message);
  process.exit(1);
}

if (existingProfile) {
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role, full_name: fullName, is_active: true })
    .eq("id", existingProfile.id);

  if (updateError) {
    console.error(updateError.message);
    process.exit(1);
  }

  const { error: passwordError } = await supabase.auth.admin.updateUserById(
    existingProfile.id,
    { password, email_confirm: true },
  );

  if (passwordError) {
    console.error(passwordError.message);
    process.exit(1);
  }

  console.log(JSON.stringify({ status: "updated", username, password }));
  process.exit(0);
}

const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (authError || !authUser.user) {
  console.error(authError?.message || "No se pudo crear el usuario.");
  process.exit(1);
}

const { error: insertError } = await supabase.from("profiles").insert({
  id: authUser.user.id,
  username,
  full_name: fullName,
  role,
  is_active: true,
});

if (insertError) {
  await supabase.auth.admin.deleteUser(authUser.user.id);
  console.error(insertError.message);
  process.exit(1);
}

console.log(JSON.stringify({ status: "created", username, password }));
