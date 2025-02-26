import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, ProductToRecipeRaw, assertRecipeJsonObject, convertProductToRecipeRawToProductToRecipe, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("Docs-utf8.json", "utf-8");
  let final = "";
  const recipes: { [str: string]: any } = {};
  const altRecipes: { [str: string]: any } = {};
  const productToRecipeRaw: ProductToRecipeRaw = {};
  const recipeToProduct: { [str: string]: string } = {};

  for (const obj of JSON.parse(json)) {
    if (obj.NativeClass === "/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'") {
      final = JSON.stringify(obj, null, 2);
      await writeFile("all-recipes.json", final, "utf-8");
      for (const recipe of obj.Classes) {
        convertStringFieldsOJsonToNumber(recipe);
        assertRecipeJsonObject(recipe)
        if (recipe.ClassName.startsWith("Recipe_Alternate")) {
          altRecipes[recipe.ClassName] = recipe;
        } else {
          recipes[recipe.ClassName] = recipe;
        }

        const extraction = extractItemClassForProduct(recipe.mProduct);
        if (extraction) {
          const { products, mainProduct } = extraction;
          for (const product of Object.keys(products)) {
            if (!productToRecipeRaw[product]) {
              productToRecipeRaw[product] = []
            }
            productToRecipeRaw[product].push(recipe.ClassName);
          }
          if (!mainProduct) {
            console.error("Main product not found for recipe: ", recipe.ClassName);
            continue;
          }
          if (recipeToProduct[recipe.ClassName]) {
            console.error("Duplicate recipe found: ", recipe.ClassName);
            continue;
          }
          recipeToProduct[recipe.ClassName] = mainProduct;
        }
      }
    }
  }

  await writeFile("recipe-to-product.json", JSON.stringify(recipeToProduct, null, 2), "utf-8");
  await writeFile("product-to-recipe.json", JSON.stringify(convertProductToRecipeRawToProductToRecipe(productToRecipeRaw), null, 2), "utf-8");
  await writeFile("recipes.json", JSON.stringify(recipes, null, 2), "utf-8");
  await writeFile("alt-recipes.json", JSON.stringify(altRecipes, null, 2), "utf-8");
  return Response.json(final);
}
