import { ProductsMap } from "../types";
import { observable } from "mobx";

export type CalculationStrategy = "main" | "greedy-min-raw";

export type State = {
  data: ProductsMap | null;
  theme: "light" | "dark";
  selectedProduct: string | null;
  targetPpm: number;
  strategy: CalculationStrategy;
  // null = minimize sum of ALL raw resources.
  // A product class name = minimize only that resource.
  targetResource: string | null;
  recipeOverrides: Record<string, string>;
};

export const state: State = observable({
  data: null,
  theme: "dark",
  selectedProduct: null,
  targetPpm: 60,
  strategy: "main",
  targetResource: null,
  recipeOverrides: {}
});
