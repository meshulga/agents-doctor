import { Fragment, useMemo } from "react";
import { Box, Text } from "ink";
import type { AgentId, DoctorState, MatrixCellState } from "../types/index";
import { SectionHeader } from "./SectionHeader";
import { useInnerWidth } from "./useInnerWidth";
import {
  accent,
  cellColor,
  cellGlyph,
  priorityColor,
  priorityLabel,
  scopeLabel,
  sevColor,
  truncate,
} from "./theme";
import {
  buildSections,
  flattenSelectables,
  maxSeverity,
  type Node,
  type Selectable,
} from "./nodes";

const SPINE_W = 2;
const ISS_W = 3;
const AGENT_W = 8;
const META_W = 14;
const MIN_NAME_W = 20;

type Props = {
  state: DoctorState;
  selectedIdx: number;
};

export function ListView({ state, selectedIdx }: Props) {
  const sections = useMemo(() => buildSections(state), [state]);
  const flat = useMemo(() => flattenSelectables(sections), [sections]);
  const inner = useInnerWidth();
  const fixedCols =
    SPINE_W + ISS_W + AGENT_W * state.agents.length + META_W;
  const nameW = Math.max(MIN_NAME_W, inner - fixedCols);

  let cursor = 0;

  return (
    <Box flexDirection="column">
      <Box>
        <Text dimColor bold>
          {" ".repeat(SPINE_W + ISS_W)}
          {"NAME".padEnd(nameW)}
          {state.agents
            .map((a) => a.toUpperCase().padEnd(AGENT_W))
            .join("")}
          {"META".padEnd(META_W)}
        </Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor>{"─".repeat(inner)}</Text>
      </Box>

      {sections.map((section) => {
        const itemCount =
          section.kind === "global"
            ? section.issues.length
            : section.nodes.length;
        if (itemCount === 0) return null;

        const sectionStart = cursor;
        cursor += itemCount;

        return (
          <Box key={section.kind} flexDirection="column" marginBottom={1}>
            <SectionHeader title={section.title} count={itemCount} />
            <Box height={1} />
            {section.kind === "global"
              ? section.issues.map((issue, i) => {
                  const sel = sectionStart + i === selectedIdx;
                  return (
                    <GlobalIssueRow
                      key={issue.id}
                      message={issue.message}
                      ruleId={issue.ruleId}
                      severity={issue.severity}
                      selected={sel}
                      nameW={nameW}
                      agentCols={state.agents.length}
                    />
                  );
                })
              : section.nodes.map((node, i) => {
                  const sel = sectionStart + i === selectedIdx;
                  return (
                    <NodeRow
                      key={node.id}
                      node={node}
                      agents={state.agents}
                      selected={sel}
                      nameW={nameW}
                    />
                  );
                })}
          </Box>
        );
      })}

      {flat.length > 0 && <DetailPanel item={flat[selectedIdx]!} state={state} />}
    </Box>
  );
}

function NodeRow({
  node,
  agents,
  selected,
  nameW,
}: {
  node: Node;
  agents: AgentId[];
  selected: boolean;
  nameW: number;
}) {
  const sev = maxSeverity(node.issues);
  const issueGlyph = sev ? "●" : "—";
  const issueColor = sev ? sevColor[sev] : "gray";
  const meta =
    node.kind === "rule" && node.priority
      ? priorityLabel[node.priority]
      : node.kind === "rule"
      ? "NORM"
      : node.kind === "override"
      ? agents.find((a) => node.agents.includes(a))?.toUpperCase() ?? ""
      : scopeLabel(node.agents).toUpperCase();
  const metaColor =
    node.kind === "rule" && node.priority
      ? priorityColor[node.priority]
      : "gray";

  return (
    <Box>
      <Text>
        <Text color={accent}>{selected ? "▌ " : "  "}</Text>
        <Text color={issueColor}>{issueGlyph} </Text>
        <Text bold={selected}>
          {truncate(node.name, nameW - 2).padEnd(nameW)}
        </Text>
        {agents.map((a) => {
          if (node.kind === "rule") {
            const cell = node.cells.find((c) => c.agent === a);
            const cs: MatrixCellState = cell?.state ?? "absent";
            return (
              <Text key={a} color={cellColor[cs]}>
                {cellGlyph[cs].padEnd(AGENT_W)}
              </Text>
            );
          }
          const isTargeted =
            node.agents.includes("*") || node.agents.includes(a);
          return (
            <Text key={a} color={isTargeted ? "green" : "gray"}>
              {(isTargeted ? "✓" : "·").padEnd(AGENT_W)}
            </Text>
          );
        })}
        <Text color={metaColor}>{meta.padEnd(META_W)}</Text>
      </Text>
    </Box>
  );
}

function GlobalIssueRow({
  message,
  ruleId,
  severity,
  selected,
  nameW,
  agentCols,
}: {
  message: string;
  ruleId: string;
  severity: "error" | "warning" | "suggestion";
  selected: boolean;
  nameW: number;
  agentCols: number;
}) {
  return (
    <Box>
      <Text>
        <Text color={accent}>{selected ? "▌ " : "  "}</Text>
        <Text color={sevColor[severity]}>● </Text>
        <Text bold={selected}>{truncate(ruleId, nameW - 2).padEnd(nameW)}</Text>
        <Text dimColor>
          {truncate(message, AGENT_W * agentCols + META_W - 2)}
        </Text>
      </Text>
    </Box>
  );
}

function DetailPanel({
  item,
  state,
}: {
  item: Selectable;
  state: DoctorState;
}) {
  const inner = useInnerWidth();
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{"─".repeat(inner)}</Text>
      <Box height={1} />
      {item.type === "node" ? (
        <NodeSummary node={item.data} agents={state.agents} />
      ) : (
        <IssueSummary
          ruleId={item.data.ruleId}
          severity={item.data.severity}
          message={item.data.message}
          file={item.data.file}
          line={item.data.line}
          fixHint={item.data.fixHint}
          category={item.data.category}
        />
      )}
    </Box>
  );
}

function NodeSummary({ node, agents }: { node: Node; agents: AgentId[] }) {
  const lines: Array<[string, string]> = [
    ["SOURCE", node.source],
    ["AGENTS", scopeLabel(node.agents)],
  ];
  if (node.priority) lines.push(["PRIORITY", node.priority.toUpperCase()]);
  if (node.globs.length > 0) lines.push(["GLOBS", node.globs.join(", ")]);
  return (
    <Box flexDirection="column">
      <Box>
        <Text>{node.body}</Text>
      </Box>
      <Box height={1} />
      {lines.map(([label, value]) => (
        <Box key={label}>
          <Text dimColor bold>{label.padEnd(11)}</Text>
          <Text>{value}</Text>
        </Box>
      ))}
      {node.issues.length > 0 && (
        <Fragment>
          <Box height={1} />
          <Box>
            <Text dimColor bold>{"ISSUES".padEnd(11)}</Text>
            <Text dimColor>
              {node.issues.length} {node.issues.length === 1 ? "issue" : "issues"} (press enter for details)
            </Text>
          </Box>
        </Fragment>
      )}
    </Box>
  );
}

function IssueSummary({
  ruleId,
  severity,
  message,
  file,
  line,
  fixHint,
  category,
}: {
  ruleId: string;
  severity: "error" | "warning" | "suggestion";
  message: string;
  file: string;
  line?: number;
  fixHint: string;
  category: string;
}) {
  return (
    <Box flexDirection="column">
      <Box>
        <Text color={sevColor[severity]} bold>
          {ruleId}
        </Text>
        <Text dimColor>{"   ·   "}</Text>
        <Text dimColor bold>{category.toUpperCase()}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>{message}</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor bold>{"FILE".padEnd(11)}</Text>
        <Text dimColor>
          {file}
          {line !== undefined ? `:${line}` : ""}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={accent}>{"→ "}</Text>
        <Text>{fixHint}</Text>
      </Box>
    </Box>
  );
}
