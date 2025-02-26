import { extract256Pngs } from "@/parsing/extract-pngs";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: Request) {
  await extract256Pngs("Resource");
  return Response.json("");
}
