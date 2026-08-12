import type { Fixture } from "@/lib/types";

function teamName(team?: { name: string } | null) {
  return team?.name ?? "TBC";
}

function score(match: Fixture) {
  if (match.home_score === null || match.away_score === null) return "v";
  return `${match.home_score} - ${match.away_score}`;
}

export function MatchCard({ match }: { match: Fixture }) {
  return (
    <article className="overflow-hidden rounded-md border border-line bg-white shadow-glow">
      <div className="h-1 bg-gradient-to-r from-turf via-cyan to-gold" />
      <div className="p-3 sm:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">
            {match.groups?.name}
          </p>
          <h3 className="mt-1 text-sm font-black text-ink/70">
            Game Week {match.matchday}
          </h3>
        </div>
        <span className="rounded bg-ink px-2 py-1 text-xs font-black uppercase text-white">
          {match.status}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] sm:gap-3">
        <p className="min-w-0 break-words text-right text-sm font-black leading-tight text-ink sm:text-lg">
          {teamName(match.home_team)}
        </p>
        <p className="min-w-14 rounded bg-gradient-to-r from-cyan to-turf px-2 py-2 text-center text-base font-black text-ink sm:min-w-16 sm:px-3 sm:text-lg">
          {score(match)}
        </p>
        <p className="min-w-0 break-words text-sm font-black leading-tight text-ink sm:text-lg">
          {teamName(match.away_team)}
        </p>
      </div>
      </div>
    </article>
  );
}
