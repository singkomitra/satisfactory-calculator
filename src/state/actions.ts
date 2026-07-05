import { ProductsMap } from "@/types";
import { state, CalculationStrategy, CalculationEngine } from "./state";
import { ResourceConstraint, LPObjective } from "@/calculator/lp-calculate";

export const setData = (data: ProductsMap) => {
  state.data = data;
};
export const toggleTheme = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
};
export const selectProduct = (product: string | null) => {
  state.selectedProduct = product;
  state.recipeOverrides = {};
};
export const setTargetPpm = (ppm: number) => {
  state.targetPpm = ppm;
};
export const setEngine = (engine: CalculationEngine) => {
  state.engine = engine;
  state.recipeOverrides = {};
};
export const setStrategy = (strategy: CalculationStrategy) => {
  state.strategy = strategy;
  state.recipeOverrides = {};
};
export const setTargetResource = (resource: string | null) => {
  state.targetResource = resource;
  state.recipeOverrides = {};
};
export const setRecipeOverride = (product: string, recipeName: string) => {
  state.recipeOverrides = { ...state.recipeOverrides, [product]: recipeName };
};
export const clearRecipeOverride = (product: string) => {
  const { [product]: _, ...rest } = state.recipeOverrides;
  state.recipeOverrides = rest;
};
export const clearAllOverrides = () => {
  state.recipeOverrides = {};
};
export const toggleExcludedResource = (resource: string) => {
  const next = { ...state.excludedResources };
  if (next[resource]) delete next[resource];
  else next[resource] = true;
  state.excludedResources = next;
  // Keep resourceConstraints in sync with the simple exclusion set.
  syncSimpleExclusionToLPConstraints();
  state.recipeOverrides = {};
};
export const clearExcludedResources = () => {
  state.excludedResources = {};
  syncSimpleExclusionToLPConstraints();
  state.recipeOverrides = {};
};
export const setResourceConstraint = (resource: string, constraint: ResourceConstraint) => {
  const next = { ...state.resourceConstraints };
  if (constraint.mode === "unlimited") delete next[resource];
  else next[resource] = constraint;
  state.resourceConstraints = next;
  // Keep the simple exclusion set in sync (for the greedy engine to see).
  const nextExcluded = { ...state.excludedResources };
  if (constraint.mode === "excluded") nextExcluded[resource] = true;
  else delete nextExcluded[resource];
  state.excludedResources = nextExcluded;
  state.recipeOverrides = {};
};
export const clearResourceConstraints = () => {
  state.resourceConstraints = {};
  state.excludedResources = {};
  state.recipeOverrides = {};
};
export const setClosedByproducts = (v: boolean) => {
  state.closedByproducts = v;
  state.recipeOverrides = {};
};
export const setLPObjective = (obj: LPObjective) => {
  state.lpObjective = obj;
  state.recipeOverrides = {};
};
export const setRejectByproductRecipes = (v: boolean) => {
  state.rejectByproductRecipes = v;
  state.recipeOverrides = {};
};

/**
 * When someone toggles a resource on/off via the simple excluded set (used by
 * the greedy Resources panel), mirror those to the richer resourceConstraints
 * map so LP sees the same intent.
 */
function syncSimpleExclusionToLPConstraints() {
  const next: Record<string, ResourceConstraint> = { ...state.resourceConstraints };
  // First, drop any Excluded entries whose product no longer appears in the set.
  for (const [k, v] of Object.entries(next)) {
    if (v.mode === "excluded" && !state.excludedResources[k]) delete next[k];
  }
  // Then add Excluded for every currently-excluded resource that isn't already
  // there with a different mode.
  for (const k of Object.keys(state.excludedResources)) {
    const cur = next[k];
    if (!cur || cur.mode === "excluded") next[k] = { mode: "excluded" };
  }
  state.resourceConstraints = next;
}
