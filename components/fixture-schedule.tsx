"use client";

import { useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import type { Fixture } from "@/lib/types";

type ScheduleMatch = Fixture & {
  gameWeekName: string;
};

function gameWeekName(match: Fixture) {
  return `Game Week ${match.matchday}`;
}

export function FixtureSchedule({
  fixtures
}: {
  fixtures: Fixture[];
}) {
  const matches = useMemo<ScheduleMatch[]>(
    () =>
      fixtures
        .map((match) => ({ ...match, gameWeekName: gameWeekName(match) }))
        .sort((a, b) => {
          return a.matchday - b.matchday;
        }),
    [fixtures]
  );

  const groupedMatches = matches.reduce<Record<string, ScheduleMatch[]>>((acc, match) => {
    const key = match.gameWeekName;
    acc[key] = acc[key] ?? [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      {Object.entries(groupedMatches).map(([key, groupMatches]) => (
        <section key={key}>
          <h2 className="mb-3 text-2xl font-black text-ink">{key}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {groupMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
