import { readFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("parsed-typesafe-recipes.json", "utf-8");
  return Response.json(JSON.parse(json));
}
