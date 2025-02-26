import { convertStringFieldsOJsonToNumber, assertRecipeJsonObject } from "@/types";
import { access, readFile, writeFile } from "fs/promises";

export async function splitRecipes() {
    try {
        await access("Docs-utf8.json");
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
            console.error("Docs-utf8.json not found");
            throw e
        }
        throw e
    }
    const json = await readFile("Docs-utf8.json", "utf-8");
    const recipes: { [str: string]: any } = {};
    const altRecipes: { [str: string]: any } = {};
    const allRecipes: { [str: string]: any } = {};
    for (const obj of JSON.parse(json)) {
        if (obj.NativeClass === "/Script/CoreUObject.Class'/Script/FactoryGame.FGRecipe'") {
            for (const recipe of obj.Classes) {
                convertStringFieldsOJsonToNumber(recipe);
                assertRecipeJsonObject(recipe)
                if (recipe.ClassName.startsWith("Recipe_Alternate")) {
                    altRecipes[recipe.ClassName] = recipe;
                } else {
                    recipes[recipe.ClassName] = recipe;
                }
                allRecipes[recipe.ClassName] = recipe;
            }
        }
    }
    return {
        recipes,
        altRecipes,
        allRecipes
    }
}
