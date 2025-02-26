import { writeFile } from "fs/promises";
import { splitRecipes } from "./split-recipes";
import { Recipe } from "@/types";
import { productToRecipesAndRecipeToProductsCreation } from "./product-to-recipe-conversion";
import { extractItemClassObjects, itemToRecipe } from "./util";

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


export async function GET(req: Request) {
  const finalRecipes = await makeRecipe();
  await writeFile("recipes-to-ingredients.json", JSON.stringify(finalRecipes, null, 2));
  return Response.json(finalRecipes);
}

export async function makeRecipe() {
  const { allRecipes } = await splitRecipes();
  const { recipeToProducts } = await productToRecipesAndRecipeToProductsCreation();
  const finalRecipes: Recipe = {};
  for (const recipe of Object.values(allRecipes)) {
    if (!recipe.ClassName.endsWith("_C")) console.log("Not a recipe: ", recipe.ClassName);
    const className = recipe.ClassName;
    const extractedIngredients = extractItemClassObjects(recipe.mIngredients)
    if (!extractedIngredients) {
      console.error("Ingredients not found for recipe: ", recipe.ClassName);
      continue;
    }
    const extractedProduct = extractItemClassObjects(recipe.mProduct);
    if (!extractedProduct) {
      console.error("Product not found for recipe: ", recipe.ClassName);
      continue;
    }
    const ingredients = Object.entries(extractedIngredients.all).map(([ingredient, amount]) => {
      if (!recipeToProducts[ingredient]) {
        console.error("Ingredient not found in recipeToProducts: ", ingredient);
        return { item: ingredient, amount };
      }
      return { item: recipeToProducts[ingredient].mainProduct, amount };
    })
    const producedIn = recipe.mProducedIn ? parseProducedIn(recipe.mProducedIn)[0] : "";
    finalRecipes[className] = {
      displayName: recipe.mDisplayName,
      ingredients,
      producedIn,
      amount: extractedProduct.firstAmount
    };
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


  return finalRecipes;
}
