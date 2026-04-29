import { useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { DoctorState } from "../types/index";
import { MatrixTab } from "./MatrixTab";
import { TreeTab } from "./TreeTab";
import { HealthTab } from "./HealthTab";
import { Footer } from "./Footer";

type TabId = "matrix" | "tree" | "health";

const TABS: Array<[TabId, string]> = [
  ["matrix", "Matrix"],
  ["tree", "Tree"],
  ["health", "Health"],
];

export function App({ state }: { state: DoctorState }) {
  const [tab, setTab] = useState<TabId>("matrix");
  const { exit } = useApp();

  useInput((input) => {
    if (input === "1") setTab("matrix");
    else if (input === "2") setTab("tree");
    else if (input === "3") setTab("health");
    else if (input === "q") exit();
  });

  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        {TABS.map(([id, label], i) => {
          const active = tab === id;
          return (
            <Box key={id} marginRight={2}>
              <Text color={active ? "cyan" : "gray"} bold={active}>
                [{i + 1}] {label}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        {tab === "matrix" && <MatrixTab state={state} />}
        {tab === "tree" && <TreeTab state={state} />}
        {tab === "health" && <HealthTab state={state} />}
      </Box>
      <Footer status={state.syncStatus} />
    </Box>
  );
}
