import { Box, Text } from "ink";
import type { SyncStatus } from "../types/index";
import { statusColor, statusGlyph, statusLabel } from "./theme";

export function Footer({
  status,
  issues,
  width,
}: {
  status: SyncStatus;
  issues: number;
  width: number;
}) {
  const left = `${statusGlyph[status]} ${statusLabel[status]}   ·   ${issues} ${
    issues === 1 ? "issue" : "issues"
  }`;
  const right = "↑↓ navigate    1 2 3 tabs    q quit";
  const gap = Math.max(2, width - left.length - right.length);
  return (
    <Box>
      <Text>
        <Text color={statusColor[status]} bold>
          {statusGlyph[status]} {statusLabel[status]}
        </Text>
        <Text dimColor>{"   ·   "}</Text>
        <Text dimColor>
          {issues} {issues === 1 ? "issue" : "issues"}
        </Text>
        <Text>{" ".repeat(gap)}</Text>
        <Text dimColor>{right}</Text>
      </Text>
    </Box>
  );
}
