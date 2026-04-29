import type {
  AgentTarget,
  MatrixCellState,
  RulePriority,
  Severity,
  SyncStatus,
} from "../types/index";

export const accent = "cyan" as const;

export const cellGlyph: Record<MatrixCellState, string> = {
  present: "✓",
  drifted: "!",
  overridden: "o",
  absent: "·",
};

export const cellLabel: Record<MatrixCellState, string> = {
  present: "ok",
  drifted: "drift",
  overridden: "ovr",
  absent: "—",
};

export const cellColor: Record<
  MatrixCellState,
  "green" | "red" | "magenta" | "gray"
> = {
  present: "green",
  drifted: "red",
  overridden: "magenta",
  absent: "gray",
};

export const sevColor: Record<Severity, "red" | "yellow" | "blue"> = {
  error: "red",
  warning: "yellow",
  suggestion: "blue",
};

export const sevSection: Record<Severity, string> = {
  error: "ERRORS",
  warning: "WARNINGS",
  suggestion: "SUGGESTIONS",
};

export const sevOrder: Severity[] = ["error", "warning", "suggestion"];

export const priorityLabel: Record<RulePriority, string> = {
  high: "HIGH",
  normal: "NORM",
  low: " LOW",
};

export const priorityColor: Record<RulePriority, "red" | "white" | "gray"> = {
  high: "red",
  normal: "white",
  low: "gray",
};

export const statusColor: Record<SyncStatus, "green" | "red" | "yellow"> = {
  "in-sync": "green",
  drifted: "red",
  unsynced: "yellow",
};

export const statusGlyph: Record<SyncStatus, string> = {
  "in-sync": "✓",
  drifted: "!",
  unsynced: "~",
};

export const statusLabel: Record<SyncStatus, string> = {
  "in-sync": "IN SYNC",
  drifted: "DRIFTED",
  unsynced: "UNSYNCED",
};

export function scopeLabel(agents: AgentTarget[]): string {
  if (agents.length === 1 && agents[0] === "*") return "all";
  if (agents.length === 1) return `${agents[0]} only`;
  return agents.join(", ");
}

export function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
