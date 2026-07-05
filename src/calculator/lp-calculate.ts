import solver, { Model } from "javascript-lp-solver";
import { ProductsMap } from "@/types";
import { CalculationNode, CalculationResult, RecipeChoice } from "./calculate";

/**
 * Per-resource constraint mode for the LP engine.
 *
 * Every mode below except `unlimited` becomes at least one row in the LP.
 * The engine returns `infeasible` if no combination of recipe rates can
 * satisfy all constraints simultaneously.
 */
export type ResourceConstraint =
  | { mode: "unlimited" }
  | { mode: "excluded" }
  | { mode: "max"; value: number }
  | { mode: "min"; value: number }
  | { mode: "exact"; value: number };

export type LPObjective =
  | { kind: "min-buildings" }
  | { kind: "min-resource"; resource: string }
  | { kind: "min-all-raw" }
  | { kind: "min-byproducts" };

export type LPOptions = {
  recipeOverrides?: Record<string, string>;
  resourceConstraints?: Record<string, ResourceConstraint>;
  rejectByproductRecipes?: boolean;
  // When true, allow byproduct surplus (routed to a sink). When false, force
  // byproduct production to equal consumption — useful for "closed loop" plans.
  allowByproductSurplus?: boolean;
  objective?: LPObjective;
};

type Recipe = RecipeChoice;

/**
 * LP formulation
 *
 * Decision variables
 *   v_r ≥ 0 for every recipe r — "machines running recipe r".
 *   Production of item X by recipe r per minute = v_r × X_amount_per_batch × 60 / duration.
 *
 * Rows (constraints)
 *   For each product P that has at least one producing recipe:
 *     Σ v_r × produced(P, r) − Σ v_r × consumed(P, r) ≥ demand(P)
 *   where demand = targetPpm if P is the target, else 0 (surplus allowed).
 *
 *   For each raw resource R with a user constraint:
 *     Σ v_r × consumed(R, r) has the corresponding min/max/equal bound.
 *
 * Objective
 *   Selected by opts.objective. All are linear in v_r.
 */
export function calculateLP(
  productsMap: ProductsMap,
  target: string,
  targetPpm: number,
  opts: LPOptions = {}
): CalculationResult {
  const recipes = collectAllRecipes(productsMap, opts);
  if (recipes.size === 0) {
    return emptyInfeasible(target, "no-recipe");
  }

  const { model, recipeMap } = buildModel(productsMap, recipes, target, targetPpm, opts);
  const result = solver.Solve(model);

  if (!result.feasible) {
    return emptyInfeasible(target, guessInfeasibleReason(opts));
  }

  return synthesizeResult(productsMap, recipeMap, result, target, targetPpm);
}

/* -------------------------------- setup -------------------------------- */

function collectAllRecipes(productsMap: ProductsMap, opts: LPOptions): Map<string, Recipe> {
  const out = new Map<string, Recipe>();
  const reject = opts.rejectByproductRecipes ?? false;
  const overrides = opts.recipeOverrides ?? {};
  const forcedByProduct = new Map<string, string>();
  for (const [product, recipeName] of Object.entries(overrides)) {
    forcedByProduct.set(product, recipeName);
  }

  for (const [productName, entry] of Object.entries(productsMap)) {
    const candidates: Recipe[] = [entry.mainRecipe, ...entry.altRecipes].filter(
      (r): r is Recipe => !!r && (!reject || r.byproducts.length === 0)
    );

    // If the user pinned a recipe for this product, only include that recipe
    // as the producer of `productName` — same override semantics as greedy.
    if (forcedByProduct.has(productName)) {
      const forced = forcedByProduct.get(productName)!;
      const keep = candidates.filter((r) => r.recipeName === forced);
      for (const r of keep) if (!out.has(r.recipeName)) out.set(r.recipeName, r);
      continue;
    }
    for (const r of candidates) if (!out.has(r.recipeName)) out.set(r.recipeName, r);
  }
  return out;
}

type RecipeMap = {
  // For each recipe: what it produces (main + byproducts) and consumes, per machine, per minute.
  perMachine: Map<
    string,
    {
      recipe: Recipe;
      // Production of the main product per machine per minute.
      mainProduct: string;
      mainRate: number;
      // Byproduct rates per machine per minute (item → ppm).
      byproductRates: Map<string, number>;
      // Ingredient consumption rates per machine per minute (item → ppm).
      ingredientRates: Map<string, number>;
      // Duration in seconds (for machine-time reporting).
      duration: number;
      producedIn: string;
    }
  >;
  // Which recipes produce each product (main or byproduct)?
  producedBy: Map<string, string[]>;
  // Which recipes consume each product?
  consumedBy: Map<string, string[]>;
};

function buildModel(
  productsMap: ProductsMap,
  recipes: Map<string, Recipe>,
  target: string,
  targetPpm: number,
  opts: LPOptions
): { model: Model; recipeMap: RecipeMap } {
  const perMachine = new Map<string, RecipeMap["perMachine"] extends Map<string, infer V> ? V : never>();
  const producedBy = new Map<string, string[]>();
  const consumedBy = new Map<string, string[]>();

  const mainProductOf = (r: Recipe): string => {
    // The recipe lives under its main product in productsMap. Walk the map to
    // find which key it belongs to. This is O(n) per call but happens once
    // during model building.
    for (const [key, entry] of Object.entries(productsMap)) {
      if (entry.mainRecipe?.recipeName === r.recipeName) return key;
      if (entry.altRecipes.some((a) => a.recipeName === r.recipeName)) return key;
    }
    return "";
  };

  for (const [recipeName, r] of recipes) {
    if (r.manufacturingDuration <= 0 || r.amount <= 0) continue;
    const perExecPerMin = 60 / r.manufacturingDuration;
    const mainProduct = mainProductOf(r);
    if (!mainProduct) continue;

    const mainRate = perExecPerMin * r.amount;
    const byproductRates = new Map<string, number>();
    for (const bp of r.byproducts) {
      byproductRates.set(bp.item, perExecPerMin * bp.amount);
    }
    const ingredientRates = new Map<string, number>();
    for (const ing of r.ingredients) {
      ingredientRates.set(ing.item, perExecPerMin * ing.amount);
    }

    perMachine.set(recipeName, {
      recipe: r,
      mainProduct,
      mainRate,
      byproductRates,
      ingredientRates,
      duration: r.manufacturingDuration,
      producedIn: r.producedIn
    });

    push(producedBy, mainProduct, recipeName);
    for (const b of byproductRates.keys()) push(producedBy, b, recipeName);
    for (const i of ingredientRates.keys()) push(consumedBy, i, recipeName);
  }

  /* Now build the model. */

  const model: Model = {
    optimize: "objective",
    opType: "min",
    constraints: {},
    variables: {}
  };

  // Rows per product that has a producing recipe.
  const productsWithRecipe = new Set<string>(producedBy.keys());

  // Enforce demand: target ≥ targetPpm; intermediates ≥ 0 (allow surplus by default);
  // if closed-loop mode is on, intermediates == 0.
  const allowSurplus = opts.allowByproductSurplus ?? true;
  for (const p of productsWithRecipe) {
    if (p === target) {
      model.constraints[`prod_${p}`] = { min: targetPpm };
    } else if (allowSurplus) {
      model.constraints[`prod_${p}`] = { min: 0 };
    } else {
      model.constraints[`prod_${p}`] = { equal: 0 };
    }
  }

  // Raw resource constraints (only for resources that are actually consumed).
  const rc = opts.resourceConstraints ?? {};
  for (const [resource, constraint] of Object.entries(rc)) {
    if (constraint.mode === "unlimited") continue;
    if (!consumedBy.has(resource) && constraint.mode !== "excluded") continue;
    // Constraint row applies to consumption of `resource`.
    const key = `raw_${resource}`;
    if (constraint.mode === "excluded") model.constraints[key] = { max: 0 };
    else if (constraint.mode === "max") model.constraints[key] = { max: constraint.value };
    else if (constraint.mode === "min") model.constraints[key] = { min: constraint.value };
    else if (constraint.mode === "exact") model.constraints[key] = { equal: constraint.value };
  }

  // Objective coefficients depend on the chosen objective.
  const objective = opts.objective ?? { kind: "min-buildings" };
  const objCoef = (rec: NonNullable<ReturnType<typeof perMachine.get>>): number => {
    switch (objective.kind) {
      case "min-buildings":
        return 1; // each machine costs 1 building
      case "min-resource":
        return rec.ingredientRates.get(objective.resource) ?? 0;
      case "min-all-raw": {
        let sum = 0;
        for (const [item, rate] of rec.ingredientRates) {
          if (!productsWithRecipe.has(item)) sum += rate; // count only raws
        }
        return sum;
      }
      case "min-byproducts": {
        let sum = 0;
        for (const rate of rec.byproductRates.values()) sum += rate;
        return sum;
      }
    }
  };

  /* Populate variables. */

  for (const [recipeName, rec] of perMachine) {
    const cols: Record<string, number> = {
      objective: objCoef(rec)
    };
    // Contributes +mainRate to prod_{mainProduct}
    if (productsWithRecipe.has(rec.mainProduct)) {
      cols[`prod_${rec.mainProduct}`] = (cols[`prod_${rec.mainProduct}`] ?? 0) + rec.mainRate;
    }
    // Contributes +byproductRate to prod_{byproduct}
    for (const [bp, rate] of rec.byproductRates) {
      if (productsWithRecipe.has(bp)) {
        cols[`prod_${bp}`] = (cols[`prod_${bp}`] ?? 0) + rate;
      }
    }
    // Consumption: contributes -ingredientRate to prod_{ingredient} if it's a product with recipes.
    for (const [ing, rate] of rec.ingredientRates) {
      if (productsWithRecipe.has(ing)) {
        cols[`prod_${ing}`] = (cols[`prod_${ing}`] ?? 0) - rate;
      }
      // For raw resources with user constraints, contributes +rate to raw_{ing}.
      const rawRow = `raw_${ing}`;
      if (model.constraints[rawRow]) {
        cols[rawRow] = (cols[rawRow] ?? 0) + rate;
      }
    }
    model.variables[recipeName] = cols;
  }

  return {
    model,
    recipeMap: { perMachine, producedBy, consumedBy }
  };
}

/* ------------------------------ result build ------------------------------ */

function synthesizeResult(
  productsMap: ProductsMap,
  recipeMap: RecipeMap,
  solution: Record<string, number | boolean>,
  target: string,
  targetPpm: number
): CalculationResult {
  // Pull recipe rates (variables > 0) from the solution. Filter recipes whose
  // machine allocation is less than 1% of a machine — those are almost always
  // simplex artifacts or degenerate "free stuff" chains that clutter the graph
  // without contributing meaningfully to the plan.
  const recipeRates = new Map<string, number>();
  const NOISE_THRESHOLD = 0.01;
  for (const [key, value] of Object.entries(solution)) {
    if (key === "feasible" || key === "result" || key === "bounded") continue;
    if (typeof value === "number" && value > NOISE_THRESHOLD) recipeRates.set(key, value);
  }

  const rawResources: Record<string, number> = {};
  const machines: Record<string, number> = {};
  const byproductsProduced: Record<string, { displayName: string; produced: number }> = {};
  const productProduction: Record<string, number> = {};
  const productConsumption: Record<string, number> = {};
  const productionByRecipe: Record<string, Record<string, number>> = {};

  const productsWithRecipe = new Set(recipeMap.producedBy.keys());

  for (const [recipeName, machineCount] of recipeRates) {
    const rec = recipeMap.perMachine.get(recipeName);
    if (!rec) continue;
    machines[rec.producedIn] = (machines[rec.producedIn] ?? 0) + machineCount;

    // Main product production.
    productProduction[rec.mainProduct] = (productProduction[rec.mainProduct] ?? 0) + rec.mainRate * machineCount;

    // Byproducts.
    for (const [bp, rate] of rec.byproductRates) {
      const bpPpm = rate * machineCount;
      const entry = productsMap[bp];
      const displayName = entry?.displayName ?? bp.replace(/^Desc_/, "").replace(/_C$/, "");
      const cur = byproductsProduced[bp] ?? { displayName, produced: 0 };
      cur.produced += bpPpm;
      byproductsProduced[bp] = cur;
      productProduction[bp] = (productProduction[bp] ?? 0) + bpPpm;
    }

    // Consumption + raw resources.
    for (const [ing, rate] of rec.ingredientRates) {
      const consumed = rate * machineCount;
      productConsumption[ing] = (productConsumption[ing] ?? 0) + consumed;
      if (!productsWithRecipe.has(ing)) {
        rawResources[ing] = (rawResources[ing] ?? 0) + consumed;
      }
      productionByRecipe[ing] = productionByRecipe[ing] ?? {};
      productionByRecipe[ing][recipeName] = (productionByRecipe[ing][recipeName] ?? 0) + consumed;
    }
  }

  // Build a display tree by walking from the target: at each product, pick the
  // recipe with the largest contribution to it (arbitrary tie-break). This is
  // just for tree rendering — the real answer is the flat recipe rate table.
  const tree = buildTreeFromLP(productsMap, recipeMap, recipeRates, target, targetPpm, new Set());

  // Byproduct summary.
  const byproducts = Object.entries(byproductsProduced).map(([item, v]) => {
    const consumed = Math.min(v.produced, productConsumption[item] ?? 0);
    return {
      item,
      displayName: v.displayName,
      produced: v.produced,
      consumed,
      unclaimed: Math.max(0, v.produced - consumed)
    };
  });

  return {
    tree,
    rawResources,
    machines,
    byproducts,
    infeasible: null
  };
}

function buildTreeFromLP(
  productsMap: ProductsMap,
  recipeMap: RecipeMap,
  recipeRates: Map<string, number>,
  product: string,
  demandPpm: number,
  visiting: Set<string>
): CalculationNode {
  const entry = productsMap[product];
  const displayName = entry?.displayName ?? product.replace(/^Desc_/, "").replace(/_C$/, "");

  const producers = (recipeMap.producedBy.get(product) ?? []).filter((n) => recipeRates.has(n));

  if (producers.length === 0 || visiting.has(product)) {
    return {
      product,
      displayName,
      ppm: demandPpm,
      isRawResource: true,
      recipe: null,
      ingredients: []
    };
  }

  // Pick the largest-flow producer at this node for the tree.
  let bestRecipe = producers[0];
  let bestFlow = 0;
  for (const recipeName of producers) {
    const rec = recipeMap.perMachine.get(recipeName)!;
    const flow = (recipeRates.get(recipeName) ?? 0) * rec.mainRate;
    if (flow > bestFlow) {
      bestFlow = flow;
      bestRecipe = recipeName;
    }
  }

  const rec = recipeMap.perMachine.get(bestRecipe)!;
  const machineCount = recipeRates.get(bestRecipe) ?? 0;
  const perMachineMainRate = rec.mainRate;
  const recipeByproducts = Array.from(rec.byproductRates.entries()).map(([item, rate]) => {
    const bpEntry = productsMap[item];
    return {
      item,
      displayName: bpEntry?.displayName ?? item.replace(/^Desc_/, "").replace(/_C$/, ""),
      ppm: rate * machineCount
    };
  });

  const nextVisiting = new Set(visiting);
  nextVisiting.add(product);

  const ingredients: CalculationNode[] = [];
  for (const [ing, rate] of rec.ingredientRates) {
    const ingDemand = rate * machineCount;
    ingredients.push(buildTreeFromLP(productsMap, recipeMap, recipeRates, ing, ingDemand, nextVisiting));
  }

  return {
    product,
    displayName,
    ppm: perMachineMainRate * machineCount,
    isRawResource: false,
    recipe: {
      recipeName: rec.recipe.recipeName,
      displayName: rec.recipe.displayName,
      producedIn: rec.producedIn,
      machineCount,
      baseAmount: rec.recipe.amount,
      manufacturingDuration: rec.recipe.manufacturingDuration,
      byproducts: recipeByproducts
    },
    ingredients
  };
}

/* -------------------------------- helpers -------------------------------- */

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key) ?? [];
  arr.push(value);
  map.set(key, arr);
}

function guessInfeasibleReason(
  opts: LPOptions
): "no-recipe-avoids-excluded" | "no-recipe-avoids-byproducts" | "no-recipe" {
  const rc = opts.resourceConstraints ?? {};
  if (Object.values(rc).some((c) => c.mode === "excluded" || c.mode === "max" || c.mode === "exact"))
    return "no-recipe-avoids-excluded";
  if (opts.rejectByproductRecipes) return "no-recipe-avoids-byproducts";
  return "no-recipe";
}

function emptyInfeasible(
  product: string,
  reason: "no-recipe-avoids-excluded" | "no-recipe-avoids-byproducts" | "no-recipe"
): CalculationResult {
  return {
    tree: null,
    rawResources: {},
    machines: {},
    byproducts: [],
    infeasible: { reason, product }
  };
}
