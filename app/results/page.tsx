import { MatchCard } from "@/components/match-card";
import { PageTitle } from "@/components/page-title";
import { getResults } from "@/lib/data";

export const revalidate = 0;

export default async function ResultsPage() {
  const { fixtures } = await getResults();

  return (
    <div>
      <PageTitle eyebrow="Scores" title="Results">
        Finished league matches appear here as admins update scores.
      </PageTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {fixtures.length ? (
          fixtures.map((match) => <MatchCard key={match.id} match={match} />)
        ) : (
          <p className="rounded-md border border-line bg-white p-4 font-semibold text-ink/60 shadow-glow">
            No league results yet.
          </p>
        )}
      </div>
    </div>
  );
}
