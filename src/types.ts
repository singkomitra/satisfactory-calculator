export type RecipeJsonObject = {
  ClassName: string;
  FullName: string;
  mDisplayName: string;
  mIngredients: string;
  mProduct: string;
  mManufacturingMenuPriority: number;
  mManualManufacturingMultiplier: number;
  mProducedIn: string;
  mRelevantEvents: string;
  mVariablePowerConsumptionConstant: number;
  mVariablePowerConsumptionFactor: number;
};

export type ProductToRecipe = {
  [str: string]: {
    mainRecipe: string;
    altRecipes: string[];
  }
}
export type ProductToRecipeRaw = {
  [str: string]: string[];
}
export type RecipeToProducts = {
  [str: string]: {
    mainProduct: string;
    byproducts: string[];
  };
}
export type RecipeToIngredients = {
  [str: string]: {
    displayName: string;
    ingredients: { item: string; amount: number }[];
    producedIn: string;
  };
}

export function assertReciptToIngredients(obj: any) {
  if (typeof obj !== "object") {
    throwError("RecipeToIngredients", "obj", "object", obj);
  }
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      throwError("RecipeToIngredients", key, "object", obj[key]);
    }
    if (typeof obj[key].displayName !== "string") {
      throwError("RecipeToIngredients", `${key}.displayName`, "string", obj[key].displayName);
    }
    if (!Array.isArray(obj[key].ingredients)) {
      throwError("RecipeToIngredients", `${key}.ingredients`, "array", obj[key].ingredients);
    }
    for (const ingredient of obj[key].ingredients) {
      if (typeof ingredient.item !== "string") {
        throwError("RecipeToIngredients", `${key}.ingredients.item`, "string", ingredient.item);
      }
      if (typeof ingredient.amount !== "number") {
        throwError("RecipeToIngredients", `${key}.ingredients.amount`, "number", ingredient.amount);
      }
    }
    if (typeof obj[key].producedIn !== "string") {
      throwError("RecipeToIngredients", `${key}.producedIn`, "string", obj[key].producedIn);
    }
  }
}
export function convertProductToRecipeRawToProductToRecipe(raw: ProductToRecipeRaw): ProductToRecipe {
  const result: ProductToRecipe = {};
  for (const [product, recipes] of Object.entries(raw)) {
    const mainRecipe = recipes[0];
    const altRecipes = recipes.slice(1);
    result[product] = { mainRecipe, altRecipes };
  }
  return result;
}

export function assertRecipeJsonObject(obj: any) {
  if (typeof obj !== "object") {
    throwError("RecipeJsonObject", "obj", "object", obj);
  }
  if (typeof obj.ClassName !== "string") {
    throwError("RecipeJsonObject", "ClassName", "string", obj.ClassName);
  }
  if (typeof obj.FullName !== "string") {
    throwError("RecipeJsonObject", "FullName", "string", obj.FullName);
  }
  if (typeof obj.mDisplayName !== "string") {
    throwError("RecipeJsonObject", "mDisplayName", "string", obj.mDisplayName);
  }
  if (typeof obj.mIngredients !== "string") {
    throwError("RecipeJsonObject", "mIngredients", "string", obj.mIngredients);
  }
  if (typeof obj.mProduct !== "string") {
    throwError("RecipeJsonObject", "mProduct", "string", obj.mProduct);
  }
  if (typeof obj.mManufacturingMenuPriority !== "number") {
    throwError("RecipeJsonObject", "mManufacturingMenuPriority", "number", obj.mManufacturingMenuPriority);
  }
  if (typeof obj.mManualManufacturingMultiplier !== "number") {
    throwError("RecipeJsonObject", "mManualManufacturingMultiplier", "number", obj.mManualManufacturingMultiplier);
  }
  if (typeof obj.mProducedIn !== "string") {
    throwError("RecipeJsonObject", "mProducedIn", "string", obj.mProducedIn);
  }
  if (typeof obj.mRelevantEvents !== "string") {
    throwError("RecipeJsonObject", "mRelevantEvents", "string", obj.mRelevantEvents);
  }
  if (typeof obj.mVariablePowerConsumptionConstant !== "number") {
    throwError(
      "RecipeJsonObject",
      "mVariablePowerConsumptionConstant",
      "number",
      obj.mVariablePowerConsumptionConstant
    );
  }
  if (typeof obj.mVariablePowerConsumptionFactor !== "number") {
    throwError("RecipeJsonObject", "mVariablePowerConsumptionFactor", "number", obj.mVariablePowerConsumptionFactor);
  }
}
export function convertStringFieldsOJsonToNumber(obj: any) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      if (!isNaN(parseFloat(obj[key]))) {
        obj[key] = parseFloat(obj[key]);
      }
    }
  }
}

export function throwError(obj: string, variable: string, type: string, value: any) {
  throw new Error(`Object '${obj}' must have a '${variable}' ${type} property.\nFound value: ${value}\n`);
}
