import type {
  AgentTarget,
  DoctorState,
  HealthIssue,
  MatrixCell,
  RulePriority,
} from "../types/index";

export type NodeKind = "rule" | "skill" | "command" | "mcp" | "override";

export type Node = {
  id: string;
  kind: NodeKind;
  name: string;
  source: string;
  body: string;
  agents: AgentTarget[];
  priority: RulePriority | null;
  globs: string[];
  cells: MatrixCell[];
  issues: HealthIssue[];
};

export type Section =
  | { kind: NodeKind; title: string; nodes: Node[] }
  | { kind: "global"; title: string; issues: HealthIssue[] };

export type Selectable =
  | { type: "node"; data: Node }
  | { type: "issue"; data: HealthIssue };

const KIND_ORDER: NodeKind[] = [
  "rule",
  "skill",
  "command",
  "mcp",
  "override",
];

const KIND_TITLE: Record<NodeKind, string> = {
  rule: "RULES",
  skill: "SKILLS",
  command: "COMMANDS",
  mcp: "MCP SERVERS",
  override: "OVERRIDES",
};

function normalizeFilePath(path: string): string {
  return path
    .replace(/^\.?\/+/, "")
    .replace(/^\.agents-doctor\//, "");
}

function attachIssues(
  source: string,
  issues: HealthIssue[],
): HealthIssue[] {
  return issues.filter((i) => normalizeFilePath(i.file) === source);
}

function buildNodes(state: DoctorState): Node[] {
  const ruleNodes: Node[] = state.rules.map((r) => ({
    id: `rule:${r.id}`,
    kind: "rule",
    name: r.name,
    source: r.source,
    body: r.body,
    agents: r.frontmatter.agents,
    priority: r.frontmatter.priority ?? null,
    globs: r.frontmatter.globs ?? [],
    cells: state.matrix.filter((c) => c.ruleId === r.id),
    issues: attachIssues(r.source, state.issues),
  }));

  const skillNodes: Node[] = state.skills.map((s) => ({
    id: `skill:${s.id}`,
    kind: "skill",
    name: s.name,
    source: s.source,
    body: s.description,
    agents: s.agents,
    priority: null,
    globs: [],
    cells: [],
    issues: attachIssues(s.source, state.issues),
  }));

  const commandNodes: Node[] = state.commands.map((c) => ({
    id: `command:${c.id}`,
    kind: "command",
    name: c.name,
    source: c.source,
    body: c.body,
    agents: c.agents,
    priority: null,
    globs: [],
    cells: [],
    issues: attachIssues(c.source, state.issues),
  }));

  const mcpNodes: Node[] = state.mcpServers.map((m) => ({
    id: `mcp:${m.id}`,
    kind: "mcp",
    name: m.name,
    source: m.source,
    body: JSON.stringify(m.config, null, 2),
    agents: m.agents,
    priority: null,
    globs: [],
    cells: [],
    issues: attachIssues(m.source, state.issues),
  }));

  const overrideNodes: Node[] = state.overrides.map((o) => ({
    id: `override:${o.source}`,
    kind: "override",
    name: o.source,
    source: o.source,
    body: o.body,
    agents: [o.agent],
    priority: null,
    globs: [],
    cells: [],
    issues: attachIssues(o.source, state.issues),
  }));

  return [
    ...ruleNodes,
    ...skillNodes,
    ...commandNodes,
    ...mcpNodes,
    ...overrideNodes,
  ];
}

export function buildSections(state: DoctorState): Section[] {
  const nodes = buildNodes(state);
  const attachedIssueIds = new Set(
    nodes.flatMap((n) => n.issues.map((i) => i.id)),
  );
  const globalIssues = state.issues.filter(
    (i) => !attachedIssueIds.has(i.id),
  );

  const entitySections: Section[] = KIND_ORDER.map((kind) => ({
    kind,
    title: KIND_TITLE[kind],
    nodes: nodes.filter((n) => n.kind === kind),
  }));

  if (globalIssues.length > 0) {
    return [
      ...entitySections,
      { kind: "global", title: "GLOBAL", issues: globalIssues },
    ];
  }
  return entitySections;
}

export function flattenSelectables(sections: Section[]): Selectable[] {
  const out: Selectable[] = [];
  for (const section of sections) {
    if (section.kind === "global") {
      for (const issue of section.issues) {
        out.push({ type: "issue", data: issue });
      }
    } else {
      for (const node of section.nodes) {
        out.push({ type: "node", data: node });
      }
    }
  }
  return out;
}

export function maxSeverity(
  issues: HealthIssue[],
): "error" | "warning" | "suggestion" | null {
  if (issues.some((i) => i.severity === "error")) return "error";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  if (issues.some((i) => i.severity === "suggestion")) return "suggestion";
  return null;
}
