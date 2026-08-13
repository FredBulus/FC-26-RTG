import { redirect } from "next/navigation";
import { CalendarClock, CheckCircle2, ShieldCheck, Table2 } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { AdminMatchForm } from "@/components/admin-match-form";
import { getFixtures } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();
  const { data: userResult } = await supabase.auth.getUser();

  if (!userResult.user) {
    redirect("/admin/login");
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id,email")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (!admin) {
    redirect("/admin/login?error=unauthorized");
  }

  const fixtures = await getFixtures();
  const finishedFixtures = fixtures.filter((match) => match.status === "finished").length;
  const openFixtures = fixtures.filter((match) => match.status !== "finished").length;
  const fixturesByWeek = fixtures.reduce<Record<string, typeof fixtures>>((groups, match) => {
    const weekName = `Game Week ${match.matchday}`;
    groups[weekName] = groups[weekName] ?? [];
    groups[weekName].push(match);
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      <div className="rounded-md bg-ink p-4 text-white shadow-glow sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-black uppercase tracking-[0.24em] text-cyan">
              Admin Dashboard
            </p>
            <h1 className="text-3xl font-black sm:text-5xl">Tournament Control</h1>
            <p className="mt-3 max-w-3xl font-medium text-white/70">
              Edit league fixture scores and statuses. Public users can only view the
              saved tournament state.
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-md bg-white px-4 py-2 text-sm font-black text-ink transition hover:bg-cyan">
              Sign out
            </button>
          </form>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4 shadow-glow">
          <CalendarClock className="mb-3 text-gold" />
          <p className="text-3xl font-black text-ink">{fixtures.length}</p>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-ink/55">
            League fixtures
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-glow">
          <CheckCircle2 className="mb-3 text-gold" />
          <p className="text-3xl font-black text-ink">{finishedFixtures}</p>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-ink/55">
            Finished
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-glow">
          <ShieldCheck className="mb-3 text-gold" />
          <p className="text-3xl font-black text-ink">{openFixtures}</p>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-ink/55">Open</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-glow">
          <Table2 className="mb-3 text-gold" />
          <p className="text-3xl font-black text-ink">19</p>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-ink/55">
            Teams
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {Object.entries(fixturesByWeek).map(([weekName, weekFixtures]) => (
          <section key={weekName}>
            <div className="mb-3 rounded-md bg-ink px-4 py-3 text-white">
              <h2 className="text-xl font-black">{weekName}</h2>
            </div>
            <div className="space-y-4">
              {weekFixtures.map((match) => (
                <AdminMatchForm key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
