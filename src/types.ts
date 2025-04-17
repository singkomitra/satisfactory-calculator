export type RecipeJsonObject = {
  ClassName: string;
  FullName: string;
  mDisplayName: string;
  mIngredients: string;
  mProduct: string;
  mManufactoringDuration: number;
  mManufacturingMenuPriority: number;
  mManualManufacturingMultiplier: number;
  mProducedIn: string;
  mRelevantEvents: string;
  mVariablePowerConsumptionConstant: number;
  mVariablePowerConsumptionFactor: number;
};

export type ItemDescriptor = {
  className: string;
  displayName: string;
  description: string;
  abbreviatedDisplayName: string;
  form: string;
  gasType: string;
  fluidColor: string;
  gasColor: string;
  resourceSinkPoints: number;
  energyValue: number;
  radioactiveDecay: number;
};
// key: product name -> value: recipe names
export type ProductToRecipeRaw = {
  [str: string]: string[];
};
// mainRecipe is the first recipe in the list, altRecipes are the rest
// key: product name -> value: main recipe and alternative recipes
export type ProductToRecipes = {
  [str: string]: {
    mainRecipe: string;
    altRecipes: string[];
  };
};
// key: recipe name -> value: main product and byproducts
export type RecipeToProducts = {
  [str: string]: {
    mainProduct: string;
    byproducts: string[];
  };
};
export type RecipeMap = {
  [str: string]: {
    displayName: string;
    ingredients: { item: string; amount: number }[];
    amount: number;
    producedIn: string;
    manufacturingDuration: number;
    ppm: number;
  };
};
export type ProductsMap = {
  [product: string]: {
    displayName: string;
    mainRecipe: {
      recipeName: string;
      displayName: string;
      ingredients: { item: string; amount: number; isRawResource: boolean }[];
      producedIn: string;
      amount: number;
      manufacturingDuration: number;
      ppm: number;
    };
    altRecipes: {
      recipeName: string;
      displayName: string;
      ingredients: { item: string; amount: number; isRawResource: boolean }[];
      producedIn: string;
      amount: number;
      manufacturingDuration: number;
      ppm: number;
    }[];
  };
};
export type ItemDescriptorsRaw = {
  ClassName: string;
  mDisplayName: string;
  mDescription: string;
  mAbbreviatedDisplayName: string;
  mStackSize: string;
  mCanBeDiscarded: string;
  mRememberPickUp: string;
  mEnergyValue: number;
  mRadioactiveDecay: number;
  mForm: string;
  mGasType: string;
  mSmallIcon: string;
  mPersistentBigIcon: string;
  mCrosshairMaterial: string;
  mDescriptorStatBars: string;
  mIsAlienItem: string;
  mSubCategories: string;
  mMenuPriority: number;
  mFluidColor: string;
  mGasColor: string;
  mCompatibleItemDescriptors: string;
  mClassToScanFor: string;
  mScannableType: string;
  mShouldOverrideScannerDisplayText: string;
  mScannerDisplayText: string;
  mScannerLightColor: string;
  mNeedsPickUpMarker: string;
  mResourceSinkPoints: number;
};

export function assertItemDescriptor(obj: any): asserts obj is ItemDescriptor {
  if (typeof obj !== "object") {
    throwError("ItemDescriptor", "obj", "object", obj);
  }
  if (typeof obj.className !== "string") {
    throwError("ItemDescriptor", "className", "string", obj.className);
  }
  if (typeof obj.displayName !== "string") {
    throwError("ItemDescriptor", "displayName", "string", obj.displayName);
  }
}

export function assertItemDescriptorsRaw(obj: any): asserts obj is ItemDescriptorsRaw {
  if (typeof obj !== "object") {
    throwError("ItemDescriptorsRaw", "obj", "object", obj);
  }
}

export function assertRecipeMap(obj: any): asserts obj is RecipeMap {
  if (typeof obj !== "object") {
    throwError("RecipeToIngredients", "obj", "object", obj);
  }
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      throwError("RecipeToIngredients", key, "object", obj[key]);
    }
    if (typeof obj[key].displayName !== "string") {
      throwError("RecipeToIngredients", "displayName", "string", obj[key].displayName);
    }
    if (!Array.isArray(obj[key].ingredients)) {
      throwError("RecipeToIngredients", "ingredients", "array", obj[key].ingredients);
    }
    if (typeof obj[key].producedIn !== "string") {
      throwError("RecipeToIngredients", "producedIn", "string", obj[key].producedIn);
    }
    if (typeof obj[key].amount !== "number") {
      throwError("RecipeToIngredients", "amount", "number", obj[key].amount);
    }
    if (typeof obj[key].manufacturingDuration !== "number") {
      throwError("RecipeToIngredients", "manufacturingDuration", "number", obj[key].manufacturingDuration);
    }
    if (typeof obj[key].ppm !== "number") {
      throwError("RecipeToIngredients", "ppm", "number", obj[key].ppm);
    }
  }
}
export function convertItemDescriptorsRawToItemDescriptorsMap(raw: { [str: string]: ItemDescriptorsRaw }) {
  const result: { [str: string]: ItemDescriptor } = {};
  for (const [key, value] of Object.entries(raw)) {
    result[key] = {
      className: value.ClassName,
      displayName: value.mDisplayName,
      description: value.mDescription,
      abbreviatedDisplayName: value.mAbbreviatedDisplayName,
      form: value.mForm,
      gasType: value.mGasType,
      fluidColor: value.mFluidColor,
      gasColor: value.mGasColor,
      resourceSinkPoints: value.mResourceSinkPoints,
      energyValue: value.mEnergyValue,
      radioactiveDecay: value.mRadioactiveDecay
    };
  }
  return result;
}
export function convertProductToRecipeRawToItemsMapRecipeParts(raw: ProductToRecipeRaw) {
  const result: ProductToRecipes = {};
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
  if (typeof obj.mManufactoringDuration !== "number") {
    throwError("RecipeJsonObject", "mManufactoringDuration", "number", obj.mManufactoringDuration);
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
