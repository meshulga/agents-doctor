import { Box, Text } from "ink";
import { useInnerWidth } from "./useInnerWidth";

export function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  const width = useInnerWidth();
  const right = count === undefined ? "" : String(count);
  const padding = 2;
  const dashes = Math.max(
    2,
    width - title.length - right.length - padding * 2,
  );
  return (
    <Box>
      <Text dimColor bold>
        {title}
      </Text>
      <Text dimColor>
        {"  "}
        {"─".repeat(dashes)}
        {right ? `  ${right}` : ""}
      </Text>
    </Box>
  );
}

export function HRule() {
  const width = useInnerWidth();
  return <Text dimColor>{"─".repeat(width)}</Text>;
}
