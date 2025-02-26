import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";
import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, ProductToRecipeRaw, assertRecipeJsonObject, convertProductToRecipeRawToProductToRecipe, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const { productToRecipes, recipeToProducts } = await productToRecipesAndRecipeToProductsCreation();
  await writeFile("product-to-recipe.json", JSON.stringify(productToRecipes, null, 2));
  await writeFile("recipe-to-products.json", JSON.stringify(recipeToProducts, null, 2));
  return Response.json("");
}
