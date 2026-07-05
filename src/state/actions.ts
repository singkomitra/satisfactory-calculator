import { ProductsMap } from "@/types";
import { state, CalculationStrategy } from "./state";

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
  state.recipeOverrides = {};
};
export const clearExcludedResources = () => {
  state.excludedResources = {};
  state.recipeOverrides = {};
};
export const setRejectByproductRecipes = (v: boolean) => {
  state.rejectByproductRecipes = v;
  state.recipeOverrides = {};
};
