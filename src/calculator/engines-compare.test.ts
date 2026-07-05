import { describe, it, expect } from "vitest";
import { calculate, CalculationResult } from "./calculate";
import { calculateLP } from "./lp-calculate";
import { loadProductsMap, P } from "../__tests__/fixtures";

const pm = loadProductsMap();

/**
 * Both engines must produce the same CalculationResult shape so downstream
 * code (graph builder, summary panel) doesn't need to know which one ran.
 */
function assertShape(r: CalculationResult) {
  expect(r).toHaveProperty("tree");
  expect(r).toHaveProperty("rawResources");
  expect(r).toHaveProperty("machines");
  expect(r).toHaveProperty("byproducts");
  expect(r).toHaveProperty("infeasible");
  if (!r.infeasible) {
    expect(r.tree).not.toBeNull();
  }
  expect(Array.isArray(r.byproducts)).toBe(true);
}

describe("engine comparison (greedy vs LP)", () => {
  const scenarios: { name: string; product: string; ppm: number }[] = [
    { name: "60 Modular Frame", product: P.ModularFrame, ppm: 60 },
    { name: "60 Fuel (fluid target)", product: P.Fuel, ppm: 60 },
    { name: "60 Concrete", product: P.Concrete, ppm: 60 }
  ];

  for (const { name, product, ppm } of scenarios) {
    it(`${name}: both engines produce compatible shape`, () => {
      const greedy = calculate(pm, product, ppm);
      const lp = calculateLP(pm, product, ppm);
      assertShape(greedy);
      assertShape(lp);
    });

    it(`${name}: LP min-buildings ≤ greedy machine count`, () => {
      const greedy = calculate(pm, product, ppm);
      const lp = calculateLP(pm, product, ppm, { objective: { kind: "min-buildings" } });
      expect(greedy.infeasible).toBeNull();
      expect(lp.infeasible).toBeNull();

      const greedyMachines = Object.values(greedy.machines).reduce((a, b) => a + b, 0);
      const lpMachines = Object.values(lp.machines).reduce((a, b) => a + b, 0);
      // LP is globally optimal for the "min buildings" objective; greedy is a
      // per-node local pick. LP must be ≤ greedy (allow tiny numerical slop).
      expect(lpMachines).toBeLessThanOrEqual(greedyMachines + 1e-3);
    });
  }

  it("both engines agree on infeasibility when critical raw is excluded", () => {
    const opts = { excludedResources: [P.LiquidOil] };
    const greedy = calculate(pm, P.Fuel, 60, opts);
    const lp = calculateLP(pm, P.Fuel, 60, {
      resourceConstraints: { [P.LiquidOil]: { mode: "excluded" } }
    });
    expect(greedy.infeasible).not.toBeNull();
    expect(lp.infeasible).not.toBeNull();
  });

  it("both engines can be called on the same map concurrently (no shared state)", async () => {
    const [g1, g2, l1, l2] = await Promise.all([
      Promise.resolve(calculate(pm, P.ModularFrame, 60)),
      Promise.resolve(calculate(pm, P.Fuel, 60)),
      Promise.resolve(calculateLP(pm, P.ModularFrame, 60)),
      Promise.resolve(calculateLP(pm, P.Fuel, 60))
    ]);
    assertShape(g1);
    assertShape(g2);
    assertShape(l1);
    assertShape(l2);
    // Sanity: rerunning gives the same numbers (deterministic)
    const g1Again = calculate(pm, P.ModularFrame, 60);
    expect(g1.rawResources[P.OreIron]).toBe(g1Again.rawResources[P.OreIron]);
  });

  it("both engines report byproduct totals for Fuel", () => {
    const greedy = calculate(pm, P.Fuel, 60);
    const lp = calculateLP(pm, P.Fuel, 60);
    const greedyPoly = greedy.byproducts.find((b) => b.item === P.PolymerResin);
    const lpPoly = lp.byproducts.find((b) => b.item === P.PolymerResin);
    // Both should surface polymer resin as a byproduct at some rate > 0.
    // LP may route the byproduct downstream if there's a consumer, so its
    // `produced` may differ from greedy's — we just assert both saw it.
    expect(greedyPoly).toBeDefined();
    expect(lpPoly).toBeDefined();
    expect(greedyPoly!.produced).toBeGreaterThan(0);
    expect(lpPoly!.produced).toBeGreaterThan(0);
  });
});
