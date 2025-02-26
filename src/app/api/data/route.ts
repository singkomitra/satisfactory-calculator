import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: Request) {
  const json = await readFile(join("src", "parsing", "jsons", "parsed-typesafe-recipes.json"), "utf-8");
  return Response.json(JSON.parse(json));
}
