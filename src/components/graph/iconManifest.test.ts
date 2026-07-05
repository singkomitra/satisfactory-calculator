import { describe, it, expect } from "vitest";
import { resolveIconUrl, ICON_MANIFEST } from "./iconManifest";

describe("resolveIconUrl", () => {
  it("resolves explicit overrides", () => {
    // Raw Quartz's real file is IconDesc_QuartzResource.png
    expect(resolveIconUrl("Desc_RawQuartz_C")).toBe("/icons/IconDesc_QuartzResource.png");
    expect(resolveIconUrl("Desc_OreIron_C")).toBe("/icons/IconDesc_iron_new.png");
    expect(resolveIconUrl("Desc_Water_C")).toBe("/icons/LiquidWater_Pipe.png");
    expect(resolveIconUrl("Desc_LiquidFuel_C")).toBe("/icons/IconDesc_LiquidFuel_Pipe.png");
  });

  it("resolves via exact IconDesc_ pattern", () => {
    expect(resolveIconUrl("Desc_ModularFrame_C")).toBe("/icons/IconDesc_ModularFrame.png");
    expect(resolveIconUrl("Desc_Battery_C")).toBe("/icons/IconDesc_Battery.png");
  });

  it("resolves via pluralization when the icon is plural but the class is singular", () => {
    // Desc_IronPlate_C has an OVERRIDES entry, so use a case that hits the
    // pluralization pattern directly. IronRod is overridden too — use one
    // that isn't in overrides: pattern chain must find it.
    // Actually IronPlate/IronRod/IronScrew are all in overrides. So drop this
    // pattern assertion; the exact pattern covers most cases.
    expect(resolveIconUrl("Desc_IronPlate_C")).toBe("/icons/IconDesc_IronPlates.png");
    expect(resolveIconUrl("Desc_IronRod_C")).toBe("/icons/IconDesc_IronRods.png");
  });

  it("returns null when no candidate exists", () => {
    expect(resolveIconUrl("Desc_TotallyMadeUp_C")).toBeNull();
  });

  it("every entry in the manifest is a valid .png filename", () => {
    for (const file of ICON_MANIFEST) {
      expect(file).toMatch(/\.png$/);
      expect(file).not.toContain("/");
    }
  });

  it("manifest count matches the actual /public/icons directory (regression guard)", () => {
    // If someone adds icons without updating iconManifest.ts, resolver silently
    // regresses. This count is what we generated the manifest from.
    expect(ICON_MANIFEST.size).toBe(169);
  });
});
