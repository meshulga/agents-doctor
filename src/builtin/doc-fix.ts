// Frontmatter that will be written verbatim (plus the standard
// generated_by field appended by the compiler).
export const DOC_FIX_FRONTMATTER = {
  description: "Resolve agents-doc lint and drift items by editing the SOT",
  "argument-hint": "(no args)",
} as const;

export const DOC_FIX_BODY = `# /doc-fix

You are working on a project that uses \`agents-doc\` to keep \`CLAUDE.md\`
and \`AGENTS.md\` in sync from a single source of truth at \`.agents-doc/\`.
The tool has just run \`agents-doc doctor\` and produced a list of judgment
items at \`.agents-doc/todo.md\` that mechanical analysis cannot resolve.
Your job is to work through that list.

## Workflow

1. Read \`.agents-doc/todo.md\` end-to-end. Each item names the rule file,
   line, and a one-line message.
2. For each unchecked item, open the named rule under \`.agents-doc/rules/\`
   and edit the SOT — never the generated \`CLAUDE.md\` / \`AGENTS.md\`
   files. Direct edits to generated files are flagged as drift on the next
   \`check\`.
3. After resolving an item, mark its checkbox \`[x]\` in \`todo.md\` so
   subsequent runs of \`/doc-fix\` skip it.
4. When you have processed every item (or paused on one you cannot resolve
   without the user), run:

   \`\`\`
   agents-doc sync
   agents-doc check
   agents-doc doctor
   \`\`\`

5. Report the diff between the original \`todo.md\` count and what
   remains, plus any open questions for the user.

## Rules of engagement

- **Do not delete a rule** without explaining why and getting user
  confirmation first.
- **Do not auto-resolve contradictions** in either direction — surface
  the conflict to the user with the two competing rule excerpts.
- **Vague phrasing** items: replace with a concrete value when one is
  obvious from project context (\`package.json\`, existing rules).
  Otherwise, leave the item unchecked and note what context you would
  need.
- **Over-broad globs**: propose a narrower glob inferred from the rule's
  topic and the project's directory structure. If you cannot infer one,
  leave the item unchecked.
- **Instruction-count blowouts**: split the rule into focused
  sub-rules, one per topic. Use new filenames in the same path; do not
  silently delete content.
- **Drift items** (if doctor reported any): never edit the generated
  files. Run \`agents-doc sync\` to regenerate them, then re-run
  \`agents-doc check\`. If sync would lose user changes, stop and ask.

## End of run

Print a short summary: how many items were resolved, how many remain,
and any user decisions needed.
`;
