"use client";

import { useMemo, useState } from "react";
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
  const gameWeeks = Object.keys(groupedMatches).sort((a, b) => {
    const weekA = Number(a.replace("Game Week ", ""));
    const weekB = Number(b.replace("Game Week ", ""));
    return weekA - weekB;
  });
  const [activeWeek, setActiveWeek] = useState(gameWeeks[0] ?? "");
  const activeMatches = groupedMatches[activeWeek] ?? [];

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-line bg-white p-2 shadow-glow">
        <div className="grid gap-2 sm:grid-cols-4">
          {gameWeeks.map((week) => (
            <button
              key={week}
              type="button"
              onClick={() => setActiveWeek(week)}
              className={`rounded px-4 py-3 text-sm font-black transition ${
                activeWeek === week
                  ? "bg-ink text-white"
                  : "bg-pitch text-ink hover:bg-cyan"
              }`}
            >
              {week}
            </button>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-black text-ink">{activeWeek}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {activeMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>
    </section>
  );
}
