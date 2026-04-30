import { createInterface } from "node:readline/promises";

export type AgentChoice = "claude" | "codex";

export type SelectAgentFn = (message: string) => Promise<AgentChoice>;

export const interactiveSelectAgent: SelectAgentFn = async (message) => {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const ans = (await rl.question(`${message} (claude/codex): `)).trim().toLowerCase();
      if (ans === "claude" || ans === "codex") return ans;
      console.log("please enter 'claude' or 'codex'.");
    }
  } finally {
    rl.close();
  }
};
