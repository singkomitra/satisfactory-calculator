import { getItemAndResourceDescriptors } from "@/parsing/get-resource-and-item-descriptors";
import { extract256Pngs } from "@/parsing/extract-pngs";
import { readFile } from "fs/promises";
import { join } from "path";
import { productToRecipesAndRecipeToProductsCreation } from "@/parsing/product-to-recipe-conversion";
import { getJSONDirectory } from "@/parsing/util";

export async function GET(req: Request) {
  const json = await readFile(join(getJSONDirectory(), "parsed-typesafe-recipes.json"));
  return Response.json(json);
}
