import { convertStringFieldsOJsonToNumber, assertRecipeJsonObject, RecipeJsonObject } from "@/types";
import { access, readFile, writeFile } from "fs/promises";
import { getJSONDirectory } from "./util";
import { join } from "path";

export async function splitRecipes() {
  const mainJsonFilepath = join(getJSONDirectory(), "Docs-utf8.json");
  try {
    await access(mainJsonFilepath);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("Docs-utf8.json not found");
      throw e;
    }
    throw e;
  }
  const json = await readFile(mainJsonFilepath, "utf-8");
  const recipes: { [key: string]: RecipeJsonObject } = {};
  const altRecipes: typeof recipes = {};
  const allRecipes: typeof recipes = {};
  for (const obj of JSON.parse(json)) {
    if (obj.NativeClass === "/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'") {
      for (const recipe of obj.Classes) {
        convertStringFieldsOJsonToNumber(recipe);
        assertRecipeJsonObject(recipe);
        if (recipe.ClassName.startsWith("Recipe_Alternate")) {
          altRecipes[recipe.ClassName] = recipe;
        } else {
          recipes[recipe.ClassName] = recipe;
        }
        allRecipes[recipe.ClassName] = recipe;
      }
    }
  }
  await writeFile(join(getJSONDirectory(), "recipes.json"), JSON.stringify(recipes, null, 2));
  await writeFile(join(getJSONDirectory(), "alt-recipes.json"), JSON.stringify(altRecipes, null, 2));
  await writeFile(join(getJSONDirectory(), "all-recipes.json"), JSON.stringify(allRecipes, null, 2));
  return {
    recipes,
    altRecipes,
    allRecipes
  };
}
