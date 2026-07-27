import { Trophy } from "lucide-react";
import type { KnockoutMatch } from "@/lib/types";
import { MatchCard } from "@/components/match-card";

export function Bracket({ matches }: { matches: KnockoutMatch[] }) {
  const rounds = ["Quarter Final", "Semi Final", "Final"]
    .map((round) => ({
      round,
      matches: matches.filter((match) => match.round === round)
    }))
    .filter((round) => round.matches.length > 0);
  const final = matches.find((match) => match.round === "Final");

  return (
    <section className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-3">
        {rounds.map(({ round, matches: roundMatches }) => (
          <section key={round}>
            <div className="mb-3 rounded-md bg-ink px-4 py-3 text-white">
              <h3 className="text-lg font-black">{round}</h3>
            </div>
            <div className="space-y-4">
              {roundMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </div>
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
    </section>
  );
}
