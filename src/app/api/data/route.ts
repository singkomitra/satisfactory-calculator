import { readFile } from "fs/promises";
import { join } from "path";
import { getJSONDirectory } from "@/parsing/util";

export async function GET(req: Request) {
  const json = await readFile(join(getJSONDirectory(), "parsed-typesafe-recipes.json"));
  return Response.json(json);
}
