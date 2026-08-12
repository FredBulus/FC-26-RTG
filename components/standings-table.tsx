import type { Standing } from "@/lib/types";

export function StandingsTable({ title, rows }: { title: string; rows: Standing[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-white shadow-glow">
      <div className="flex flex-col gap-3 border-b border-line bg-ink px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em]">
          <span className="rounded bg-gold px-2 py-1 text-white">Top 4 Prize</span>
          <span className="rounded bg-cyan px-2 py-1 text-ink">Top 8 Qualify</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-pitch text-xs uppercase tracking-[0.16em] text-ink/55">
            <tr>
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
                ? "bg-[#fff4c2]"
                : isQualifier
                  ? "bg-[#dfffff]"
                  : undefined;
              const pointsBg = isPrizePlace
                ? "bg-[#fff4c2]"
                : isQualifier
                  ? "bg-[#dfffff]"
                  : "bg-white";

              return (
              <tr key={row.team_id} className={rowClass}>
                <td className="px-4 py-3 font-bold">
                  <span className="mr-3 text-ink/45">{place}</span>
                  {row.teams?.name}
                  {isPrizePlace ? (
                    <span className="ml-3 rounded bg-gold px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                      Prize
                    </span>
                  ) : isQualifier ? (
                    <span className="ml-3 rounded bg-cyan px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink">
                      Qualified
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
