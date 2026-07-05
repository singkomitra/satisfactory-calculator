import { makeRecipe } from "./recipes-to-ingredients";
import { productToRecipesAndRecipeToProductsCreation } from "./product-to-recipe-conversion";
import { getItemAndResourceDescriptors } from "./get-resource-and-item-descriptors";
import { ProductsMap } from "@/types";

export async function createProductsMap() {
  const recipes = await makeRecipe();
  const { productToRecipes } = await productToRecipesAndRecipeToProductsCreation();
  const { resourceDescriptors, itemDescriptors } = await getItemAndResourceDescriptors();

  // Fluid amounts in the raw game data are stored as milliliters (×1000 of the
  // in-game display value). Normalize everything to display units up-front so
  // machine counts and byproduct rates work out.
  const isFluid = (item: string): boolean => {
    const d = itemDescriptors[item] ?? resourceDescriptors[item];
    if (!d) return false;
    return d.form === "RF_LIQUID" || d.form === "RF_GAS";
  };
  const norm = (item: string, amount: number) => (isFluid(item) ? amount / 1000 : amount);

  const productsMap: ProductsMap = {};

  // loop through all possible items
  for (const item in itemDescriptors) {
    const itemDescriptor = itemDescriptors[item];
    // className is the item name (e.g. "Desc_CopperIngot_C")
    const className = itemDescriptor.className;
    // check if there are recipes for this item
    if (!productToRecipes[className]) {
      console.error("No recipe found for item: ", className);
      continue;
    }
    const recipeNames = productToRecipes[className];
    // get the main recipe name for this item (e.g. "Recipe_CopperIngot_C")
    const mainRecipeName = recipeNames.mainRecipe;
    // check if the main recipe exists in recipes map
    if (!recipes[mainRecipeName]) {
      console.error("Recipe not found in recipes: ", mainRecipeName);
      continue;
    }
    // get the main recipe for this item
    const mainRecipe = recipes[mainRecipeName];
    // extend ingredients from mainRecipe to include isRawResource
    const extendedIngredients = mainRecipe.ingredients.map((ingredient) => {
      const isRawResource = resourceDescriptors[ingredient.item] ? true : false;
      return {
        item: ingredient.item,
        amount: norm(ingredient.item, ingredient.amount),
        isRawResource
      };
    });
    const mainAmount = norm(className, mainRecipe.amount);
    // recipe.ppm scales linearly with amount; renormalize.
    const mainPpm = mainRecipe.manufacturingDuration === 0 ? 0 : (60 / mainRecipe.manufacturingDuration) * mainAmount;
    const mainByproducts = (mainRecipe.byproducts ?? []).map((b) => ({
      item: b.item,
      amount: norm(b.item, b.amount)
    }));

    // loop through all alt recipes for this item and extend ingredients
    const altRecipes = productToRecipes[className].altRecipes
      .map((recipeName) => {
        if (!recipes[recipeName]) {
          console.error("Product not found in recipeToProducts: ", recipeName);
          return null;
        }
        const recipe = recipes[recipeName];
        const extendedIngredients = recipe.ingredients.map((ingredient) => {
          const isRawResource = resourceDescriptors[ingredient.item] ? true : false;
          return {
            item: ingredient.item,
            amount: norm(ingredient.item, ingredient.amount),
            isRawResource
          };
        });
        const altAmount = norm(className, recipe.amount);
        const altPpm = recipe.manufacturingDuration === 0 ? 0 : (60 / recipe.manufacturingDuration) * altAmount;
        const altByproducts = (recipe.byproducts ?? []).map((b) => ({
          item: b.item,
          amount: norm(b.item, b.amount)
        }));
        return {
          recipeName,
          displayName: recipe.displayName,
          ingredients: extendedIngredients,
          producedIn: recipe.producedIn,
          amount: altAmount,
          manufacturingDuration: recipe.manufacturingDuration,
          ppm: altPpm,
          byproducts: altByproducts
        };
      })
      .filter((recipe): recipe is NonNullable<typeof recipe> => recipe !== null);

    productsMap[className] = {
      displayName: itemDescriptor.displayName,
      mainRecipe: {
        recipeName: mainRecipeName,
        displayName: mainRecipe.displayName,
        ingredients: extendedIngredients,
        producedIn: mainRecipe.producedIn,
        amount: mainAmount,
        manufacturingDuration: mainRecipe.manufacturingDuration,
        ppm: mainPpm,
        byproducts: mainByproducts
      },
      altRecipes
    };
  }

  return productsMap;
}
