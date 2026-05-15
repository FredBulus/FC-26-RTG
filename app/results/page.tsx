import { MatchCard } from "@/components/match-card";
import { PageTitle } from "@/components/page-title";
import { getResults } from "@/lib/data";

export const revalidate = 0;

export default async function ResultsPage() {
  const { fixtures, knockout } = await getResults();

  return (
    <div>
      <PageTitle eyebrow="Scores" title="Results">
        Finished group and knockout matches appear here as admins update scores.
      </PageTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-2xl font-black">Group Stage</h2>
          <div className="space-y-4">
            {fixtures.length ? (
              fixtures.map((match) => <MatchCard key={match.id} match={match} />)
            ) : (
              <p className="rounded-md border border-line bg-white p-4 font-semibold text-ink/60 shadow-glow">
                No group results yet.
              </p>
            )}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-2xl font-black">Knockout</h2>
          <div className="space-y-4">
            {knockout.length ? (
              knockout.map((match) => <MatchCard key={match.id} match={match} />)
            ) : (
              <p className="rounded-md border border-line bg-white p-4 font-semibold text-ink/60 shadow-glow">
                No knockout results yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
