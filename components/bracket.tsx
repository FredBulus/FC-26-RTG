import { Trophy } from "lucide-react";
import type { KnockoutMatch } from "@/lib/types";
import { MatchCard } from "@/components/match-card";

export function Bracket({ matches }: { matches: KnockoutMatch[] }) {
  const semiFinals = matches.filter((match) => match.round === "Semi Final");
  const final = matches.find((match) => match.round === "Final");

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_0.32fr_1fr] lg:items-center">
      <div className="space-y-5">
        {semiFinals.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
      <div className="hidden h-full items-center justify-center lg:flex">
        <div className="h-px w-full bg-line" />
      </div>
      <div className="space-y-4">
        {final ? <MatchCard match={final} /> : null}
        <div className="rounded-md border border-line bg-ink p-4 text-white shadow-glow">
          <div className="flex items-center gap-3">
            <Trophy className="text-gold" />
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gold">Champion</p>
              <p className="text-xl font-black">
                {final?.winner_team?.name ?? "To be decided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
