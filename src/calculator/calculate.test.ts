import { describe, it, expect } from "vitest";
import { calculate } from "./calculate";
import { loadProductsMap, P, nearly } from "../__tests__/fixtures";

const pm = loadProductsMap();

describe("calculate (greedy, main strategy)", () => {
  it("60 Modular Frame → 1440 Iron Ore, 192 machines", () => {
    const r = calculate(pm, P.ModularFrame, 60);
    expect(r.infeasible).toBeNull();
    expect(r.tree).not.toBeNull();

    // Only raw is Iron Ore for this chain
    expect(Object.keys(r.rawResources)).toEqual([P.OreIron]);
    expect(nearly(r.rawResources[P.OreIron], 1440)).toBe(true);

    const totalMachines = Object.values(r.machines).reduce((a, b) => a + b, 0);
    expect(nearly(totalMachines, 192)).toBe(true);
  });

  it("60 Fuel (a fluid target) normalizes to 1.5 refineries + 45 Polymer Resin byproduct", () => {
    const r = calculate(pm, P.Fuel, 60);
    expect(r.infeasible).toBeNull();

    // Oil is the only raw
    expect(nearly(r.rawResources[P.LiquidOil], 90)).toBe(true);

    // Single OilRefinery entry, 1.5 machines — proves fluid unit normalization
    const refinery = Object.entries(r.machines).find(([b]) => b.includes("OilRefinery"));
    expect(refinery).toBeDefined();
    expect(nearly(refinery![1], 1.5)).toBe(true);

    // Polymer Resin byproduct at 45/min
    const polymer = r.byproducts.find((b) => b.item === P.PolymerResin);
    expect(polymer).toBeDefined();
    expect(nearly(polymer!.produced, 45)).toBe(true);
    expect(polymer!.unclaimed).toBe(45); // greedy never routes byproducts
  });

  it("excluding LiquidOil makes Fuel infeasible", () => {
    const r = calculate(pm, P.Fuel, 60, { excludedResources: [P.LiquidOil] });
    expect(r.infeasible).not.toBeNull();
    expect(r.infeasible!.reason).toBe("no-recipe-avoids-excluded");
    expect(r.infeasible!.product).toBe(P.Fuel);
    expect(r.tree).toBeNull();
  });

  it("rejecting byproduct recipes makes Fuel infeasible", () => {
    const r = calculate(pm, P.Fuel, 60, { rejectByproductRecipes: true });
    expect(r.infeasible).not.toBeNull();
    expect(r.infeasible!.reason).toBe("no-recipe-avoids-byproducts");
  });

  it("excluding Iron Ore makes Modular Frame infeasible", () => {
    const r = calculate(pm, P.ModularFrame, 60, { excludedResources: [P.OreIron] });
    expect(r.infeasible).not.toBeNull();
    expect(r.tree).toBeNull();
  });

  it("recipe override forces a specific recipe", () => {
    const ironPlateEntry = pm[P.IronPlate];
    const altRecipe = ironPlateEntry.altRecipes.find((r) => r.recipeName.includes("Alternate_CoatedIronPlate"));
    expect(altRecipe).toBeDefined();

    const r = calculate(pm, P.ModularFrame, 60, {
      recipeOverrides: { [P.IronPlate]: altRecipe!.recipeName }
    });
    expect(r.infeasible).toBeNull();

    // Coated Iron Plate uses Plastic (not raw ore only), so LiquidOil must now appear.
    expect(r.rawResources[P.LiquidOil]).toBeGreaterThan(0);
  });
});

describe("calculate (greedy-min-raw)", () => {
  it("min-raw for Modular Frame uses substantially less iron than main", () => {
    const main = calculate(pm, P.ModularFrame, 60, { strategy: "main" });
    const minRaw = calculate(pm, P.ModularFrame, 60, { strategy: "greedy-min-raw" });
    expect(minRaw.infeasible).toBeNull();
    expect(minRaw.rawResources[P.OreIron]).toBeLessThan(main.rawResources[P.OreIron]);
  });

  it("min-raw with targetResource=iron minimizes only iron", () => {
    const allRaw = calculate(pm, P.ModularFrame, 60, { strategy: "greedy-min-raw" });
    const ironOnly = calculate(pm, P.ModularFrame, 60, {
      strategy: "greedy-min-raw",
      targetResource: P.OreIron
    });
    // Focused minimization should drive iron even lower (or equal — depends on ties)
    expect(ironOnly.rawResources[P.OreIron]).toBeLessThanOrEqual(allRaw.rawResources[P.OreIron]);
  });
});

describe("calculate (cycle safety)", () => {
  it("does not infinite-loop when a product has packaging/unpackaging cycles", () => {
    // Sulfuric Acid ⇄ Packaged Sulfuric Acid is the canonical cycle case.
    const sulfuric = "Desc_SulfuricAcid_C";
    const start = Date.now();
    const r = calculate(pm, sulfuric, 60);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // 2 second budget — well above real perf
    expect(r).toBeTruthy(); // just must not hang / throw
  });
});
