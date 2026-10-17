// Colors.ts
// Shared terminal formatting for printing the reasoner's state. No packages needed.

export const c = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m", gray: "\x1b[90m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
};

const ANSI = /\x1b\[[0-9;]*m/g;

/** Visible length of a string, ignoring color codes. */
export const visible = (s: string): number => s.replace(ANSI, "").length;

/** Pads to a visible width, ignoring color codes. */
export const pad = (s: string, width: number): string => s + " ".repeat(Math.max(0, width - visible(s)));

/** A 10-character priority bar: ████████░░ */
export const bar = (p: number): string => {
  const n = Math.round(p * 10);
  return c.green + "█".repeat(n) + c.gray + "░".repeat(10 - n) + c.reset;
};

export const sourceColor = { user: c.cyan, llm: c.magenta, derived: c.yellow } as const;

/** Prints rows as an aligned table with a dim header. */
export function table(header: string[], rows: string[][], indent = "  "): void {
  const widths = header.map((h, i) => Math.max(visible(h), ...rows.map(r => visible(r[i] ?? ""))));
  const line = (cells: string[]) => indent + cells.map((cell, i) => pad(cell, widths[i])).join("  ");
  console.log(c.dim + line(header) + c.reset);
  console.log(c.gray + indent + widths.map(w => "─".repeat(w)).join("  ") + c.reset);
  for (const r of rows) console.log(line(r));
}
