import { writeFile } from "fs/promises";
import { join } from "path";
import { getJSONDirectory } from "@/parsing/util";
import { createProductsMap } from "@/parsing/create-products-map";

// Maintainer-only: rebuild every derived JSON from Docs-utf8.json and write
// the results into src/parsing/jsons/ so they can be committed. This is the
// only place the parsing pipeline runs — /api/data serves the committed file.
//
// Hard-disabled outside development: the route returns 404 in production
// builds, so a deployed environment exposes no compute-heavy endpoint.
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }
  const products = await createProductsMap();
  await writeFile(join(getJSONDirectory(), "products-map.json"), JSON.stringify(products, null, 2));
  return Response.json({
    ok: true,
    products: Object.keys(products).length,
    note: "src/parsing/jsons/*.json regenerated — review the diff and commit."
  });
}
