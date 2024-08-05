import { readFile } from "fs/promises";

export async function GET(req: Request) {
  const json = await readFile("Docs-utf8.json", "utf-8");
  console.log(JSON.parse(json));
  return Response.json(JSON.parse(json));
}
