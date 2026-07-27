import { FixtureSchedule } from "@/components/fixture-schedule";
import { PageTitle } from "@/components/page-title";
import { getFixtures, getKnockoutMatches } from "@/lib/data";

export const revalidate = 0;

export default async function FixturesPage() {
  const [fixtures, knockoutMatches] = await Promise.all([getFixtures(), getKnockoutMatches()]);

  return (
    <div>
      <PageTitle eyebrow="Fixtures" title="Match List">
        Browse every group and knockout fixture in the tournament.
      </PageTitle>
      <FixtureSchedule fixtures={fixtures} knockoutMatches={knockoutMatches} />
    </div>
  );
}
