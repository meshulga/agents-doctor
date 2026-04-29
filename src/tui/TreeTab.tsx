import { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState } from "../types/index";

type TreeNode = {
  kind: "rule" | "skill" | "command" | "mcp" | "override";
  label: string;
  detail: string;
};

function buildNodes(state: DoctorState): TreeNode[] {
  return [
    ...state.rules.map<TreeNode>((r) => ({
      kind: "rule",
      label: r.name,
      detail: `agents: ${r.frontmatter.agents.join(",")}`,
    })),
    ...state.skills.map<TreeNode>((s) => ({
      kind: "skill",
      label: s.name,
      detail: `agents: ${s.agents.join(",")}`,
    })),
    ...state.commands.map<TreeNode>((c) => ({
      kind: "command",
      label: c.name,
      detail: `agents: ${c.agents.join(",")}`,
    })),
    ...state.mcpServers.map<TreeNode>((m) => ({
      kind: "mcp",
      label: m.name,
      detail: `agents: ${m.agents.join(",")}`,
    })),
    ...state.overrides.map<TreeNode>((o) => ({
      kind: "override",
      label: o.source,
      detail: `agent: ${o.agent}`,
    })),
  ];
}

export function TreeTab({ state }: { state: DoctorState }) {
  const nodes = useMemo(() => buildNodes(state), [state]);
  const [idx, setIdx] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    else if (key.downArrow) setIdx((i) => Math.min(nodes.length - 1, i + 1));
  });

  return (
    <Box flexDirection="column">
      {nodes.map((n, i) => {
        const sel = i === idx;
        return (
          <Box key={`${n.kind}-${i}`}>
            <Text color={sel ? "cyan" : undefined} bold={sel}>
              {sel ? "▸ " : "  "}[{n.kind.padEnd(8)}] {n.label}
              <Text dimColor>{"  "}{n.detail}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
