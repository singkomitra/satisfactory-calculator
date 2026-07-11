import { ProductsMap } from "../types";
import { observable } from "mobx";
import { ResourceConstraint, LPObjective } from "@/calculator/lp-calculate";

export type CalculationStrategy = "main" | "greedy-min-raw";

// Which engine solves for recipe rates.
// - "greedy": local per-node choice, fast, exclusion-only.
// - "lp": linear-programming solver, handles Max/Min/Exact + closed byproducts.
export type CalculationEngine = "greedy" | "lp";

// Customer-facing optimization goal. Each goal maps to an engine + solver
// configuration internally — users never see "greedy" or "LP". "custom" means
// an Advanced control was touched directly and no preset describes the state.
export type OptimizationGoal =
  | "standard" // vanilla recipe chain (greedy, main recipes)
  | "fewest-machines" // LP, min-buildings
  | "least-raw" // LP, min-all-raw
  | "save-resource" // LP, min-resource (goalResource picks which)
  | "no-waste" // LP, closed byproduct loop
  | "custom";

export type State = {
  data: ProductsMap | null;
  theme: "light" | "dark";
  selectedProduct: string | null;
  targetPpm: number;
  // Customer-facing goal; drives engine/objective via actions.setGoal.
  goal: OptimizationGoal;
  // Which resource "save-resource" minimizes.
  goalResource: string | null;
  // Show the raw solver controls (engine/strategy/objective/byproducts).
  advancedMode: boolean;
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
  goal: "standard",
  goalResource: null,
  advancedMode: false,
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
