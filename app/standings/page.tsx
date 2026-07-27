import { PageTitle } from "@/components/page-title";
import { StandingsTable } from "@/components/standings-table";
import { getStandings } from "@/lib/data";

export const revalidate = 0;

export default async function StandingsPage() {
  const standings = await getStandings();
  const standingsByGroup = standings.reduce<Record<string, typeof standings>>((groups, row) => {
    const groupName = row.groups?.name ?? "Ungrouped";
    groups[groupName] = groups[groupName] ?? [];
    groups[groupName].push(row);
    return groups;
  }, {});

  return (
    <div>
      <PageTitle eyebrow="Tables" title="Group Standings">
        Points, wins, draws, losses, goals, and goal difference update automatically when
        match scores are marked finished.
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.entries(standingsByGroup).map(([groupName, rows]) => (
          <StandingsTable key={groupName} title={groupName} rows={rows} />
        ))}
      </div>
    </div>
  );
}
