import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, assertRecipeJsonObject, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("Docs-utf8.json", "utf-8");
  let final = "";
  const recipes: { [str: string]: any } = {};
  const altRecipes: { [str: string]: any } = {};
  const productToRecipe: ProductToRecipe = {};

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

        const products = extractItemClassForProduct(recipe.mProduct);
        if (products) {
          for (const [product] of Object.entries(products)) {
            if (!productToRecipe[product]) {
              productToRecipe[product] = [];
            }
            productToRecipe[product].push(recipe.ClassName);
          }
        }
      }
    }
  }
  await writeFile("product-to-recipe.json", JSON.stringify(productToRecipe, null, 2), "utf-8");
  await writeFile("recipes.json", JSON.stringify(recipes, null, 2), "utf-8");
  await writeFile("alt-recipes.json", JSON.stringify(altRecipes, null, 2), "utf-8");
  return Response.json(final);
}
