import { writeFile } from "fs/promises";
import { join } from "path";
import { getJSONDirectory } from "@/parsing/util";
import { createProductsMap } from "@/parsing/create-products-map";

// Maintainer-only: rebuild every derived JSON from Docs-utf8.json and write
// the results so they can be committed. The products map is written twice —
// src/parsing/jsons/ (tests, parsing pipeline) and public/data/ (what the
// deployed site serves). A unit test asserts the two stay identical.
//
// Hard-disabled outside development. In the server build the route is
// dynamic and 404s at runtime. Static export can't ship dynamic handlers at
// all, so there we bake a static "disabled" JSON at build time instead —
// either way a deployed environment exposes no compute-heavy endpoint.
const isExport = process.env.NEXT_OUTPUT_MODE === "export";
export const dynamic = isExport ? "force-static" : "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    if (isExport) {
      return Response.json({ ok: false, error: "disabled outside development" });
    }
    return new Response("Not found", { status: 404 });
  }
  const products = await createProductsMap();
  const json = JSON.stringify(products, null, 2);
  await writeFile(join(getJSONDirectory(), "products-map.json"), json);
  await writeFile(join("public", "data", "products-map.json"), json);
  return Response.json({
    ok: true,
    products: Object.keys(products).length,
    note: "src/parsing/jsons/*.json and public/data/products-map.json regenerated — review the diff and commit."
  });
}
