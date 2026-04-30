import pc from "picocolors";
import logSymbols from "log-symbols";
import { diffLines } from "diff";

// Centralizing visual concerns here keeps the rest of the CLI plain and makes
// swapping the underlying libraries (or stripping color in CI) a one-file
// change.

export const ui = {
  ok: (msg: string) => `${logSymbols.success} ${pc.green(msg)}`,
  fail: (msg: string) => `${logSymbols.error} ${pc.red(msg)}`,
  warn: (msg: string) => `${logSymbols.warning} ${pc.yellow(msg)}`,
  info: (msg: string) => `${logSymbols.info} ${pc.cyan(msg)}`,
  bold: (msg: string) => pc.bold(msg),
  dim: (msg: string) => pc.dim(msg),
  red: (msg: string) => pc.red(msg),
  green: (msg: string) => pc.green(msg),
  yellow: (msg: string) => pc.yellow(msg),
};

/**
 * Render a unified-style diff with red `-` for expected (what sync would
 * write) and green `+` for actual (what's on disk). Lines that match are
 * shown dim with a leading space. Returns the formatted string ready to
 * print; never throws — falls back to "(binary)" if either side has NULs.
 */
export function renderDiff(expected: Buffer, actual: Buffer): string {
  if (expected.includes(0) || actual.includes(0)) return ui.dim("  (binary differs)");
  const a = expected.toString("utf8");
  const b = actual.toString("utf8");
  const out: string[] = [];
  for (const part of diffLines(a, b)) {
    const lines = part.value.replace(/\n$/, "").split("\n");
    for (const line of lines) {
      if (part.added) out.push(pc.green(`+ ${line}`));
      else if (part.removed) out.push(pc.red(`- ${line}`));
      else out.push(pc.dim(`  ${line}`));
    }
  }
  return out.join("\n");
}
