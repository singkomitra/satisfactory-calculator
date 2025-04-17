import {
  ProductToRecipes,
  ProductToRecipeRaw,
  RecipeJsonObject,
  RecipeToProducts,
  convertProductToRecipeRawToItemsMapRecipeParts
} from "@/types";
import { splitRecipes } from "./split-recipes";
import { extractItemClassObjects, getJSONDirectory } from "./util";
import { writeFile } from "fs/promises";
import { join } from "path";

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
  const productToRecipes = await productToRecipeCreation();
  await writeFile(join(getJSONDirectory(), "product-to-recipes.json"), JSON.stringify(productToRecipes, null, 2));

  // const sortedProductToRecipes = Object.keys(productToRecipes)
  // .sort()
  // .reduce((acc: ProductToRecipes, key: string) => {
  //   acc[key] = productToRecipes[key];
  //   acc[key].altRecipes.sort();
  //   return acc;
  // }, {});
  await writeFile(join(getJSONDirectory(), "product-to-recipes.json"), JSON.stringify(productToRecipes, null, 2));
  await writeFile(join(getJSONDirectory(), "recipe-to-products.json"), JSON.stringify(recipeToProducts, null, 2));
  return { productToRecipes, recipeToProducts };
}

export async function productToRecipeCreation() {
  const { recipes, altRecipes } = await splitRecipes();
  const productToRecipes: ProductToRecipes = {};

  // loop through recipes in recipes.json
  for (const recipe of Object.values(recipes)) {
    const extraction = extractItemClassObjects(recipe.mProduct);
    if (!extraction) continue;

    // first is the main product, all will contain byproducts
    const { first: productName, all: products } = extraction;

    if (!productToRecipes[productName]) {
      productToRecipes[productName] = {
        mainRecipe: recipe.ClassName,
        altRecipes: []
      };
      // if the product does not exist and no main recipe is assigned (from looping through byproducts below)
    } else if (!productToRecipes[productName].mainRecipe) {
      productToRecipes[productName].mainRecipe = recipe.ClassName;
    } else {
      productToRecipes[productName].altRecipes.push(recipe.ClassName);
    }

    // add byproducts to the product
    for (const product of Object.keys(products)) {
      // don't consider byproducts as main recipes (not sure if this is always true)
      if (!productToRecipes[product]) {
        productToRecipes[product] = {
          mainRecipe: "",
          altRecipes: [recipe.ClassName]
        };
      } else if (
        productToRecipes[product].mainRecipe !== recipe.ClassName &&
        !productToRecipes[product].altRecipes.includes(recipe.ClassName)
      ) {
        productToRecipes[product].altRecipes.push(recipe.ClassName);
      }
    }
  }

  // loop through alt recipes in altRecipes.json
  for (const recipe of Object.values(altRecipes)) {
    const extraction = extractItemClassObjects(recipe.mProduct);
    if (!extraction) continue;

    const { first: productName, all: products } = extraction;

    if (!productToRecipes[productName]) {
      productToRecipes[productName] = {
        mainRecipe: recipe.ClassName,
        altRecipes: []
      };
    } else if (!productToRecipes[productName].mainRecipe) {
      productToRecipes[productName].mainRecipe = recipe.ClassName;
    } else {
      productToRecipes[productName].altRecipes.push(recipe.ClassName);
    }

    for (const product of Object.keys(products)) {
      if (!productToRecipes[product]) {
        productToRecipes[product] = {
          mainRecipe: "",
          altRecipes: [recipe.ClassName]
        };
      } else if (
        productToRecipes[product].mainRecipe !== recipe.ClassName &&
        !productToRecipes[product].altRecipes.includes(recipe.ClassName)
      ) {
        productToRecipes[product].altRecipes.push(recipe.ClassName);
      }
    }
  }

  // Ensure each product has a valid main recipe
  for (const product in productToRecipes) {
    if (!productToRecipes[product].mainRecipe) {
      if (productToRecipes[product].altRecipes.length > 0) {
        productToRecipes[product].mainRecipe = productToRecipes[product].altRecipes.shift()!;
      } else {
        delete productToRecipes[product]; // Remove products with no valid recipes
      }
    }
  }

  // manually correct some recipes
  productToRecipes["Desc_HeavyOilResidue_C"].mainRecipe = "Recipe_Alternate_HeavyOilResidue_C";
  productToRecipes["Desc_HeavyOilResidue_C"].altRecipes = [
    "Recipe_Plastic_C",
    "Recipe_Rubber_C",
    "Recipe_Alternate_PolymerResin_C",
    "Recipe_UnpackageOilResidue_C"
  ];
  productToRecipes["Desc_LiquidTurboFuel_C"].mainRecipe = "Recipe_Alternate_TurboFuel_C";
  productToRecipes["Desc_LiquidTurboFuel_C"].altRecipes = [
    "Recipe_UnpackageTurboFuel_C",
    "Recipe_Alternate_TurboHeavyFuel_C",
    "Recipe_Alternate_TurboBlendFuel_C"
  ]

  return productToRecipes;
}
