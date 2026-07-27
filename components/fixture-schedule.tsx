"use client";

import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import type { Fixture, KnockoutMatch } from "@/lib/types";

type ScheduleMatch = (Fixture | KnockoutMatch) & {
  stageName: string;
};

function dateKey(match: Fixture | KnockoutMatch) {
  return match.match_date ?? "TBC";
}

function dateLabel(key: string) {
  if (key === "TBC") return "Date TBC";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(`${key}T12:00:00`));
}

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
          const dateA = a.match_date ?? "9999-12-31";
          const dateB = b.match_date ?? "9999-12-31";
          if (dateA !== dateB) return dateA.localeCompare(dateB);

          const timeA = a.kickoff_time ?? "99:99:99";
          const timeB = b.kickoff_time ?? "99:99:99";
          if (timeA !== timeB) return timeA.localeCompare(timeB);

          if ("round" in a && "round" in b) return a.sort_order - b.sort_order;
          if ("matchday" in a && "matchday" in b) return a.matchday - b.matchday;
          return a.stageName.localeCompare(b.stageName);
        }),
    [fixtures, knockoutMatches]
  );

  const dateKeys = useMemo(() => {
    const keys = Array.from(new Set(matches.map(dateKey)));
    return keys.sort((a, b) => {
      if (a === "TBC") return 1;
      if (b === "TBC") return -1;
      return a.localeCompare(b);
    });
  }, [matches]);

  const [activeDate, setActiveDate] = useState("all");
  const visibleMatches =
    activeDate === "all" ? matches : matches.filter((match) => dateKey(match) === activeDate);

  const groupedMatches = visibleMatches.reduce<Record<string, ScheduleMatch[]>>((acc, match) => {
    const key = activeDate === "all" ? dateKey(match) : match.stageName;
    acc[key] = acc[key] ?? [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-line bg-white p-3 shadow-glow">
        <div className="mb-3 flex items-center gap-2 px-1 text-sm font-black uppercase tracking-[0.16em] text-ink/60">
          <CalendarDays size={16} />
          Filter By Date
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveDate("all")}
            className={`shrink-0 rounded px-4 py-2 text-sm font-black transition ${
              activeDate === "all" ? "bg-ink text-white" : "bg-pitch text-ink hover:bg-cyan"
            }`}
          >
            All fixtures
          </button>
          {dateKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveDate(key)}
              className={`shrink-0 rounded px-4 py-2 text-sm font-black transition ${
                activeDate === key ? "bg-ink text-white" : "bg-pitch text-ink hover:bg-cyan"
              }`}
            >
              {dateLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {Object.entries(groupedMatches).map(([key, groupMatches]) => (
        <section key={key}>
          <h2 className="mb-3 text-2xl font-black text-ink">
            {activeDate === "all" ? dateLabel(key) : key}
          </h2>
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
