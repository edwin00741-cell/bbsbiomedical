import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const username = process.env.INITIAL_SUPERUSER_USERNAME || "edwin00741";
const password = process.env.INITIAL_SUPERUSER_PASSWORD;
const fullName = process.env.INITIAL_SUPERUSER_FULL_NAME || "Edwin Rodríguez";
const email = `${username.trim().toLowerCase()}@bbsbiomedical.local`;

if (!supabaseUrl || !serviceRoleKey || !password) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o INITIAL_SUPERUSER_PASSWORD.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: existingProfile } = await supabase
  .from("profiles")
  .select("id")
  .eq("username", username)
  .maybeSingle();

if (existingProfile) {
  console.log(`Super usuario ${username} ya existe.`);
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

const { error: profileError } = await supabase.from("profiles").insert({
  id: authUser.user.id,
  username,
  full_name: fullName,
  role: "super_admin",
  is_active: true,
});

if (profileError) {
  await supabase.auth.admin.deleteUser(authUser.user.id);
  console.error(profileError.message);
  process.exit(1);
}

console.log(`Super usuario creado: ${username}`);
