import Link from "next/link";
import { BookOpenCheck, Calendar, Medal, Table2 } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { PageTitle } from "@/components/page-title";
import { StandingsTable } from "@/components/standings-table";
import { tournamentName } from "@/lib/constants";
import { getFixtures, getStandings } from "@/lib/data";

export const revalidate = 0;

export default async function HomePage() {
  const [fixtures, standings] = await Promise.all([
    getFixtures(),
    getStandings()
  ]);
  const upcoming = fixtures
    .filter((match) => match.status !== "finished")
    .slice(0, 4);
  const standingsByGroup = standings.reduce<Record<string, typeof standings>>((groups, row) => {
    const groupName = row.groups?.name ?? "Ungrouped";
    groups[groupName] = groups[groupName] ?? [];
    groups[groupName].push(row);
    return groups;
  }, {});

  return (
    <div className="space-y-10">
      <section className="grid gap-8 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <PageTitle eyebrow="Tournament HQ" title={tournamentName}>
            Follow every league fixture, table movement, and result from a single
            read-only public experience. The top 4 win prizes and the top 8 qualify.
          </PageTitle>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/fixtures" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Calendar className="mb-4 text-gold" />
              <p className="font-black">Fixtures</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Home and away league</p>
            </Link>
            <Link href="/standings" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Table2 className="mb-4 text-gold" />
              <p className="font-black">League Table</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Automatic standings</p>
            </Link>
            <Link href="/standings" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <Medal className="mb-4 text-gold" />
              <p className="font-black">Top 8</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">Prize and qualifier places</p>
            </Link>
            <Link href="/rules" className="rounded-md border border-line bg-white p-4 shadow-glow transition hover:-translate-y-0.5 hover:border-cyan">
              <BookOpenCheck className="mb-4 text-gold" />
              <p className="font-black">Rules</p>
              <p className="mt-1 text-sm font-semibold text-ink/60">League format and guidance</p>
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

      <section className="grid gap-5">
        {Object.entries(standingsByGroup).map(([groupName, rows]) => (
          <StandingsTable key={groupName} title={groupName} rows={rows} />
        ))}
      </section>
    </div>
  );
}
