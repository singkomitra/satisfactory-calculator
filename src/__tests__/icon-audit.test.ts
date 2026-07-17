import { describe, it, expect } from "vitest";
import { resolveIconUrl } from "../components/graph/iconManifest";
import { loadProductsMap } from "./fixtures";
import { listRawResources } from "../calculator/rawResources";

describe("icon coverage", () => {
  it("core production-chain products all resolve to real icons", () => {
    const pm = loadProductsMap();
    const mustResolve = [
      "Desc_SteelPlate_C", // Steel Beam — class/display mismatch regression case
      "Desc_SteelPlateReinforced_C", // Encased Industrial Beam
      "Desc_SteelIngot_C",
      "Desc_SteelPipe_C",
      "Desc_Cement_C", // Concrete
      "Desc_Motor_C",
      "Desc_GoldIngot_C", // Caterium Ingot
      "Desc_HighSpeedWire_C", // Quickwire
      "Desc_AluminumPlateReinforced_C", // Heat Sink
      "Desc_ModularFrameFused_C",
      "Desc_SAMFluctuator_C",
      "Desc_SpaceElevatorPart_1_C",
      "Desc_CircuitBoardHighSpeed_C" // AI Limiter
    ];
    for (const id of mustResolve) {
      const entry = pm[id];
      expect(entry, `${id} missing from products map`).toBeTruthy();
      const url = resolveIconUrl(id, entry.displayName);
      expect(url, `${id} (${entry.displayName}) has no icon`).not.toBeNull();
    }
  });

  it("unresolved icons stay under the known-fallback budget", () => {
    // Remaining fallbacks are seasonal FICSMAS items and a few packaged
    // variants with no icon file at all. If this count creeps UP, a rename or
    // data update broke resolution somewhere — investigate, don't bump.
    const pm = loadProductsMap();
    const missing: string[] = [];
    for (const [id, entry] of Object.entries(pm)) {
      if (!resolveIconUrl(id, entry.displayName)) missing.push(`${id} (${entry.displayName})`);
    }
    for (const raw of listRawResources(pm)) {
      if (!resolveIconUrl(raw.id, raw.label)) missing.push(raw.id);
    }
    expect(missing.length, `unresolved:\n  ${missing.join("\n  ")}`).toBeLessThanOrEqual(16);
  });
});
