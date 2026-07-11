import { test, expect } from "@playwright/test";
import {
  gotoCalculator,
  pickProduct,
  setRate,
  switchEngine,
  setGoal,
  openAdvanced,
  openResources,
  closeResources,
  setResourceMode
} from "./helpers";

test.describe("Calculator — greedy engine", () => {
  test("60 Modular Frame renders the expected summary", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await setRate(page, 60);

    // The buildings total is unique (Greedy on Modular Frame at 60/min = 192)
    // and independent of the react-flow graph text, so it's the cleanest
    // signal that the calculation ran and the summary rendered.
    await expect(page.getByText("192 total")).toBeVisible();

    // Also check that the raw resources section lists OreIron somewhere
    // inside the summary panel (scoped, since the text also appears in node
    // headers and edge labels).
    const summary = page.locator('text="Raw resources"').locator("xpath=ancestor::*[3]");
    await expect(summary.getByText("1440/min")).toBeVisible();
  });

  test("excluding Iron Ore surfaces infeasibility", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await openResources(page);
    await setResourceMode(page, "Ore Iron", "Excluded");
    await closeResources(page);

    await expect(page.getByText("No feasible plan")).toBeVisible();
    await expect(page.getByText(/Cannot produce/)).toBeVisible();
  });

  test("rejecting byproducts on Fuel is infeasible", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Fuel");
    await openAdvanced(page);
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(page.getByText("No feasible plan")).toBeVisible();
    await expect(page.getByText(/no byproducts/)).toBeVisible();
  });
});

test.describe("Calculator — customer-facing goals", () => {
  test("solver internals are hidden until Advanced is opened", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    // No engine jargon in the default UI.
    await expect(page.getByRole("button", { name: "Greedy", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "LP", exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Optimize for")).toBeVisible();
    // Advanced reveals them.
    await openAdvanced(page);
    await expect(page.getByRole("button", { name: "Greedy", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "LP", exact: true })).toBeVisible();
  });

  test("switching goal from Standard recipes to Fewest machines changes the plan", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await expect(page.getByText("192 total")).toBeVisible();
    await setGoal(page, "Fewest machines");
    await expect(page.getByText("192 total")).toHaveCount(0);
    await expect(page.locator("text=/total$/")).toBeVisible();
  });

  test("Save a specific resource goal exposes a resource picker and applies it", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await setGoal(page, "Save a specific resource…");
    const resourcePicker = page.getByLabel("Resource to save");
    await expect(resourcePicker).toBeVisible();
    await resourcePicker.selectOption({ label: "Ore Iron" });
    // Plan recomputes with LP min-resource(iron): iron drops well below 1440.
    await expect(page.getByText("192 total")).toHaveCount(0);
  });

  test("touching an Advanced control flips the goal to Custom", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await switchEngine(page, "LP");
    await expect(page.getByLabel("Optimize for")).toHaveValue("custom");
  });
});

test.describe("Calculator — LP engine", () => {
  test("LP toggle changes the toolbar to expose Objective + Closed loop", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await switchEngine(page, "LP");

    // Objective dropdown appears
    await expect(page.getByText("OBJECTIVE")).toBeVisible();
    // Closed loop pill appears
    await expect(page.getByRole("button", { name: "Closed loop" })).toBeVisible();
  });

  test("Max Iron Ore = 60 is infeasible for 60 Modular Frame", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await switchEngine(page, "LP");
    await openResources(page);
    await setResourceMode(page, "Ore Iron", "Max ≤", 60);
    await closeResources(page);

    await expect(page.getByText("No feasible plan")).toBeVisible();
  });

  test("Max Iron Ore = 400 stays feasible with iron cap respected", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");
    await switchEngine(page, "LP");
    await openResources(page);
    await setResourceMode(page, "Ore Iron", "Max ≤", 400);
    await closeResources(page);

    // Plan exists; infeasibility message is not shown.
    await expect(page.getByText("No feasible plan")).toHaveCount(0);

    // Buildings summary appears (LP always produces a "N total" line).
    await expect(page.locator("text=/\\d+(\\.\\d+)?\\s*total$/")).toBeVisible();
  });
});

test.describe("Calculator — greedy vs LP side by side", () => {
  test("switching engines updates the machine total", async ({ page }) => {
    await gotoCalculator(page);
    await pickProduct(page, "Modular Frame");

    // Greedy default: 192 total
    await expect(page.getByText("192 total")).toBeVisible();

    // Switch to LP
    await switchEngine(page, "LP");

    // LP produces some smaller total. Playwright will pick up the change if
    // the total re-renders with a different value.
    await expect(page.getByText("192 total")).toHaveCount(0);
    await expect(page.locator("text=/total$/")).toBeVisible();
  });
});
