import pc from "picocolors";
import logSymbols from "log-symbols";
import { diffLines } from "diff";

// Centralizing visual concerns here keeps the rest of the CLI plain and makes
// swapping the underlying libraries (or stripping color in CI) a one-file
// change.

export const ui = {
  ok: (msg: string) => `${logSymbols.success} ${pc.green(msg)}`,
  fail: (msg: string) => `${logSymbols.error} ${pc.red(msg)}`,
  warn: (msg: string) => `${logSymbols.warning} ${pc.yellow(msg)}`,
  info: (msg: string) => `${logSymbols.info} ${pc.cyan(msg)}`,
  bold: (msg: string) => pc.bold(msg),
  dim: (msg: string) => pc.dim(msg),
  red: (msg: string) => pc.red(msg),
  green: (msg: string) => pc.green(msg),
  yellow: (msg: string) => pc.yellow(msg),
};

// ────────────────────────────────────────────────────────────
// Tree + icons
// ────────────────────────────────────────────────────────────

const FOLDER_ICONS: Record<string, string> = {
  ".agents-doc": "🗂",
  ".claude": "🟧",
  rules: "📋",
  skills: "🛠️ ",
  commands: "💬",
};

function iconForFolder(name: string): string {
  return FOLDER_ICONS[name] ?? "📁";
}

function iconForFile(path: string): string {
  const base = path.split("/").at(-1) ?? path;
  if (base === "CLAUDE.md") return "🟠";
  if (base === "AGENTS.md") return "🔵";
  if (base === "SKILL.md") return "🛠️ ";
  if (base.endsWith(".yaml") || base.endsWith(".yml")) return "⚙️ ";
  if (base.endsWith(".sh") || base.endsWith(".bash")) return "🐚";
  if (path.includes("/rules/") && base.endsWith(".md")) return "📋";
  if (path.includes("/commands/") && base.endsWith(".md")) return "💬";
  if (base.endsWith(".md")) return "📝";
  return "📄";
}

interface TreeNode {
  name: string; // segment name for display
  path: string; // full path from root for icon lookup
  isDir: boolean;
  children: Map<string, TreeNode>;
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isDir: true, children: new Map() };
  for (const p of paths) {
    const parts = p.split("/").filter(Boolean);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i]!;
      const isLast = i === parts.length - 1;
      const childPath = parts.slice(0, i + 1).join("/");
      let child = node.children.get(seg);
      if (!child) {
        child = {
          name: seg,
          path: childPath,
          isDir: !isLast,
          children: new Map(),
        };
        node.children.set(seg, child);
      }
      node = child;
    }
  }
  return root;
}

/**
 * Render a flat list of project-relative paths as a tree with icons. Uses
 * box-drawing characters (├── │ └──) for branches and emoji for file/folder
 * type so it stays portable across terminals without Nerd Fonts.
 */
export function renderTree(paths: string[], indent = "  "): string {
  if (paths.length === 0) return "";
  const root = buildTree(paths);
  const lines: string[] = [];
  renderNode(root, indent, "", true, lines, /*isRoot=*/ true);
  return lines.join("\n");
}

function renderNode(
  node: TreeNode,
  indent: string,
  prefix: string,
  isLast: boolean,
  out: string[],
  isRoot: boolean,
): void {
  if (!isRoot) {
    const branch = isLast ? "└── " : "├── ";
    const icon = node.isDir ? iconForFolder(node.name) : iconForFile(node.path);
    const label = node.isDir ? `${node.name}/` : node.name;
    out.push(`${indent}${prefix}${pc.dim(branch)}${icon} ${label}`);
  }
  const children = [...node.children.values()].sort(byNameDirsFirst);
  const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
  for (let i = 0; i < children.length; i++) {
    renderNode(children[i]!, indent, childPrefix, i === children.length - 1, out, false);
  }
}

function byNameDirsFirst(a: TreeNode, b: TreeNode): number {
  if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
  return a.name.localeCompare(b.name);
}

/**
 * Render a unified-style diff with red `-` for expected (what sync would
 * write) and green `+` for actual (what's on disk). Lines that match are
 * shown dim with a leading space. Returns the formatted string ready to
 * print; never throws — falls back to "(binary)" if either side has NULs.
 */
export function renderDiff(expected: Buffer, actual: Buffer): string {
  if (expected.includes(0) || actual.includes(0)) return ui.dim("  (binary differs)");
  const a = expected.toString("utf8");
  const b = actual.toString("utf8");
  const out: string[] = [];
  for (const part of diffLines(a, b)) {
    const lines = part.value.replace(/\n$/, "").split("\n");
    for (const line of lines) {
      if (part.added) out.push(pc.green(`+ ${line}`));
      else if (part.removed) out.push(pc.red(`- ${line}`));
      else out.push(pc.dim(`  ${line}`));
    }
  }
  return out.join("\n");
}
