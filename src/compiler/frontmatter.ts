import yaml from "js-yaml";

export function whitelist(
  data: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

export function serializeMarkdown(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const yamlText = Object.keys(frontmatter).length
    ? yaml.dump(frontmatter, { lineWidth: -1 })
    : "";
  const fmBlock = yamlText ? `---\n${yamlText}---\n` : "";
  return fmBlock + body;
}
