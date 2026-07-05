import { describe, it, expect } from "vitest";
import { listRawResources } from "./rawResources";
import { loadProductsMap, P } from "../__tests__/fixtures";

const pm = loadProductsMap();

describe("listRawResources", () => {
  it("includes the standard core raws", () => {
    const raws = listRawResources(pm);
    const ids = new Set(raws.map((r) => r.id));
    for (const id of [P.OreIron, P.OreCopper, P.Coal, P.LiquidOil, P.Water, P.Stone]) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("labels are humanized (space-separated CamelCase)", () => {
    const raws = listRawResources(pm);
    const oreIron = raws.find((r) => r.id === P.OreIron);
    expect(oreIron?.label).toBe("Ore Iron");
    const rawQuartz = raws.find((r) => r.id === "Desc_RawQuartz_C");
    expect(rawQuartz?.label).toBe("Raw Quartz");
  });

  it("output is sorted alphabetically", () => {
    const raws = listRawResources(pm);
    const labels = raws.map((r) => r.label);
    const sorted = [...labels].sort((a, b) => a.localeCompare(b));
    expect(labels).toEqual(sorted);
  });
});
