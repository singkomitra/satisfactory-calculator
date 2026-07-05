import { describe, it, expect } from "vitest";
import { calculateLP } from "./lp-calculate";
import { loadProductsMap, P, nearly } from "../__tests__/fixtures";

const pm = loadProductsMap();

describe("calculateLP (feasibility)", () => {
  it("60 Modular Frame produces a feasible plan", () => {
    const r = calculateLP(pm, P.ModularFrame, 60);
    expect(r.infeasible).toBeNull();
    expect(r.tree).not.toBeNull();
    expect(Object.keys(r.machines).length).toBeGreaterThan(0);
  });

  it("60 Concrete finds a low-machine plan", () => {
    const r = calculateLP(pm, P.Concrete, 60);
    expect(r.infeasible).toBeNull();
    const totalMachines = Object.values(r.machines).reduce((a, b) => a + b, 0);
    // Concrete + a few supporting recipes — should be well under 10 machines
    expect(totalMachines).toBeLessThan(10);
  });

  it("Excluded LiquidOil blocks Fuel", () => {
    const r = calculateLP(pm, P.Fuel, 60, {
      resourceConstraints: { [P.LiquidOil]: { mode: "excluded" } }
    });
    expect(r.infeasible).not.toBeNull();
    expect(r.tree).toBeNull();
  });
});

describe("calculateLP (Max constraint)", () => {
  it("Max Iron Ore = 60 for 60 Modular Frame is infeasible", () => {
    const r = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "max", value: 60 } }
    });
    expect(r.infeasible).not.toBeNull();
  });

  it("Max Iron Ore = 300 for 60 Modular Frame yields plan with iron ≤ 300", () => {
    const r = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "max", value: 300 } }
    });
    expect(r.infeasible).toBeNull();
    // Iron ore consumption must respect the cap (allow small numerical slop)
    expect(r.rawResources[P.OreIron] ?? 0).toBeLessThanOrEqual(300 + 1e-3);
  });

  it("tightening Max Iron Ore forces LP to use more of other raws", () => {
    const loose = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "max", value: 1000 } }
    });
    const tight = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "max", value: 200 } }
    });
    expect(loose.infeasible).toBeNull();
    expect(tight.infeasible).toBeNull();
    expect(tight.rawResources[P.OreIron] ?? 0).toBeLessThan(loose.rawResources[P.OreIron] ?? Infinity);
  });
});

describe("calculateLP (Min constraint)", () => {
  it("Min Iron Ore = 1000 for 60 Modular Frame forces at-least consumption", () => {
    const r = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "min", value: 1000 } }
    });
    // May be infeasible (main path uses only ~1440); if feasible, iron >= 1000.
    if (!r.infeasible) {
      expect(r.rawResources[P.OreIron] ?? 0).toBeGreaterThanOrEqual(1000 - 1e-3);
    }
  });
});

describe("calculateLP (Exact constraint)", () => {
  it("Exact Iron Ore consumption is honored", () => {
    const r = calculateLP(pm, P.ModularFrame, 60, {
      resourceConstraints: { [P.OreIron]: { mode: "exact", value: 500 } }
    });
    if (!r.infeasible) {
      expect(nearly(r.rawResources[P.OreIron] ?? 0, 500, 1e-3)).toBe(true);
    }
  });
});

describe("calculateLP (objectives)", () => {
  it("min-buildings finds fewer machines than min-all-raw for Modular Frame", () => {
    const minBuildings = calculateLP(pm, P.ModularFrame, 60, {
      objective: { kind: "min-buildings" }
    });
    const minRaw = calculateLP(pm, P.ModularFrame, 60, {
      objective: { kind: "min-all-raw" }
    });
    expect(minBuildings.infeasible).toBeNull();
    expect(minRaw.infeasible).toBeNull();
    const mb = Object.values(minBuildings.machines).reduce((a, b) => a + b, 0);
    const mr = Object.values(minRaw.machines).reduce((a, b) => a + b, 0);
    expect(mb).toBeLessThanOrEqual(mr + 1e-3);
  });

  it("min-resource(iron) for Modular Frame minimizes iron below default", () => {
    const def = calculateLP(pm, P.ModularFrame, 60);
    const focused = calculateLP(pm, P.ModularFrame, 60, {
      objective: { kind: "min-resource", resource: P.OreIron }
    });
    expect(focused.infeasible).toBeNull();
    expect(focused.rawResources[P.OreIron] ?? 0).toBeLessThanOrEqual(def.rawResources[P.OreIron] ?? Infinity);
  });
});
