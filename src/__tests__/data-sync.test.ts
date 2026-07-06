import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("data file sync", () => {
  it("public/data/products-map.json is byte-identical to src/parsing/jsons/products-map.json", () => {
    // The deployed site serves the public/ copy; the parsing pipeline and unit
    // tests read the src/ copy. /api/dev/regenerate writes both — this guards
    // against someone editing one by hand.
    const a = readFileSync(path.join(process.cwd(), "src/parsing/jsons/products-map.json"), "utf-8");
    const b = readFileSync(path.join(process.cwd(), "public/data/products-map.json"), "utf-8");
    expect(a).toBe(b);
  });
});
