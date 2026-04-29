import { Box, Text } from "ink";
import type {
  AgentId,
  DoctorState,
  HealthIssue,
  MatrixCellState,
} from "../types/index";
import { useInnerWidth } from "./useInnerWidth";
import {
  accent,
  cellColor,
  cellGlyph,
  cellLabel,
  priorityLabel,
  scopeLabel,
  sevColor,
  sevSection,
} from "./theme";
import type { Node, Selectable } from "./nodes";

const KIND_BREADCRUMB: Record<string, string> = {
  rule: "rules",
  skill: "skills",
  command: "commands",
  mcp: "mcp",
  override: "overrides",
};

export function DetailView({
  item,
  state,
}: {
  item: Selectable;
  state: DoctorState;
}) {
  const inner = useInnerWidth();
  return (
    <Box flexDirection="column">
      <Box>
        {item.type === "node" ? (
          <Text>
            <Text dimColor>{`[ ${KIND_BREADCRUMB[item.data.kind]} ]   `}</Text>
            <Text bold color={accent}>
              {item.data.name}
            </Text>
          </Text>
        ) : (
          <Text>
            <Text dimColor>{"[ global ]   "}</Text>
            <Text bold color={sevColor[item.data.severity]}>
              {item.data.ruleId}
            </Text>
          </Text>
        )}
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>{"─".repeat(inner)}</Text>
      </Box>
      {item.type === "node" ? (
        <NodeDetail node={item.data} agents={state.agents} />
      ) : (
        <IssueDetail issue={item.data} />
      )}
    </Box>
  );
}

function NodeDetail({ node, agents }: { node: Node; agents: AgentId[] }) {
  return (
    <Box flexDirection="column">
      <Section title="ABOUT">
        <Text>{node.body}</Text>
      </Section>

      <Section title="FRONTMATTER">
        <KV label="agents" value={scopeLabel(node.agents)} />
        {node.priority && (
          <KV label="priority" value={node.priority.toUpperCase()} />
        )}
        {node.globs.length > 0 && (
          <KV label="globs" value={node.globs.join(", ")} />
        )}
      </Section>

      {node.kind === "rule" && (
        <Section title="COVERAGE">
          {agents.map((a) => {
            const cell = node.cells.find((c) => c.agent === a);
            const cs: MatrixCellState = cell?.state ?? "absent";
            return (
              <Box key={a}>
                <Text dimColor bold>
                  {a.toUpperCase().padEnd(11)}
                </Text>
                <Text color={cellColor[cs]}>
                  {cellGlyph[cs]} {cellLabel[cs]}
                </Text>
                {cell?.generatedPath && (
                  <Text dimColor>{`   →   ${cell.generatedPath}`}</Text>
                )}
              </Box>
            );
          })}
        </Section>
      )}

      <Section title="SOURCE">
        <Text dimColor>{node.source}</Text>
      </Section>

      <Section
        title={`ISSUES${node.issues.length > 0 ? ` (${node.issues.length})` : ""}`}
      >
        {node.issues.length === 0 ? (
          <Text dimColor>(none)</Text>
        ) : (
          node.issues.map((issue, i) => (
            <Box key={issue.id} flexDirection="column" marginBottom={i === node.issues.length - 1 ? 0 : 1}>
              <Box>
                <Text color={sevColor[issue.severity]}>● </Text>
                <Text bold>{issue.ruleId}</Text>
                <Text dimColor>{"   ·   "}</Text>
                <Text dimColor>{issue.category}</Text>
              </Box>
              <Box marginLeft={2}>
                <Text>{issue.message}</Text>
              </Box>
              {issue.line !== undefined && (
                <Box marginLeft={2}>
                  <Text dimColor>
                    {issue.file}:{issue.line}
                  </Text>
                </Box>
              )}
              <Box marginLeft={2}>
                <Text color={accent}>→ </Text>
                <Text>{issue.fixHint}</Text>
              </Box>
            </Box>
          ))
        )}
      </Section>
    </Box>
  );
}

function IssueDetail({ issue }: { issue: HealthIssue }) {
  return (
    <Box flexDirection="column">
      <Section title={sevSection[issue.severity]}>
        <Text>{issue.message}</Text>
      </Section>
      <Section title="LOCATION">
        <Text dimColor>
          {issue.file}
          {issue.line !== undefined ? `:${issue.line}` : ""}
        </Text>
      </Section>
      <Section title="CATEGORY">
        <Text>{issue.category}</Text>
      </Section>
      <Section title="FIX">
        <Box>
          <Text color={accent}>→ </Text>
          <Text>{issue.fixHint}</Text>
        </Box>
      </Section>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text dimColor bold>
          {title}
        </Text>
      </Box>
      <Box flexDirection="column" marginLeft={2} marginTop={0}>
        {children}
      </Box>
    </Box>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text dimColor>{label.padEnd(11)}</Text>
      <Text>{value}</Text>
    </Box>
  );
}
