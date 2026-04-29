import { useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { DoctorState } from "../types/index";
import { DetailView } from "./DetailView";
import { Footer } from "./Footer";
import { ListView } from "./ListView";
import { StatusStrip } from "./StatusStrip";
import { OUTER_PAD, useInnerWidth } from "./useInnerWidth";
import { accent } from "./theme";
import { buildSections, flattenSelectables } from "./nodes";

type Mode = "list" | "detail";

export function App({ state }: { state: DoctorState }) {
  const sections = useMemo(() => buildSections(state), [state]);
  const flat = useMemo(() => flattenSelectables(sections), [sections]);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("list");
  const { exit } = useApp();
  const inner = useInnerWidth();

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }
    if (mode === "list") {
      if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
      else if (key.downArrow)
        setIdx((i) => Math.min(flat.length - 1, i + 1));
      else if (key.return) setMode("detail");
    } else if (mode === "detail") {
      if (key.escape || key.leftArrow || input === "h") setMode("list");
    }
  });

  const agentsRight = state.agents.map((a) => a.toUpperCase()).join("  ·  ");
  const wordmarkLeft = "AGENTS · DOCTOR";
  const headerGap = Math.max(
    2,
    inner - wordmarkLeft.length - agentsRight.length,
  );

  return (
    <Box
      flexDirection="column"
      paddingX={OUTER_PAD}
      paddingY={1}
      width={inner + OUTER_PAD * 2}
    >
      <Box>
        <Text>
          <Text bold color={accent}>
            AGENTS
          </Text>
          <Text dimColor>{" · "}</Text>
          <Text bold color={accent}>
            DOCTOR
          </Text>
          <Text>{" ".repeat(headerGap)}</Text>
          <Text dimColor bold>
            {agentsRight}
          </Text>
        </Text>
      </Box>
      <Box>
        <Text dimColor>{"─".repeat(inner)}</Text>
      </Box>
      <StatusStrip state={state} />
      <Box marginBottom={2}>
        <Text dimColor>{"─".repeat(inner)}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        {mode === "list" ? (
          <ListView state={state} selectedIdx={idx} />
        ) : flat[idx] ? (
          <DetailView item={flat[idx]!} state={state} />
        ) : null}
      </Box>

      <Box>
        <Text dimColor>{"─".repeat(inner)}</Text>
      </Box>
      <Box marginTop={1} width={inner}>
        <Footer mode={mode} width={inner} />
      </Box>
    </Box>
  );
}
