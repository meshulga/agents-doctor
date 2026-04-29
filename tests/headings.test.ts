import { describe, expect, it } from "vitest";
import { splitByH2 } from "../src/headings.js";

describe("splitByH2", () => {
  it("returns a single intro chunk when there are no h2s", () => {
    const out = splitByH2("Just some text\nwith no headings\n");
    expect(out).toEqual([{ heading: null, body: "Just some text\nwith no headings\n" }]);
  });

  it("splits on top-level h2 and keeps the heading line in the body", () => {
    const md = "intro\n## A\nbody A\n## B\nbody B\n";
    expect(splitByH2(md)).toEqual([
      { heading: null, body: "intro\n" },
      { heading: "A", body: "## A\nbody A\n" },
      { heading: "B", body: "## B\nbody B\n" },
    ]);
  });

  it("ignores h2-looking text inside fenced code blocks", () => {
    const md = "intro\n```\n## not a heading\n```\n## Real\nbody\n";
    expect(splitByH2(md)).toEqual([
      { heading: null, body: "intro\n```\n## not a heading\n```\n" },
      { heading: "Real", body: "## Real\nbody\n" },
    ]);
  });

  it("omits an empty intro chunk when content starts with h2", () => {
    const md = "## A\nbody A\n";
    expect(splitByH2(md)).toEqual([{ heading: "A", body: "## A\nbody A\n" }]);
  });

  it("treats h3+ as body, not a split point", () => {
    const md = "## A\nbody\n### sub\nmore\n";
    expect(splitByH2(md)).toEqual([{ heading: "A", body: "## A\nbody\n### sub\nmore\n" }]);
  });
});
