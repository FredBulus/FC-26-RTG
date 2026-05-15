import type { Standing } from "@/lib/types";

export function StandingsTable({ title, rows }: { title: string; rows: Standing[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-line bg-white shadow-glow">
      <div className="border-b border-line bg-ink px-4 py-3 text-white">
        <h2 className="text-xl font-black">{title}</h2>
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
            {rows.map((row, index) => (
              <tr key={row.team_id} className={index < 2 ? "bg-[#dfffff]" : undefined}>
                <td className="px-4 py-3 font-bold">
                  <span className="mr-3 text-ink/45">{index + 1}</span>
                  {row.teams?.name}
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
                    index < 2 ? "bg-[#dfffff]" : "bg-white"
                  }`}
                >
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
