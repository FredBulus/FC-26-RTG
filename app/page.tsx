import Link from "next/link";
import { Calendar, Table2, Trophy } from "lucide-react";
import { Bracket } from "@/components/bracket";
import { MatchCard } from "@/components/match-card";
import { PageTitle } from "@/components/page-title";
import { StandingsTable } from "@/components/standings-table";
import { getFixtures, getKnockoutMatches, getStandings } from "@/lib/data";

export const revalidate = 0;

export default async function HomePage() {
  const [fixtures, standings, knockout] = await Promise.all([
    getFixtures(),
    getStandings(),
    getKnockoutMatches()
  ]);
  const upcoming = fixtures
    .filter((match) => match.status !== "finished")
    .slice(0, 4);
  const groupA = standings.filter((row) => row.groups?.name === "Group A").slice(0, 5);
  const groupB = standings.filter((row) => row.groups?.name === "Group B").slice(0, 5);

  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <PageTitle eyebrow="Tournament HQ" title="Legacy Tournament 2026">
            Follow every fixture, table movement, result, and knockout step from a single
            read-only public experience.
          </PageTitle>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/fixtures" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Calendar className="mb-4 text-gold" />
              <p className="font-black">Fixtures</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Group stage schedule</p>
            </Link>
            <Link href="/standings" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Table2 className="mb-4 text-gold" />
              <p className="font-black">Tables</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Automatic standings</p>
            </Link>
            <Link href="/bracket" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Trophy className="mb-4 text-gold" />
              <p className="font-black">Knockout</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Semi finals and final</p>
            </Link>
          </div>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-glow">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-gold">
            Next Up
          </p>
          <div className="space-y-3">
            {upcoming.length ? (
              upcoming.map((match) => <MatchCard key={match.id} match={match} />)
            ) : (
              <p className="rounded-md border border-line p-4 font-semibold text-ink/60">No upcoming fixtures.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <StandingsTable title="Group A" rows={groupA} />
        <StandingsTable title="Group B" rows={groupB} />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black text-ink">Knockout Bracket</h2>
          <Link href="/bracket" className="text-sm font-black text-gold hover:text-ink">
            Full bracket
          </Link>
        </div>
        <Bracket matches={knockout} />
      </section>
    </div>
  );
}
