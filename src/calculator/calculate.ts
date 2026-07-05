import { ProductsMap } from "@/types";

export type RecipeChoice = ProductsMap[string]["mainRecipe"];

export type CalculationNode = {
  product: string;
  displayName: string;
  ppm: number;
  isRawResource: boolean;
  recipe: {
    recipeName: string;
    displayName: string;
    producedIn: string;
    machineCount: number;
    baseAmount: number;
    manufacturingDuration: number;
  } | null;
  ingredients: CalculationNode[];
};

export type CalculationResult = {
  tree: CalculationNode;
  rawResources: Record<string, number>;
  machines: Record<string, number>;
};

export type Strategy = "main" | "greedy-min-raw";

export type CalculateOptions = {
  strategy?: Strategy;
  recipeOverrides?: Record<string, string>;
  // Only used with strategy = "greedy-min-raw".
  // null = minimize sum of ALL raw resources (unweighted).
  // A product class name (e.g. "Desc_OreIron_C") = minimize only that resource.
  targetResource?: string | null;
};

const DEFAULT_DISPLAY = (product: string) => product.replace(/^Desc_/, "").replace(/_C$/, "");

export function calculate(
  productsMap: ProductsMap,
  target: string,
  targetPpm: number,
  opts: CalculateOptions = {}
): CalculationResult {
  const strategy = opts.strategy ?? "main";
  const overrides = opts.recipeOverrides ?? {};
  const targetResource = opts.targetResource ?? null;
  const rawResources: Record<string, number> = {};
  const machines: Record<string, number> = {};
  // Memo key includes targetResource, but since targetResource is fixed per
  // call, the plain per-product cache is fine.
  const rawCostMemo = new Map<string, number>();

  const leafCost = (product: string, quantity: number): number => {
    if (targetResource === null) return quantity;
    return product === targetResource ? quantity : 0;
  };

  const tree = build(target, targetPpm, new Set());
  return { tree, rawResources, machines };

  function build(product: string, ppm: number, visiting: Set<string>): CalculationNode {
    const entry = productsMap[product];

    if (!entry) {
      rawResources[product] = (rawResources[product] ?? 0) + ppm;
      return {
        product,
        displayName: DEFAULT_DISPLAY(product),
        ppm,
        isRawResource: true,
        recipe: null,
        ingredients: []
      };
    }

    const recipe = chooseRecipe(product, entry, visiting);
    if (!recipe) {
      rawResources[product] = (rawResources[product] ?? 0) + ppm;
      return {
        product,
        displayName: entry.displayName,
        ppm,
        isRawResource: true,
        recipe: null,
        ingredients: []
      };
    }

    const machineCount = recipe.ppm === 0 ? 0 : ppm / recipe.ppm;
    machines[recipe.producedIn] = (machines[recipe.producedIn] ?? 0) + machineCount;

    const nextVisiting = new Set(visiting);
    nextVisiting.add(product);

    const ingredients = recipe.ingredients.map((ing) => {
      const perProductRate = recipe.amount === 0 ? 0 : ing.amount / recipe.amount;
      const requiredPpm = ppm * perProductRate;
      return build(ing.item, requiredPpm, nextVisiting);
    });

    return {
      product,
      displayName: entry.displayName,
      ppm,
      isRawResource: false,
      recipe: {
        recipeName: recipe.recipeName,
        displayName: recipe.displayName,
        producedIn: recipe.producedIn,
        machineCount,
        baseAmount: recipe.amount,
        manufacturingDuration: recipe.manufacturingDuration
      },
      ingredients
    };
  }

  function chooseRecipe(
    product: string,
    entry: ProductsMap[string],
    visiting: Set<string>
  ): RecipeChoice | null {
    if (overrides[product]) {
      const found = findRecipe(entry, overrides[product]);
      if (found && !dependsOn(found, visiting)) return found;
    }

    if (strategy === "main") {
      if (entry.mainRecipe && !dependsOn(entry.mainRecipe, visiting)) return entry.mainRecipe;
      const fallback = entry.altRecipes.find((r) => !dependsOn(r, visiting));
      return fallback ?? null;
    }

    // greedy-min-raw: pick the recipe with the smallest total raw-resource ppm
    // when producing one unit of `product`. Non-raw ingredients are recursively costed.
    const candidates: RecipeChoice[] = [entry.mainRecipe, ...entry.altRecipes].filter(
      (r): r is RecipeChoice => !!r && !dependsOn(r, visiting)
    );
    if (candidates.length === 0) return null;

    let best: RecipeChoice = candidates[0];
    let bestCost = rawCost(candidates[0], visiting);
    for (let i = 1; i < candidates.length; i++) {
      const cost = rawCost(candidates[i], visiting);
      if (cost < bestCost) {
        bestCost = cost;
        best = candidates[i];
      }
    }
    return best;
  }

  function rawCost(recipe: RecipeChoice, visiting: Set<string>): number {
    if (recipe.amount === 0) return Infinity;
    let total = 0;
    for (const ing of recipe.ingredients) {
      const perUnit = ing.amount / recipe.amount;
      total += rawCostForProduct(ing.item, perUnit, visiting);
    }
    return total;
  }

  function rawCostForProduct(product: string, quantity: number, visiting: Set<string>): number {
    const entry = productsMap[product];
    if (!entry) return leafCost(product, quantity);
    if (visiting.has(product)) return leafCost(product, quantity);

    const cached = rawCostMemo.get(product);
    if (cached !== undefined) return cached * quantity;

    const candidates: RecipeChoice[] = [entry.mainRecipe, ...entry.altRecipes].filter(
      (r): r is RecipeChoice => !!r && !dependsOn(r, visiting)
    );
    if (candidates.length === 0) return leafCost(product, quantity);

    const next = new Set(visiting);
    next.add(product);

    let min = Infinity;
    for (const r of candidates) {
      const c = rawCost(r, next);
      if (c < min) min = c;
    }
    if (min === Infinity) return leafCost(product, quantity);
    rawCostMemo.set(product, min);
    return min * quantity;
  }

  function findRecipe(entry: ProductsMap[string], recipeName: string): RecipeChoice | null {
    if (entry.mainRecipe?.recipeName === recipeName) return entry.mainRecipe;
    return entry.altRecipes.find((r) => r.recipeName === recipeName) ?? null;
  }

  function dependsOn(recipe: RecipeChoice, visiting: Set<string>): boolean {
    for (const ing of recipe.ingredients) {
      if (visiting.has(ing.item)) return true;
    }
    return false;
  }
}
