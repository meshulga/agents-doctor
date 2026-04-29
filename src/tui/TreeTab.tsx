import { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { DoctorState } from "../types/index";
import { SectionHeader } from "./SectionHeader";
import { accent, scopeLabel, truncate } from "./theme";

const NAME_W = 32;

type ItemKind = "rule" | "skill" | "command" | "mcp" | "override";

type Item = { label: string; detail: string };

type Section = { kind: ItemKind; title: string; items: Item[] };

function buildSections(state: DoctorState): Section[] {
  return [
    {
      kind: "rule",
      title: "RULES",
      items: state.rules.map((r) => ({
        label: r.name,
        detail: [
          scopeLabel(r.frontmatter.agents),
          r.frontmatter.priority ?? "normal",
          r.frontmatter.globs && r.frontmatter.globs.length > 0
            ? `${r.frontmatter.globs.length} globs`
            : null,
        ]
          .filter(Boolean)
          .join("  ·  "),
      })),
    },
    {
      kind: "skill",
      title: "SKILLS",
      items: state.skills.map((s) => ({
        label: s.name,
        detail: `${scopeLabel(s.agents)}  ·  ${s.description}`,
      })),
    },
    {
      kind: "command",
      title: "COMMANDS",
      items: state.commands.map((c) => ({
        label: c.name,
        detail: scopeLabel(c.agents),
      })),
    },
    {
      kind: "mcp",
      title: "MCP SERVERS",
      items: state.mcpServers.map((m) => ({
        label: m.name,
        detail: scopeLabel(m.agents),
      })),
    },
    {
      kind: "override",
      title: "OVERRIDES",
      items: state.overrides.map((o) => ({
        label: o.source,
        detail: o.agent,
      })),
    },
  ];
}

export function TreeTab({ state }: { state: DoctorState }) {
  const sections = useMemo(() => buildSections(state), [state]);
  const totalItems = useMemo(
    () => sections.reduce((acc, s) => acc + s.items.length, 0),
    [sections],
  );
  const [idx, setIdx] = useState(0);

  useInput((_input, key) => {
    if (key.upArrow) setIdx((i) => Math.max(0, i - 1));
    else if (key.downArrow) setIdx((i) => Math.min(totalItems - 1, i + 1));
  });

  let cursor = 0;

  return (
    <Box flexDirection="column">
      {sections.map((section) => {
        const sectionStart = cursor;
        cursor += section.items.length;
        if (section.items.length === 0) return null;
        return (
          <Box key={section.kind} flexDirection="column" marginBottom={1}>
            <SectionHeader title={section.title} count={section.items.length} />
            <Box height={1} />
            {section.items.map((item, i) => {
              const sel = idx === sectionStart + i;
              return (
                <Box key={`${section.kind}-${i}`}>
                  <Text>
                    <Text color={accent}>{sel ? "▌ " : "  "}</Text>
                    <Text bold={sel}>
                      {truncate(item.label, NAME_W - 2).padEnd(NAME_W)}
                    </Text>
                    <Text dimColor>{item.detail}</Text>
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
