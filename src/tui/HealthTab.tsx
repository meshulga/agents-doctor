import { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState, Severity } from "../types/index";

const sevOrder: Severity[] = ["error", "warning", "suggestion"];

const sevColor: Record<Severity, "red" | "yellow" | "blue"> = {
  error: "red",
  warning: "yellow",
  suggestion: "blue",
};

export function HealthTab({ state }: { state: DoctorState }) {
  const sorted = useMemo(
    () =>
      [...state.issues].sort(
        (a, b) => sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity),
      ),
    [state.issues],
  );
  const [idx, setIdx] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    else if (key.downArrow) setIdx((i) => Math.min(sorted.length - 1, i + 1));
  });

  const selected = sorted[idx];

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        {sorted.map((issue, i) => {
          const sel = i === idx;
          return (
            <Box key={issue.id}>
              <Text color={sel ? "cyan" : undefined} bold={sel}>
                {sel ? "▸ " : "  "}
              </Text>
              <Text color={sevColor[issue.severity]}>
                [{issue.severity.padEnd(10)}]
              </Text>
              <Text> {issue.message}</Text>
            </Box>
          );
        })}
      </Box>
      {selected && (
        <Box flexDirection="column" borderStyle="single" paddingX={1}>
          <Text bold>{selected.ruleId}</Text>
          <Text>
            file: {selected.file}
            {selected.line !== undefined ? `:${selected.line}` : ""}
          </Text>
          <Text>category: {selected.category}</Text>
          <Text>fix: {selected.fixHint}</Text>
        </Box>
      )}
    </Box>
  );
}
