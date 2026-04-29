import { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState, HealthIssue } from "../types/index";
import { SectionHeader } from "./SectionHeader";
import { accent, sevColor, sevOrder, sevSection, truncate } from "./theme";

const SPINE_W = 2;
const DOT_W = 3;
const RULEID_W = 32;

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
    else if (key.downArrow)
      setIdx((i) => Math.min(sorted.length - 1, i + 1));
  });

  return (
    <Box flexDirection="column">
      {sevOrder.map((sev) => {
        const items = sorted
          .map((issue, i) => ({ issue, i }))
          .filter(({ issue }) => issue.severity === sev);
        if (items.length === 0) return null;
        return (
          <Box key={sev} flexDirection="column" marginBottom={1}>
            <SectionHeader title={sevSection[sev]} count={items.length} />
            <Box height={1} />
            {items.map(({ issue, i }) => (
              <IssueRow
                key={issue.id}
                issue={issue}
                selected={idx === i}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

function IssueRow({
  issue,
  selected,
}: {
  issue: HealthIssue;
  selected: boolean;
}) {
  const messageMax = 40;
  return (
    <Box flexDirection="column">
      <Box>
        <Text>
          <Text color={accent}>{selected ? "▌ " : "  "}</Text>
          <Text color={sevColor[issue.severity]}>● </Text>
          <Text bold={selected}>
            {truncate(issue.ruleId, RULEID_W - 2).padEnd(RULEID_W)}
          </Text>
          <Text dimColor>{truncate(issue.message, messageMax)}</Text>
        </Text>
      </Box>
      {selected && (
        <Box
          flexDirection="column"
          marginLeft={SPINE_W + DOT_W}
          marginTop={1}
          marginBottom={1}
        >
          <Box>
            <Text dimColor bold>
              {issue.category.toUpperCase()}
            </Text>
            <Text dimColor>{"  ·  "}</Text>
            <Text dimColor>
              {issue.file}
              {issue.line !== undefined ? `:${issue.line}` : ""}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text>{issue.message}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={accent}>{"→ "}</Text>
            <Text>{issue.fixHint}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
