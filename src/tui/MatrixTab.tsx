import { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState, MatrixCellState } from "../types/index";

const cellGlyph: Record<MatrixCellState, string> = {
  present: "✓",
  absent: "·",
  drifted: "!",
  overridden: "o",
};

const cellColor: Record<MatrixCellState, "green" | "gray" | "red" | "yellow"> = {
  present: "green",
  absent: "gray",
  drifted: "red",
  overridden: "yellow",
};

const NAME_COL = 36;
const AGENT_COL = 14;

export function MatrixTab({ state }: { state: DoctorState }) {
  const [row, setRow] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) setRow((r) => Math.max(0, r - 1));
    else if (key.downArrow) setRow((r) => Math.min(state.rules.length - 1, r + 1));
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Box width={NAME_COL}>
          <Text bold>Rule</Text>
        </Box>
        {state.agents.map((a) => (
          <Box key={a} width={AGENT_COL}>
            <Text bold>{a}</Text>
          </Box>
        ))}
      </Box>
      {state.rules.map((rule, i) => {
        const sel = i === row;
        return (
          <Box key={rule.id}>
            <Box width={NAME_COL}>
              <Text color={sel ? "cyan" : undefined} bold={sel}>
                {sel ? "▸ " : "  "}
                {rule.name}
              </Text>
            </Box>
            {state.agents.map((a) => {
              const cell = state.matrix.find(
                (c) => c.ruleId === rule.id && c.agent === a,
              );
              const cs: MatrixCellState = cell?.state ?? "absent";
              return (
                <Box key={a} width={AGENT_COL}>
                  <Text color={cellColor[cs]}>
                    {cellGlyph[cs]} {cs}
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
