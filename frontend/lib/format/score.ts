export function formatScore(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function averagePercent(rows: { score: number; max_points: number }[]) {
  const scored = rows.filter((row) => row.max_points > 0);
  if (scored.length === 0) return null;
  return scored.reduce((sum, row) => sum + (row.score / row.max_points) * 100, 0) / scored.length;
}
