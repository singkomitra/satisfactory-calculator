import { ProductsMap } from "@/types";

const humanize = (raw: string) =>
  raw.replace(/^Desc_/, "").replace(/_C$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");

/**
 * Returns every raw resource referenced anywhere in the recipe tree of the
 * products map. A raw resource is a product that shows up as a recipe
 * ingredient but has no entry of its own (no recipe produces it inside the
 * map). Used to populate the "minimize" dropdown for min-raw strategy.
 */
export function listRawResources(productsMap: ProductsMap): { id: string; label: string }[] {
  const found = new Set<string>();
  for (const entry of Object.values(productsMap)) {
    for (const r of [entry.mainRecipe, ...entry.altRecipes]) {
      if (!r) continue;
      for (const ing of r.ingredients) {
        if (ing.isRawResource) found.add(ing.item);
      }
    }
  }
  return Array.from(found)
    .map((id) => ({ id, label: humanize(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
