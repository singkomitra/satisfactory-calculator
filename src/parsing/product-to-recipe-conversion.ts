import {
  ProductToRecipeRaw,
  RecipeJsonObject,
  RecipeToProducts,
  convertProductToRecipeRawToProductToRecipe
} from "@/types";
import { splitRecipes } from "./split-recipes";
import { extractItemClassObjects } from "./util";

export async function productToRecipesAndRecipeToProductsCreation() {
  const { allRecipes } = await splitRecipes();
  const productToRecipeRaw: ProductToRecipeRaw = {};
  const recipeToProducts: RecipeToProducts = {};
  for (const recipe of Object.values(allRecipes)) {
    const extraction = extractItemClassObjects(recipe.mProduct);
    if (extraction) {
      const { all: products, first: mainProduct } = extraction;
      const byproducts = [];
      for (const product of Object.keys(products)) {
        if (!productToRecipeRaw[product]) {
          productToRecipeRaw[product] = [];
        }
        productToRecipeRaw[product].push(recipe.ClassName);
        if (product !== mainProduct) {
          byproducts.push(product);
        }
      }
      if (!mainProduct) {
        console.error("Main product not found for recipe: ", recipe.ClassName);
        continue;
      }
      if (recipeToProducts[recipe.ClassName]) {
        console.error("Duplicate recipe found: ", recipe.ClassName);
        continue;
      }
      recipeToProducts[recipe.ClassName] = {
        mainProduct,
        byproducts
      };
    }
  }
  return { productToRecipes: convertProductToRecipeRawToProductToRecipe(productToRecipeRaw), recipeToProducts };
}
