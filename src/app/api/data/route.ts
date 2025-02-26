import { extractItemClassForProduct } from "@/parsing/util";
import { ProductToRecipe, ProductToRecipeRaw, assertRecipeJsonObject, convertProductToRecipeRawToProductToRecipe, convertStringFieldsOJsonToNumber } from "@/types";
import { readFile, writeFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("Docs-utf8.json", "utf-8");
  return Response.json("");
}
