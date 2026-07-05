import { describe, it, expect } from "vitest";
import { loadProductsMap, P } from "./fixtures";

describe("smoke", () => {
  it("loads the products-map fixture", () => {
    const pm = loadProductsMap();
    expect(Object.keys(pm).length).toBeGreaterThan(100);
    expect(pm[P.ModularFrame]).toBeTruthy();
    expect(pm[P.ModularFrame].mainRecipe.byproducts).toBeDefined();
  });
});
