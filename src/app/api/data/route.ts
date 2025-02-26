import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";
import { recipesToIngredientsToProductsConversion } from "@/parsing/recipes-to-ingredients-to-products-conversion";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const { productToRecipes, recipeToProducts } = await productToRecipesAndRecipeToProductsCreation();
  await writeFile("product-to-recipes.json", JSON.stringify(productToRecipes, null, 2));
  await writeFile("recipe-to-products.json", JSON.stringify(recipeToProducts, null, 2));
  const recipes = await recipesToIngredientsToProductsConversion();
  await writeFile("recipes-to-ingredients-to-products.json", JSON.stringify(recipes, null, 2));
  return Response.json("");
}
