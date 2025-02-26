import { ProductToRecipeRaw, RecipeJsonObject, RecipeToProduct, convertProductToRecipeRawToProductToRecipe } from "@/types";
import { splitRecipes } from "./split-recipes";
import { extractItemClassForProduct } from "./util";

async function productToRecipeAndRecipeToProductCreation() {
    const { allRecipes } = await splitRecipes();
    const productToRecipeRaw: ProductToRecipeRaw = {};
    const recipeToProduct: RecipeToProduct = {};
    for (const recipe of Object.values(allRecipes)) {
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
    return { productToRecipe: convertProductToRecipeRawToProductToRecipe(productToRecipeRaw), recipeToProduct };
}