import pc from "picocolors";
import logSymbols from "log-symbols";

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
