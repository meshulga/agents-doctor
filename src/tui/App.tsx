import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { DoctorState } from "../types/index";
import { Footer } from "./Footer";
import { HealthTab } from "./HealthTab";
import { HRule } from "./SectionHeader";
import { MatrixTab } from "./MatrixTab";
import { TreeTab } from "./TreeTab";
import { OUTER_PAD, useInnerWidth } from "./useInnerWidth";
import { accent } from "./theme";

type TabId = "matrix" | "tree" | "health";

const TABS: Array<[TabId, string]> = [
  ["matrix", "MATRIX"],
  ["tree", "TREE"],
  ["health", "HEALTH"],
];

const WORDMARK_LEFT = "AGENTS · DOCTOR";

export function App({ state }: { state: DoctorState }) {
  const [tab, setTab] = useState<TabId>("matrix");
  const { exit } = useApp();
  const inner = useInnerWidth();

  useInput((input) => {
    if (input === "1") setTab("matrix");
    else if (input === "2") setTab("tree");
    else if (input === "3") setTab("health");
    else if (input === "q") exit();
  });

  const agentsRight = state.agents.map((a) => a.toUpperCase()).join("  ·  ");
  const headerGap = Math.max(2, inner - WORDMARK_LEFT.length - agentsRight.length);

  return (
    <Box
      flexDirection="column"
      paddingX={OUTER_PAD}
      paddingY={1}
      width={inner + OUTER_PAD * 2}
    >
      <Box>
        <Text>
          <Text bold color={accent}>{"AGENTS"}</Text>
          <Text dimColor>{" · "}</Text>
          <Text bold color={accent}>{"DOCTOR"}</Text>
          <Text>{" ".repeat(headerGap)}</Text>
          <Text dimColor bold>{agentsRight}</Text>
        </Text>
      </Box>

      <HRule />

      <Box marginTop={1} marginBottom={2}>
        {TABS.map(([id, label], i) => {
          const active = tab === id;
          const content = `  ${i + 1}  ${label}  `;
          return (
            <Box key={id} marginRight={1}>
              {active ? (
                <Text color="black" backgroundColor={accent} bold>
                  {content}
                </Text>
              ) : (
                <Text dimColor>{content}</Text>
              )}
            </Box>
          );
        })}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        {tab === "matrix" && <MatrixTab state={state} />}
        {tab === "tree" && <TreeTab state={state} />}
        {tab === "health" && <HealthTab state={state} />}
      </Box>

      <HRule />
      <Box marginTop={1}>
        <Footer
          status={state.syncStatus}
          issues={state.issues.length}
          width={inner}
        />
      </Box>
    </Box>
  );
}
