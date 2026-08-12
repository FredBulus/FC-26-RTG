"use client";

import { useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import type { Fixture } from "@/lib/types";

type ScheduleMatch = Fixture & {
  stageName: string;
};

function stageName(match: Fixture) {
  return match.groups?.name ?? "League";
}

export function FixtureSchedule({
  fixtures
}: {
  fixtures: Fixture[];
}) {
  const matches = useMemo<ScheduleMatch[]>(
    () =>
      fixtures
        .map((match) => ({ ...match, stageName: stageName(match) }))
        .sort((a, b) => {
          if (a.stageName !== b.stageName) return a.stageName.localeCompare(b.stageName);
          return a.matchday - b.matchday;
        }),
    [fixtures]
  );

  const groupedMatches = matches.reduce<Record<string, ScheduleMatch[]>>((acc, match) => {
    const key = match.stageName;
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
