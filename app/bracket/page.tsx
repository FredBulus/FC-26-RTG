import { Bracket } from "@/components/bracket";
import { PageTitle } from "@/components/page-title";
import { getKnockoutMatches } from "@/lib/data";

export const revalidate = 0;

export default async function BracketPage() {
  const matches = await getKnockoutMatches();

  return (
    <div>
      <PageTitle eyebrow="Knockout" title="Tournament Bracket">
        Semi finals are seeded from the top two teams in each group. The final is populated
        by the semi final winners.
      </PageTitle>
      <Bracket matches={matches} />
    </div>
  );
}
