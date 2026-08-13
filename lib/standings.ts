import type { Standing } from "@/lib/types";

export function sortStandings(rows: Standing[]) {
  return [...rows].sort((a, b) => {
    const standingsSort =
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      b.wins - a.wins;

    if (standingsSort !== 0) return standingsSort;

    return (a.teams?.name ?? "").localeCompare(b.teams?.name ?? "", undefined, {
      sensitivity: "base"
    });
  });
}

export function standingsWithPositions(rows: Standing[]) {
  return sortStandings(rows).map((row, index) => ({
    ...row,
    position: index + 1
  }));
}
