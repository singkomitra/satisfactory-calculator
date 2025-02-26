import { getItemAndResourceDescriptors } from "@/parsing/get-resource-and-item-descriptors";
import { extract256Pngs } from "@/parsing/extract-pngs";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(req: Request) {
  await getItemAndResourceDescriptors();
  return Response.json("");
}
