import { Save } from "lucide-react";
import { updateFixture, updateKnockoutMatch } from "@/app/admin/actions";
import type { Fixture, KnockoutMatch } from "@/lib/types";

type Props =
  | { type: "fixture"; match: Fixture }
  | { type: "knockout"; match: KnockoutMatch };

function teamName(team?: { name: string } | null, seed?: string | null) {
  return team?.name ?? seed ?? "TBC";
}

export function AdminMatchForm({ type, match }: Props) {
  const action = type === "fixture" ? updateFixture : updateKnockoutMatch;
  const knockout = type === "knockout" ? match : null;

  return (
    <form action={action} className="overflow-hidden rounded-md border border-line bg-white shadow-glow">
      <div className="h-1 bg-gradient-to-r from-turf via-cyan to-gold" />
      <div className="p-3 sm:p-4">
      <input type="hidden" name="id" value={match.id} />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">
            {type === "fixture" ? match.groups?.name : match.round}
          </p>
          <h3 className="mt-1 text-base font-black leading-tight text-ink sm:text-lg">
            {teamName(match.home_team, knockout?.home_seed)} vs {teamName(match.away_team, knockout?.away_seed)}
          </h3>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-gold"
        >
          <Save size={16} />
          Save
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <label className="lg:col-span-1">
          <span className="mb-1 block text-xs font-black uppercase text-ink/55">Date</span>
          <input
            name="match_date"
            type="date"
            defaultValue={match.match_date ?? ""}
            className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="lg:col-span-1">
          <span className="mb-1 block text-xs font-black uppercase text-ink/55">Kickoff</span>
          <input
            name="kickoff_time"
            type="time"
            defaultValue={match.kickoff_time?.slice(0, 5) ?? ""}
            className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="sm:col-span-2 xl:col-span-2">
          <span className="mb-1 block text-xs font-black uppercase text-ink/55">Venue</span>
          <input
            name="venue"
            defaultValue={match.venue ?? ""}
            placeholder="Optional"
            className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase text-ink/55">Home</span>
          <input
            name="home_score"
            type="number"
            min="0"
            defaultValue={match.home_score ?? ""}
            className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-black uppercase text-ink/55">Away</span>
          <input
            name="away_score"
            type="number"
            min="0"
            defaultValue={match.away_score ?? ""}
            className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
          />
        </label>
      </div>
      <label className="mt-3 block max-w-xs">
        <span className="mb-1 block text-xs font-black uppercase text-ink/55">Status</span>
        <select
          name="status"
          defaultValue={match.status}
          className="w-full rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
        >
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="finished">Finished</option>
        </select>
      </label>
      </div>
    </form>
  );
}
