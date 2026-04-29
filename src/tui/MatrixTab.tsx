import { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState, MatrixCellState } from "../types/index";
import { HRule } from "./SectionHeader";
import { useInnerWidth } from "./useInnerWidth";
import {
  accent,
  cellColor,
  cellGlyph,
  cellLabel,
  priorityColor,
  priorityLabel,
  scopeLabel,
  truncate,
} from "./theme";

const SPINE_W = 2;
const AGENT_W = 9;
const SCOPE_W = 14;
const PRI_W = 5;
const MIN_NAME_W = 18;

export function MatrixTab({ state }: { state: DoctorState }) {
  const [row, setRow] = useState(0);
  const inner = useInnerWidth();
  const fixedCols =
    SPINE_W + AGENT_W * state.agents.length + SCOPE_W + PRI_W;
  const nameW = Math.max(MIN_NAME_W, inner - fixedCols);

  useInput((_input, key) => {
    if (key.upArrow) setRow((r) => Math.max(0, r - 1));
    else if (key.downArrow)
      setRow((r) => Math.min(state.rules.length - 1, r + 1));
  });

  const selected = state.rules[row];

  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor bold>
          {" ".repeat(SPINE_W)}
          {"RULE".padEnd(nameW)}
          {state.agents
            .map((a) => a.toUpperCase().padEnd(AGENT_W))
            .join("")}
          {"SCOPE".padEnd(SCOPE_W)}
          {"PRI".padEnd(PRI_W)}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <HRule />
      </Box>

      {state.rules.map((rule, i) => {
        const sel = i === row;
        const priority = rule.frontmatter.priority ?? "normal";
        const name = truncate(rule.name, nameW - 1).padEnd(nameW);
        return (
          <Box key={rule.id}>
            <Text>
              <Text color={accent}>{sel ? "▌ " : "  "}</Text>
              <Text bold={sel}>{name}</Text>
              {state.agents.map((a) => {
                const c = state.matrix.find(
                  (m) => m.ruleId === rule.id && m.agent === a,
                );
                const cs: MatrixCellState = c?.state ?? "absent";
                return (
                  <Text key={a} color={cellColor[cs]}>
                    {`${cellGlyph[cs]} ${cellLabel[cs]}`.padEnd(AGENT_W)}
                  </Text>
                );
              })}
              <Text dimColor>
                {scopeLabel(rule.frontmatter.agents).padEnd(SCOPE_W)}
              </Text>
              <Text color={priorityColor[priority]}>
                {priorityLabel[priority].padEnd(PRI_W)}
              </Text>
            </Text>
          </Box>
        );
      })}

      {selected && (
        <Box flexDirection="column" marginTop={2}>
          <HRule />
          <Box marginTop={1}>
            <Text dimColor bold>{"ABOUT     "}</Text>
            <Text>{selected.body}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor bold>{"SOURCE    "}</Text>
            <Text dimColor>{selected.source}</Text>
          </Box>
          {selected.frontmatter.globs &&
            selected.frontmatter.globs.length > 0 && (
              <Box>
                <Text dimColor bold>{"GLOBS     "}</Text>
                <Text>{selected.frontmatter.globs.join(", ")}</Text>
              </Box>
            )}
        </Box>
      )}
    </Box>
  );
}
