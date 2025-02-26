import { productToRecipesAndRecipeToProductsCreation } from "./product-to-recipe-conversion";
import { recipesToIngredients } from "./recipes-to-ingredients";

export const recipesToIngredientsToProductsConversion = async () => {
    const { recipeToProducts } = await productToRecipesAndRecipeToProductsCreation();
    const finalRecipes = await recipesToIngredients();
    for (const recipe of Object.keys(finalRecipes)) {
        finalRecipes[recipe].ingredients.map(ingredient => {
            const product = recipeToProducts[ingredient.item];
            if (product) {
                ingredient.item = product.mainProduct;
            } else {
                console.error("Product not found for recipe: ", ingredient.item)
            }

        })
    }
    return finalRecipes;
}