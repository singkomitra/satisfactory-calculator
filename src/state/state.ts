import { ProductsMap } from "../types";
import { observable } from "mobx";
import { ResourceConstraint, LPObjective } from "@/calculator/lp-calculate";

export type CalculationStrategy = "main" | "greedy-min-raw";

// Which engine solves for recipe rates.
// - "greedy": local per-node choice, fast, exclusion-only.
// - "lp": linear-programming solver, handles Max/Min/Exact + closed byproducts.
export type CalculationEngine = "greedy" | "lp";

export type State = {
  data: ProductsMap | null;
  theme: "light" | "dark";
  selectedProduct: string | null;
  targetPpm: number;
  engine: CalculationEngine;
  strategy: CalculationStrategy;
  // null = minimize sum of ALL raw resources.
  // A product class name = minimize only that resource.
  targetResource: string | null;
  // Legacy simple exclusion set (still used for greedy).
  excludedResources: Record<string, true>;
  // Richer per-resource constraints (used by LP engine).
  resourceConstraints: Record<string, ResourceConstraint>;
  // If true, byproduct production must equal consumption (closed loop).
  closedByproducts: boolean;
  // If true, only recipes with no byproducts are considered.
  rejectByproductRecipes: boolean;
  // LP objective selector.
  lpObjective: LPObjective;
  recipeOverrides: Record<string, string>;
};

export const state: State = observable({
  data: null,
  theme: "dark",
  selectedProduct: null,
  targetPpm: 60,
  engine: "greedy",
  strategy: "main",
  targetResource: null,
  excludedResources: {},
  resourceConstraints: {},
  closedByproducts: false,
  rejectByproductRecipes: false,
  lpObjective: { kind: "min-buildings" },
  recipeOverrides: {}
});
