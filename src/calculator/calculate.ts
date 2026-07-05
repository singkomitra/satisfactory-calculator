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
    // Co-outputs of this recipe at this rate. Empty when the recipe has no byproducts.
    byproducts: { item: string; displayName: string; ppm: number }[];
  } | null;
  ingredients: CalculationNode[];
};

export type ByproductSummary = {
  item: string;
  displayName: string;
  produced: number;
  consumed: number;
  unclaimed: number;
};

export type CalculationResult = {
  tree: CalculationNode | null;
  rawResources: Record<string, number>;
  machines: Record<string, number>;
  byproducts: ByproductSummary[];
  // Set when no recipe combination could satisfy the target under the current
  // filters (excluded resources, reject-byproducts). tree will be null.
  infeasible: null | {
    reason: "no-recipe-avoids-excluded" | "no-recipe-avoids-byproducts" | "no-recipe";
    product: string;
  };
};

export type Strategy = "main" | "greedy-min-raw";

export type CalculateOptions = {
  strategy?: Strategy;
  recipeOverrides?: Record<string, string>;
  // Only used with strategy = "greedy-min-raw".
  // null = minimize sum of ALL raw resources (unweighted).
  // A product class name (e.g. "Desc_OreIron_C") = minimize only that resource.
  targetResource?: string | null;
  // Raw resources the plan is not allowed to consume. Byproducts of chosen
  // recipes are unaffected — exclusion is about inputs, not outputs.
  excludedResources?: string[];
  // If true, filter out any recipe that produces byproducts.
  rejectByproductRecipes?: boolean;
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
  const excluded = new Set(opts.excludedResources ?? []);
  const rejectByproducts = opts.rejectByproductRecipes ?? false;
  const rawResources: Record<string, number> = {};
  const machines: Record<string, number> = {};
  // Byproducts co-produced by chosen recipes. In the greedy engine these are
  // always "unclaimed" — greedy doesn't route byproducts as inputs to
  // downstream recipes (LP will). The summary surfaces them as needing sinks.
  const byproductProduced: Record<string, number> = {};
  const displayNames: Record<string, string> = {};

  const rawCostMemo = new Map<string, number>();
  const canProduceMemo = new Map<string, boolean>();

  const leafCost = (product: string, quantity: number): number => {
    if (targetResource === null) return quantity;
    return product === targetResource ? quantity : 0;
  };

  // Fast infeasibility check up-front. If the target can't be produced under
  // current filters, return an empty result with the reason set.
  if (!canProduce(target, new Set())) {
    return {
      tree: null,
      rawResources: {},
      machines: {},
      byproducts: [],
      infeasible: {
        reason:
          excluded.size > 0
            ? "no-recipe-avoids-excluded"
            : rejectByproducts
              ? "no-recipe-avoids-byproducts"
              : "no-recipe",
        product: target
      }
    };
  }

  const tree = build(target, targetPpm, new Set());

  const byproducts: ByproductSummary[] = Object.keys(byproductProduced).map((item) => {
    const produced = byproductProduced[item] ?? 0;
    return {
      item,
      displayName: displayNames[item] ?? DEFAULT_DISPLAY(item),
      produced,
      consumed: 0,
      unclaimed: produced
    };
  });

  return { tree, rawResources, machines, byproducts, infeasible: null };

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

    // Byproduct rate scales with how many recipe executions we need.
    // executions/min = ppm / recipe.amount * (60 / duration) but we already
    // encode that in machineCount. Byproduct rate = byproduct.amount / main.amount * ppm.
    const recipeByproducts: { item: string; displayName: string; ppm: number }[] = [];
    for (const bp of recipe.byproducts) {
      const rate = recipe.amount === 0 ? 0 : (bp.amount / recipe.amount) * ppm;
      byproductProduced[bp.item] = (byproductProduced[bp.item] ?? 0) + rate;
      const bpEntry = productsMap[bp.item];
      const bpDisplayName = bpEntry?.displayName ?? DEFAULT_DISPLAY(bp.item);
      if (bpEntry) displayNames[bp.item] = bpEntry.displayName;
      recipeByproducts.push({ item: bp.item, displayName: bpDisplayName, ppm: rate });
    }

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
        manufacturingDuration: recipe.manufacturingDuration,
        byproducts: recipeByproducts
      },
      ingredients
    };
  }

  function recipeAllowed(recipe: RecipeChoice, visiting: Set<string>): boolean {
    if (dependsOn(recipe, visiting)) return false;
    if (rejectByproducts && recipe.byproducts.length > 0) return false;
    // Every ingredient must be producible without touching an excluded resource.
    for (const ing of recipe.ingredients) {
      if (!canProduce(ing.item, visiting)) return false;
    }
    return true;
  }

  function chooseRecipe(product: string, entry: ProductsMap[string], visiting: Set<string>): RecipeChoice | null {
    if (overrides[product]) {
      const found = findRecipe(entry, overrides[product]);
      if (found && recipeAllowed(found, visiting)) return found;
    }

    const allCandidates: RecipeChoice[] = [entry.mainRecipe, ...entry.altRecipes].filter(
      (r): r is RecipeChoice => !!r && recipeAllowed(r, visiting)
    );
    if (allCandidates.length === 0) return null;

    if (strategy === "main") {
      // Main preferred; fall through to alts in definition order.
      return allCandidates[0];
    }

    // greedy-min-raw: pick the recipe with the smallest total raw-resource ppm
    // when producing one unit of `product`. Non-raw ingredients are recursively costed.
    let best: RecipeChoice = allCandidates[0];
    let bestCost = rawCost(allCandidates[0], visiting);
    for (let i = 1; i < allCandidates.length; i++) {
      const cost = rawCost(allCandidates[i], visiting);
      if (cost < bestCost) {
        bestCost = cost;
        best = allCandidates[i];
      }
    }
    return best;
  }

  /**
   * True if `product` can be produced under the current filter set. A raw
   * resource is producible iff it isn't excluded. A crafted product is
   * producible iff some recipe exists whose byproducts pass the reject filter
   * AND every ingredient is itself producible. Memoized. Cycles resolve to
   * false during the recursive descent (broken by `visiting`).
   */
  function canProduce(product: string, visiting: Set<string>): boolean {
    if (visiting.has(product)) return false;
    const cached = canProduceMemo.get(product);
    if (cached !== undefined) return cached;

    const entry = productsMap[product];
    if (!entry) {
      // Raw resource (or missing). Producible iff not excluded.
      const ok = !excluded.has(product);
      canProduceMemo.set(product, ok);
      return ok;
    }

    const next = new Set(visiting);
    next.add(product);

    const allRecipes = [entry.mainRecipe, ...entry.altRecipes].filter((r): r is RecipeChoice => !!r);
    for (const r of allRecipes) {
      if (rejectByproducts && r.byproducts.length > 0) continue;
      let allIngredientsOk = true;
      for (const ing of r.ingredients) {
        if (!canProduce(ing.item, next)) {
          allIngredientsOk = false;
          break;
        }
      }
      if (allIngredientsOk) {
        canProduceMemo.set(product, true);
        return true;
      }
    }
    canProduceMemo.set(product, false);
    return false;
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
      (r): r is RecipeChoice => !!r && recipeAllowed(r, visiting)
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
