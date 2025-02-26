import { getItemAndResourceDescriptors } from "@/parsing/get-resource-and-item-descriptors";
import { extract256Pngs } from "@/parsing/extract-pngs";
import { readFile } from "fs/promises";
import { join } from "path";
import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";

export async function GET(req: Request) {
  await productToRecipesAndRecipeToProductsCreation();
  return Response.json("");
}
