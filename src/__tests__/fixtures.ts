import { readFileSync } from "fs";
import path from "path";
import { ProductsMap } from "@/types";

/**
 * Load the committed products-map.json as our test fixture. This is the same
 * data the /api/data endpoint serves at runtime — regenerated from Docs.json
 * on demand — so tests exercise the actual production shape.
 */
let cached: ProductsMap | null = null;
export function loadProductsMap(): ProductsMap {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "src/parsing/jsons/products-map.json");
  cached = JSON.parse(readFileSync(filePath, "utf-8")) as ProductsMap;
  return cached;
}

/**
 * Common test IDs we reference across many tests. Keeping them here means
 * grep + rename works cleanly if Coffee Stain ever changes a class name.
 */
export const P = {
  ModularFrame: "Desc_ModularFrame_C",
  ReinforcedIronPlate: "Desc_IronPlateReinforced_C",
  IronPlate: "Desc_IronPlate_C",
  IronIngot: "Desc_IronIngot_C",
  IronRod: "Desc_IronRod_C",
  Screw: "Desc_IronScrew_C",
  Fuel: "Desc_LiquidFuel_C",
  Concrete: "Desc_Cement_C",
  PolymerResin: "Desc_PolymerResin_C",
  // Raw resources
  OreIron: "Desc_OreIron_C",
  OreCopper: "Desc_OreCopper_C",
  LiquidOil: "Desc_LiquidOil_C",
  Water: "Desc_Water_C",
  Stone: "Desc_Stone_C",
  Coal: "Desc_Coal_C"
} as const;

export const nearly = (a: number, b: number, epsilon = 1e-6) => Math.abs(a - b) < epsilon;
