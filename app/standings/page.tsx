import { PageTitle } from "@/components/page-title";
import { StandingsTable } from "@/components/standings-table";
import { getStandings } from "@/lib/data";

export const revalidate = 0;

export default async function StandingsPage() {
  const standings = await getStandings();
  const groupA = standings.filter((row) => row.groups?.name === "Group A");
  const groupB = standings.filter((row) => row.groups?.name === "Group B");

  return (
    <div>
      <PageTitle eyebrow="Tables" title="Group Standings">
        Points, wins, draws, losses, goals, and goal difference update automatically when
        match scores are marked finished.
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <StandingsTable title="Group A" rows={groupA} />
        <StandingsTable title="Group B" rows={groupB} />
      </div>
    </div>
  );
}
