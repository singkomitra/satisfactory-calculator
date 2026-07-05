import { describe, it, expect } from "vitest";
import { calculate } from "./calculate";
import { buildGraph } from "./graph";
import { loadProductsMap, P, nearly } from "../__tests__/fixtures";

const pm = loadProductsMap();

describe("buildGraph", () => {
  it("merges duplicate products into a single node", () => {
    // Modular Frame uses Iron Ingot in two branches (via Iron Rod and via
    // Iron Plate). The graph should show a single Iron Ingot node.
    const result = calculate(pm, P.ModularFrame, 60);
    const g = buildGraph(result);

    const ironIngotNodes = g.nodes.filter((n) => n.id === P.IronIngot);
    expect(ironIngotNodes).toHaveLength(1);
    // Its ppm must equal the summed demand from both branches.
    expect(nearly(ironIngotNodes[0].ppm, 1440)).toBe(true);
  });

  it("does not double-count edges when a product is used multiple times", () => {
    const result = calculate(pm, P.ModularFrame, 60);
    const g = buildGraph(result);

    // Total iron ore consumption on incoming edges to Iron Ingot must equal 1440
    const incomingToIronIngot = g.edges.filter((e) => e.to === P.IronIngot);
    const totalPpm = incomingToIronIngot.reduce((sum, e) => sum + e.ppm, 0);
    expect(nearly(totalPpm, 1440)).toBe(true);
  });

  it("separates byproduct sink nodes from regular product nodes", () => {
    // Fuel produces Polymer Resin as byproduct. The byproduct node must be
    // keyed differently from the Polymer Resin product node (if any).
    const result = calculate(pm, P.Fuel, 60);
    const g = buildGraph(result);

    const bpNode = g.nodes.find((n) => n.id === `byproduct:${P.PolymerResin}`);
    expect(bpNode).toBeDefined();
    expect(bpNode!.isByproduct).toBe(true);
    expect(bpNode!.isRawResource).toBe(false);

    // Byproduct edge should exist from Fuel node -> byproduct node
    const bpEdge = g.edges.find((e) => e.from === P.Fuel && e.to === `byproduct:${P.PolymerResin}`);
    expect(bpEdge).toBeDefined();
    expect(nearly(bpEdge!.ppm, 45)).toBe(true);
  });

  it("returns empty nodes/edges for infeasible results", () => {
    const result = calculate(pm, P.Fuel, 60, { excludedResources: [P.LiquidOil] });
    const g = buildGraph(result);
    expect(g.nodes).toHaveLength(0);
    expect(g.edges).toHaveLength(0);
    expect(g.rootId).toBe("");
  });

  it("root node id matches the requested target", () => {
    const result = calculate(pm, P.ModularFrame, 60);
    const g = buildGraph(result);
    expect(g.rootId).toBe(P.ModularFrame);
    const root = g.nodes.find((n) => n.id === g.rootId);
    expect(root).toBeDefined();
    expect(nearly(root!.ppm, 60)).toBe(true);
  });
});
