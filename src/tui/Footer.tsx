import { Box, Text } from "ink";
import type { SyncStatus } from "../types/index";

const statusColor: Record<SyncStatus, "green" | "red" | "yellow"> = {
  "in-sync": "green",
  drifted: "red",
  unsynced: "yellow",
};

const statusGlyph: Record<SyncStatus, string> = {
  "in-sync": "✓",
  drifted: "!",
  unsynced: "~",
};

export function Footer({ status }: { status: SyncStatus }) {
  return (
    <Box paddingX={1}>
      <Text color={statusColor[status]} bold>
        {statusGlyph[status]} {status}
      </Text>
      <Text dimColor>{"   "}↑↓ select · 1/2/3 tabs · q quit</Text>
    </Box>
  );
}
