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
  [str: string]: string[];
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
