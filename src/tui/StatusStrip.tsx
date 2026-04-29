import { Box, Text } from "ink";
import type { DoctorState, Severity } from "../types/index";
import { useInnerWidth } from "./useInnerWidth";
import { sevColor, statusColor, statusGlyph, statusLabel } from "./theme";

export function StatusStrip({ state }: { state: DoctorState }) {
  const width = useInnerWidth();
  const counts: Record<Severity, number> = {
    error: state.issues.filter((i) => i.severity === "error").length,
    warning: state.issues.filter((i) => i.severity === "warning").length,
    suggestion: state.issues.filter((i) => i.severity === "suggestion").length,
  };
  const totalNodes =
    state.rules.length +
    state.skills.length +
    state.commands.length +
    state.mcpServers.length +
    state.overrides.length;

  const left = `${statusGlyph[state.syncStatus]} ${statusLabel[state.syncStatus]}`;
  const right = `${totalNodes} nodes`;
  const middleParts = [
    counts.error > 0 ? `● ${counts.error} ${counts.error === 1 ? "error" : "errors"}` : null,
    counts.warning > 0 ? `⚠ ${counts.warning} ${counts.warning === 1 ? "warning" : "warnings"}` : null,
    counts.suggestion > 0 ? `◆ ${counts.suggestion} ${counts.suggestion === 1 ? "hint" : "hints"}` : null,
  ].filter((s): s is string => s !== null);
  const middle =
    middleParts.length > 0 ? middleParts.join("   ") : "no issues";

  const sep = "   ·   ";
  const lengthsUsed =
    left.length + sep.length + middle.length + sep.length + right.length;
  const gap = Math.max(2, width - lengthsUsed);

  return (
    <Box>
      <Text>
        <Text color={statusColor[state.syncStatus]} bold>
          {left}
        </Text>
        <Text dimColor>{sep}</Text>
        {counts.error > 0 ? (
          <>
            <Text color={sevColor.error}>● {counts.error} </Text>
            <Text dimColor>
              {counts.error === 1 ? "error" : "errors"}
              {counts.warning + counts.suggestion > 0 ? "   " : ""}
            </Text>
          </>
        ) : null}
        {counts.warning > 0 ? (
          <>
            <Text color={sevColor.warning}>⚠ {counts.warning} </Text>
            <Text dimColor>
              {counts.warning === 1 ? "warning" : "warnings"}
              {counts.suggestion > 0 ? "   " : ""}
            </Text>
          </>
        ) : null}
        {counts.suggestion > 0 ? (
          <>
            <Text color={sevColor.suggestion}>◆ {counts.suggestion} </Text>
            <Text dimColor>
              {counts.suggestion === 1 ? "hint" : "hints"}
            </Text>
          </>
        ) : null}
        {middleParts.length === 0 ? <Text dimColor>{middle}</Text> : null}
        <Text>{" ".repeat(gap)}</Text>
        <Text dimColor>{right}</Text>
      </Text>
    </Box>
  );
}
