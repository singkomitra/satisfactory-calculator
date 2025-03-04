import { makeRecipe } from "./recipes-to-ingredients";
import { productToRecipesAndRecipeToProductsCreation } from "./product-to-recipe-conversion";
import { getItemAndResourceDescriptors } from "./get-resource-and-item-descriptors";
import { ProductsMap } from "@/types";

export async function createProductsMap() {
  const recipes = await makeRecipe();
  const { productToRecipes, recipeToProducts } = await productToRecipesAndRecipeToProductsCreation();
  const { resourceDescriptors, itemDescriptors } = await getItemAndResourceDescriptors();

  // itemDescriptors: all items (not complete yet)
  // resourceDescriptors: all raw resources
  // productToRecipes: provides mapping of item to main recipe and alt recipes
  // recipeToProducts: provides mapping of recipe name to main product name and byproducts
  // recipes: provides mapping of recipe name to ingredients and amount

  const productsMap: ProductsMap = {};

  // loop through all possible items
  for (const item in itemDescriptors) {
    const itemDescriptor = itemDescriptors[item];
    // className is the item name (e.g. "Desc_CopperIngot_C")
    const className = itemDescriptor.className;
    // check if there are recipes for this item
    if (!productToRecipes[className]) {
      // console.error("No recipe found for item: ", className);
      continue;
    }
    const recipeNames = productToRecipes[className];
    // get the main recipe name for this item (e.g. "Recipe_CopperIngot_C")
    const mainRecipeName = recipeNames.mainRecipe;
    // check if the main recipe exists in recipes map
    if (!recipes[mainRecipeName]) {
      // console.error("Recipe not found in recipes: ", mainRecipeName);
      continue;
    }
    // get the main recipe for this item
    const mainRecipe = recipes[mainRecipeName];
    // extend ingredients from mainRecipe to include isRawResource
    const extendedIngredients = mainRecipe.ingredients.map((ingredient) => {
      const isRawResource = resourceDescriptors[ingredient.item] ? true : false;
      return {
        item: ingredient.item,
        amount: ingredient.amount,
        isRawResource: isRawResource
      };
    });

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
            amount: ingredient.amount,
            isRawResource: isRawResource
          };
        });
        return {
          recipeName,
          displayName: recipe.displayName,
          ingredients: extendedIngredients,
          producedIn: recipe.producedIn,
          amount: recipe.amount
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
        amount: mainRecipe.amount
      },
      altRecipes
    };
  }

  return productsMap;
}
