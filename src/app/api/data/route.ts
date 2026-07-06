import productsMap from "@/parsing/jsons/products-map.json";

// Serve the committed products-map.json as a fully static response. The heavy
// parse of Docs.json happens at data-update time (see /api/dev/regenerate),
// never per request — a hot loop against this endpoint just hits the CDN.
export const dynamic = "force-static";

export async function GET() {
  return Response.json(productsMap, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800"
    }
  });
}
