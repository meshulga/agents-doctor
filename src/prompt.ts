import { select } from "@inquirer/prompts";

export type AgentChoice = "claude" | "codex";

export type SelectAgentFn = (message: string) => Promise<AgentChoice>;

export const interactiveSelectAgent: SelectAgentFn = async (message) => {
  // Escape hatch for non-TTY contexts (CI, scripts, the demo runner). The
  // inquirer select widget needs a raw-mode TTY; without one it errors with
  // "User force closed the prompt", which is opaque.
  const env = process.env.AGENTS_DOCTOR_PRIORITY;
  if (env === "claude" || env === "codex") return env;
  if (env !== undefined) {
    throw new Error(
      `AGENTS_DOCTOR_PRIORITY must be 'claude' or 'codex', got '${env}'`,
    );
  }

  return select({
    message,
    choices: [
      { name: "Claude Code", value: "claude" as const },
      { name: "Codex CLI", value: "codex" as const },
    ],
  });
};
