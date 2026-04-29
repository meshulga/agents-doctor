import { Box, Text } from "ink";

type Mode = "list" | "detail";

const HINTS: Record<Mode, string> = {
  list: "↑↓ navigate    enter detail    q quit",
  detail: "esc / ← / h back    q quit",
};

export function Footer({ mode, width }: { mode: Mode; width: number }) {
  const hint = HINTS[mode];
  const pad = Math.max(0, width - hint.length);
  return (
    <Box>
      <Text dimColor>
        {" ".repeat(pad)}
        {hint}
      </Text>
    </Box>
  );
}
