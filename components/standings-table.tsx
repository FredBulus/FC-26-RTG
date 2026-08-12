import type { Standing } from "@/lib/types";

export function StandingsTable({ title, rows }: { title: string; rows: Standing[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-white shadow-glow">
      <div className="flex flex-col gap-3 border-b border-line bg-ink px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <div className="flex flex-wrap gap-3 text-xs font-bold text-white/80">
          <span className="inline-flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#ff2882]" />
            Pink label: Qualifies for prize money
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-5 w-1.5 rounded-full bg-[#04f5ff]" />
            Blue label: Qualifies for Knockout Tournament
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-pitch text-xs uppercase tracking-[0.16em] text-ink/55">
            <tr>
              <th className="w-3 px-0 py-3" aria-label="Status" />
              <th className="px-4 py-3">Team</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">D</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center">GF</th>
              <th className="px-3 py-3 text-center">GA</th>
              <th className="px-3 py-3 text-center">GD</th>
              <th className="sticky right-0 z-10 bg-pitch px-3 py-3 text-center shadow-[-10px_0_18px_rgba(55,0,80,0.08)]">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, index) => {
              const place = index + 1;
              const isPrizePlace = place <= 4;
              const isQualifier = place <= 8;
              const rowClass = isPrizePlace
                ? "bg-[#fff2f8]"
                : isQualifier
                  ? "bg-[#e8feff]"
                  : undefined;
              const pointsBg = isPrizePlace
                ? "bg-[#fff2f8]"
                : isQualifier
                  ? "bg-[#e8feff]"
                  : "bg-white";
              const markerClass = isPrizePlace
                ? "bg-[#ff2882]"
                : isQualifier
                  ? "bg-[#04f5ff]"
                  : "bg-transparent";

              return (
              <tr key={row.team_id} className={rowClass}>
                <td className="px-0 py-0">
                  <span className={`block h-full min-h-14 w-1.5 rounded-r-full ${markerClass}`} />
                </td>
                <td className="px-4 py-3 font-bold">
                  <span className="mr-3 text-ink/45">{place}</span>
                  {row.teams?.name}
                  {place === 1 ? (
                    <span className="ml-3 rounded-full bg-[#ff2882] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      W
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-3 text-center">{row.played}</td>
                <td className="px-3 py-3 text-center">{row.wins}</td>
                <td className="px-3 py-3 text-center">{row.draws}</td>
                <td className="px-3 py-3 text-center">{row.losses}</td>
                <td className="px-3 py-3 text-center">{row.goals_for}</td>
                <td className="px-3 py-3 text-center">{row.goals_against}</td>
                <td className="px-3 py-3 text-center">{row.goal_difference}</td>
                <td
                  className={`sticky right-0 z-10 px-3 py-3 text-center text-lg font-black text-gold shadow-[-10px_0_18px_rgba(55,0,80,0.08)] ${
                    pointsBg
                  }`}
                >
                  {row.points}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
