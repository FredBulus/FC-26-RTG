"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { standingsWithPositions } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import type { Standing } from "@/lib/types";

function optionalString(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? text : null;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text ? Number(text) : null;
}

async function snapshotCurrentStandings(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("standings")
    .select("*, teams(*), groups(*)");

  if (error || !data) return;

  const snapshots = standingsWithPositions(data as Standing[]).map((row) => ({
    team_id: row.team_id,
    previous_position: row.position
  }));

  if (!snapshots.length) return;

  await supabase
    .from("standing_position_snapshots")
    .upsert(snapshots, { onConflict: "team_id" });
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

  await snapshotCurrentStandings(supabase);

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
