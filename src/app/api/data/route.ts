import { productToRecipeAndRecipeToProductCreation } from "@/parsing/product-to-recipe-conversion";
import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, ProductToRecipeRaw, assertRecipeJsonObject, convertProductToRecipeRawToProductToRecipe, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const { productToRecipe, recipeToProducts } = await productToRecipeAndRecipeToProductCreation();
  return Response.json("");
}
