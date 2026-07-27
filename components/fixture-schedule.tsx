"use client";

import { useMemo } from "react";
import { MatchCard } from "@/components/match-card";
import type { Fixture, KnockoutMatch } from "@/lib/types";

type ScheduleMatch = (Fixture | KnockoutMatch) & {
  stageName: string;
};

function stageName(match: Fixture | KnockoutMatch) {
  return "round" in match ? match.round : match.groups?.name ?? "Group Stage";
}

export function FixtureSchedule({
  fixtures,
  knockoutMatches
}: {
  fixtures: Fixture[];
  knockoutMatches: KnockoutMatch[];
}) {
  const matches = useMemo<ScheduleMatch[]>(
    () =>
      [...fixtures, ...knockoutMatches]
        .map((match) => ({ ...match, stageName: stageName(match) }))
        .sort((a, b) => {
          if (a.stageName !== b.stageName) return a.stageName.localeCompare(b.stageName);
          if ("round" in a && "round" in b) return a.sort_order - b.sort_order;
          if ("matchday" in a && "matchday" in b) return a.matchday - b.matchday;
          return 0;
        }),
    [fixtures, knockoutMatches]
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
