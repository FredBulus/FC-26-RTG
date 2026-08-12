import { FixtureSchedule } from "@/components/fixture-schedule";
import { PageTitle } from "@/components/page-title";
import { getFixtures } from "@/lib/data";

export const revalidate = 0;

export default async function FixturesPage() {
  const fixtures = await getFixtures();

  return (
    <div>
      <PageTitle eyebrow="Fixtures" title="Match List">
        Browse every home-and-away league fixture across the four game weeks.
      </PageTitle>
      <FixtureSchedule fixtures={fixtures} />
    </div>
  );
}
