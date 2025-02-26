import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";
import { makeRecipe } from "@/parsing/recipes-to-ingredients";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const finalRecipes = await makeRecipe();
  await writeFile("parsed-typesafe-recipes.json", JSON.stringify(finalRecipes, null, 2));
  return Response.json("");
}
