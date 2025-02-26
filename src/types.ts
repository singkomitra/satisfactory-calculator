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

// mainRecipe is the first recipe in the list, altRecipes are the rest
// key: product name -> value: main recipe and alternative recipes
export type ProductToRecipe = {
  [str: string]: {
    mainRecipe: string;
    altRecipes: string[];
  };
};
// key: product name -> value: recipe names
export type ProductToRecipeRaw = {
  [str: string]: string[];
};
// key: recipe name -> value: main product and byproducts
export type RecipeToProducts = {
  [str: string]: {
    mainProduct: string;
    byproducts: string[];
  };
};
export type Recipe = {
  [str: string]: {
    displayName: string;
    ingredients: { item: string; amount: number }[];
    amount: number;
    producedIn: string;
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

export function assertItemDescriptorsRaw(obj: any): asserts obj is ItemDescriptorsRaw {
  if (typeof obj !== "object") {
    throwError("ItemDescriptorsRaw", "obj", "object", obj);
  }
  if (typeof obj.ClassName !== "string") {
    throwError("ItemDescriptorsRaw", "ClassName", "string", obj.ClassName);
  }
  if (typeof obj.mDisplayName !== "string") {
    throwError("ItemDescriptorsRaw", "mDisplayName", "string", obj.mDisplayName);
  }
  if (typeof obj.mDescription !== "string") {
    throwError("ItemDescriptorsRaw", "mDescription", "string", obj.mDescription);
  }
  if (typeof obj.mAbbreviatedDisplayName !== "string") {
    throwError("ItemDescriptorsRaw", "mAbbreviatedDisplayName", "string", obj.mAbbreviatedDisplayName);
  }
  if (typeof obj.mStackSize !== "string") {
    throwError("ItemDescriptorsRaw", "mStackSize", "string", obj.mStackSize);
  }
  if (typeof obj.mCanBeDiscarded !== "string") {
    throwError("ItemDescriptorsRaw", "mCanBeDiscarded", "string", obj.mCanBeDiscarded);
  }
  if (typeof obj.mRememberPickUp !== "string") {
    throwError("ItemDescriptorsRaw", "mRememberPickUp", "string", obj.mRememberPickUp);
  }
  if (typeof obj.mEnergyValue !== "number") {
    throwError("ItemDescriptorsRaw", "mEnergyValue", "number", obj.mEnergyValue);
  }
  if (typeof obj.mRadioactiveDecay !== "number") {
    throwError("ItemDescriptorsRaw", "mRadioactiveDecay", "number", obj.mRadioactiveDecay);
  }
  if (typeof obj.mForm !== "string") {
    throwError("ItemDescriptorsRaw", "mForm", "string", obj.mForm);
  }
  if (typeof obj.mGasType !== "string") {
    throwError("ItemDescriptorsRaw", "mGasType", "string", obj.mGasType);
  }
  if (typeof obj.mSmallIcon !== "string") {
    throwError("ItemDescriptorsRaw", "mSmallIcon", "string", obj.mSmallIcon);
  }
  if (typeof obj.mPersistentBigIcon !== "string") {
    throwError("ItemDescriptorsRaw", "mPersistentBigIcon", "string", obj.mPersistentBigIcon);
  }
  if (typeof obj.mCrosshairMaterial !== "string") {
    throwError("ItemDescriptorsRaw", "mCrosshairMaterial", "string", obj.mCrosshairMaterial);
  }
  if (typeof obj.mDescriptorStatBars !== "string") {
    throwError("ItemDescriptorsRaw", "mDescriptorStatBars", "string", obj.mDescriptorStatBars);
  }
  if (typeof obj.mIsAlienItem !== "string") {
    throwError("ItemDescriptorsRaw", "mIsAlienItem", "string", obj.mIsAlienItem);
  }
  if (typeof obj.mSubCategories !== "string") {
    throwError("ItemDescriptorsRaw", "mSubCategories", "string", obj.mSubCategories);
  }
  if (typeof obj.mMenuPriority !== "number") {
    throwError("ItemDescriptorsRaw", "mMenuPriority", "number", obj.mMenuPriority);
  }
  if (typeof obj.mFluidColor !== "string") {
    throwError("ItemDescriptorsRaw", "mFluidColor", "string", obj.mFluidColor);
  }
  if (typeof obj.mGasColor !== "string") {
    throwError("ItemDescriptorsRaw", "mGasColor", "string", obj.mGasColor);
  }
  if (typeof obj.mCompatibleItemDescriptors !== "string") {
    throwError("ItemDescriptorsRaw", "mCompatibleItemDescriptors", "string", obj.mCompatibleItemDescriptors);
  }
  if (typeof obj.mClassToScanFor !== "string") {
    throwError("ItemDescriptorsRaw", "mClassToScanFor", "string", obj.mClassToScanFor);
  }
  if (typeof obj.mScannableType !== "string") {
    throwError("ItemDescriptorsRaw", "mScannableType", "string", obj.mScannableType);
  }
  if (typeof obj.mShouldOverrideScannerDisplayText !== "string") {
    throwError(
      "ItemDescriptorsRaw",
      "mShouldOverrideScannerDisplayText",
      "string",
      obj.mShouldOverrideScannerDisplayText
    );
  }
  if (typeof obj.mScannerDisplayText !== "string") {
    throwError("ItemDescriptorsRaw", "mScannerDisplayText", "string", obj.mScannerDisplayText);
  }
  if (typeof obj.mScannerLightColor !== "string") {
    throwError("ItemDescriptorsRaw", "mScannerLightColor", "string", obj.mScannerLightColor);
  }
  if (typeof obj.mNeedsPickUpMarker !== "string") {
    throwError("ItemDescriptorsRaw", "mNeedsPickUpMarker", "string", obj.mNeedsPickUpMarker);
  }
  if (typeof obj.mResourceSinkPoints !== "number") {
    throwError("ItemDescriptorsRaw", "mResourceSinkPoints", "number", obj.mResourceSinkPoints);
  }
}

export function assertRecipe(obj: any): asserts obj is Recipe {
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
