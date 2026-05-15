import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");

  try {
    const contents = readFileSync(path, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      const rawValue = trimmed.slice(equalsIndex + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");
      process.env[key] = process.env[key] ?? value;
    }
  } catch {
    // Environment variables may already be provided by the shell or Vercel.
  }
}

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function findUserByEmail(supabase: SupabaseClient, email: string) {
  let page = 1;

  while (page < 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 100) return null;

    page += 1;
  }

  return null;
}

async function main() {
  loadEnvLocal();

  const email = argValue("--email") ?? process.env.ADMIN_EMAIL;
  const password = argValue("--password") ?? process.env.ADMIN_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !password) {
    throw new Error(
      "Provide admin credentials: npm run admin:create -- --email admin@example.com --password 'strong-password'"
    );
  }

  if (!url || !serviceRole) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false }
  });

  const existingUser = await findUserByEmail(supabase, email);
  const user =
    existingUser ??
    (
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      })
    ).data.user;

  if (!user) {
    throw new Error("Could not create or find the admin user.");
  }

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true
    });
    if (error) throw error;
  }

  const { error: adminError } = await supabase
    .from("admins")
    .upsert({ user_id: user.id, email }, { onConflict: "user_id" });

  if (adminError) throw adminError;

  console.log(`Admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
