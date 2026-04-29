export interface Chunk {
  heading: string | null;   // null for pre-h2 intro chunk
  body: string;             // includes the heading line itself when heading != null
}

export function splitByH2(input: string): Chunk[] {
  const lines = input.split("\n");
  // re-attach trailing newline behavior: if input ended with "\n", the last split element is "".
  const hadTrailingNewline = input.endsWith("\n");

  const chunks: Chunk[] = [];
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] };
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (/^```/.test(line)) {
      inFence = !inFence;
    }

    const h2 = !inFence ? /^##\s+(.+?)\s*$/.exec(line) : null;
    if (h2) {
      // flush current chunk if it has any content (or a non-null heading)
      if (current.lines.length > 0 || current.heading !== null) {
        chunks.push(materialize(current, hadTrailingNewline, /*isLast=*/ false));
      }
      current = { heading: h2[1] ?? "", lines: [line] };
    } else {
      // Skip a single trailing empty string produced by the final "\n" so we don't add an extra blank line.
      const isFinalSplitArtifact = i === lines.length - 1 && line === "" && hadTrailingNewline;
      if (!isFinalSplitArtifact) {
        current.lines.push(line);
      }
    }
  }

  if (current.lines.length > 0 || current.heading !== null) {
    chunks.push(materialize(current, hadTrailingNewline, /*isLast=*/ true));
  }

  // Drop an empty intro chunk (heading=null, body="")
  return chunks.filter((c) => !(c.heading === null && c.body === ""));
}

function materialize(
  cur: { heading: string | null; lines: string[] },
  hadTrailingNewline: boolean,
  _isLast: boolean,
): Chunk {
  const body = cur.lines.join("\n") + (hadTrailingNewline ? "\n" : "");
  return { heading: cur.heading, body };
}
