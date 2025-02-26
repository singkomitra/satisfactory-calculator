import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, assertRecipeJsonObject, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";
import { splitRecipes } from "./split-recipes";
import { RecipeToIngredients } from "@/types";

function parseProducedIn(mProducedIn: string): string[] {
  let trimmed = mProducedIn.trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    trimmed = trimmed.slice(1, -1);
  }
  const parts = trimmed.split(',');
  return parts.map(part => {
    const cleaned = part.trim().replace(/^"|"$/g, '');

    const segments = cleaned.split('.');
    return segments[segments.length - 1];
  });
}

function replaceExceptions(name: string): string {
  const exceptions: { [key: string]: string } = {
    "Cement": "Concrete",
    "IronIngot": "IngotIron",
    "IronScrew": "Screw",
    "CompactedCoal": "Alternate_EnrichedCoal",
    "TurboFuel": "PackagedTurboFuel",
    "MotorLightweight": "MotorTurbo"
  }
  return exceptions[name] || name;
}

export async function GET(req: Request) {
  const finalRecipes = await recipesToIngredients();
  await writeFile("recipes-to-ingredients.json", JSON.stringify(finalRecipes, null, 2));
  return Response.json(finalRecipes);
}

export async function recipesToIngredients() {
  const { allRecipes, altRecipes } = await splitRecipes();
  const finalRecipes: RecipeToIngredients = {};
  for (const recipe of Object.values(allRecipes)) {
    if (!recipe.ClassName.endsWith("_C")) console.log("Not a recipe: ", recipe.ClassName);
    const className = recipe.ClassName;
    const ingredientsString = recipe.mIngredients;
    const ingredients = [];
    const regex = /ItemClass="[^"]*\/([^\."]+)[^"]*",Amount=([0-9]+)/g;
    const producedIn = recipe.mProducedIn ? parseProducedIn(recipe.mProducedIn)[0] : "";
    let match;
    while ((match = regex.exec(ingredientsString)) !== null) {
      const cleanedName = match[1].replace(/^(Desc_|BP_ItemDescriptor)/, '');
      const itemName = `Recipe_${replaceExceptions(cleanedName)}_C`;
      ingredients.push({ item: itemName, amount: parseInt(match[2]) });
    }
    finalRecipes[className] = {
      displayName: recipe.mDisplayName,
      ingredients,
      producedIn
    };
  }
  for (const key in altRecipes) {
    const recipe = altRecipes[key];
    if (!recipe.ClassName.endsWith("_C")) console.log("Not a recipe: ", recipe.ClassName);
    const className = recipe.ClassName;
    const ingredientsString = recipe.mIngredients;
    const ingredients = [];
    const regex = /ItemClass="[^"]*\/([^\."]+)[^"]*",Amount=([0-9]+)/g;
    const producedIn = recipe.mProducedIn ? parseProducedIn(recipe.mProducedIn)[0] : "";
    let match;
    while ((match = regex.exec(ingredientsString)) !== null) {
      const cleanedName = match[1].replace(/^(Desc_|BP_ItemDescriptor)/, '');
      const itemName = `Recipe_${replaceExceptions(cleanedName)}_C`;
      ingredients.push({ item: itemName, amount: parseInt(match[2]) });
    }
    finalRecipes[className] = {
      displayName: recipe.mDisplayName,
      ingredients,
      producedIn
    };
  }

  // add missing recipes
  finalRecipes["Recipe_LiquidTurboFuel_C"] = {
    displayName: "Turbofuel",
    ingredients: [
      { item: "Recipe_FuelLiquid_C", amount: 6000 },
      { item: "Recipe_Alternate_EnrichedCoal_C", amount: 4 } // exception: CompactedCoal -> Alternate_EnrichedCoal
    ],
  }

  const missingRecipes = new Set<string>();

  for (const recipeKey in finalRecipes) {
    const recipe = finalRecipes[recipeKey];
    for (const ingredient of recipe.ingredients) {
      if (!finalRecipes[ingredient.item]) {
        missingRecipes.add(ingredient.item);
      }
    }
  }

  console.log("Missing recipes:");
  for (const missing of missingRecipes) {
    console.log(missing);
  }

  await writeFile("recipes-to-ingredients.json", JSON.stringify(finalRecipes, null, 2));
  return Response.json(finalRecipes);
  return finalRecipes;
}
