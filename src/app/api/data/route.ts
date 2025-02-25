import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("Docs-utf8.json", "utf-8");
  let final = "";
  let recipes: { [str: string]: any } = {};
  let altRecipes: { [str: string]: any } = {};

  for (const obj of JSON.parse(json)) {
    if (obj.NativeClass === "/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'") {
      final = JSON.stringify(obj, null, 2);
      await writeFile("all-recipes.json", final, "utf-8");
      for (const recipe of obj.Classes) {
        if (recipe.ClassName.startsWith("Recipe_Alternate")) {
          altRecipes[recipe.ClassName] = recipe;
        } else {
          recipes[recipe.ClassName] = recipe;
        }
      }
    }
  }
  await writeFile("recipes.json", JSON.stringify(recipes, null, 2), "utf-8");
  await writeFile("alt-recipes.json", JSON.stringify(altRecipes, null, 2), "utf-8");
  return Response.json(final);
}
