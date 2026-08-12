"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function optionalString(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? text : null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? Number(text) : null;
}

export async function login(formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/admin/login?error=invalid");
  }

  const { data: userResult } = await supabase.auth.getUser();
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userResult.user?.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateFixture(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id")?.toString();
  if (!id) return;

  const homeScore = optionalNumber(formData.get("home_score"));
  const awayScore = optionalNumber(formData.get("away_score"));
  const status = formData.get("status")?.toString() ?? "scheduled";

  const { error } = await supabase
    .from("fixtures")
    .update({
      match_date: optionalString(formData.get("match_date")),
      kickoff_time: optionalString(formData.get("kickoff_time")),
      venue: optionalString(formData.get("venue")),
      home_score: homeScore,
      away_score: awayScore,
      status
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/fixtures");
  revalidatePath("/standings");
  revalidatePath("/results");
  revalidatePath("/admin");
}
