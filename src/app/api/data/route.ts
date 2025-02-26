import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";
import { recipesToIngredients } from "@/parsing/recipes-to-ingredients";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const finalRecipes = await recipesToIngredients();
  await writeFile("recipes-to-ingredients.json", JSON.stringify(finalRecipes, null, 2));
  return Response.json("");
}
