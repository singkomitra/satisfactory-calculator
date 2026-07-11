import { Page, expect } from "@playwright/test";

/**
 * Reliable UI actions that mirror what a real user does. Any change here
 * (dropdown structure, key selectors) is picked up by every test at once.
 */

export async function gotoCalculator(page: Page) {
  await page.goto("/calculator");
  // The API rebuild is slow (~15s) on cold start; wait for the toolbar to
  // stop showing "Loading catalog…".
  await expect(page.getByText("Pick a product to start")).toBeVisible({ timeout: 60_000 });
}

export async function pickProduct(page: Page, productName: string) {
  const search = page.getByPlaceholder(/search a product/i);
  await search.click();
  await search.fill(productName);
  // The picker shows filtered results; click the exact match.
  await page
    .locator('[class*="chakra-stack"]')
    .filter({ hasText: new RegExp(`^${productName}$`) })
    .first()
    .click();
}

export async function setRate(page: Page, ppm: number) {
  const rateInput = page.getByRole("spinbutton").first();
  await rateInput.fill(String(ppm));
}

/** Expand the Advanced controls row if it isn't open. */
export async function openAdvanced(page: Page) {
  const toggle = page.getByRole("button", { name: /advanced/i });
  if ((await toggle.textContent())?.includes("▾")) {
    await toggle.click();
  }
}

/** Engine pills live behind the Advanced toggle — customers use setGoal instead. */
export async function switchEngine(page: Page, engine: "Greedy" | "LP") {
  await openAdvanced(page);
  await page.getByRole("button", { name: engine, exact: true }).click();
}

/** The customer-facing path: pick a plain-language optimization goal. */
export async function setGoal(page: Page, goalLabel: string) {
  await page.getByLabel("Optimize for").selectOption({ label: goalLabel });
}

export async function openResources(page: Page) {
  await page.getByRole("button", { name: /manage/i }).click();
  await expect(page.getByRole("heading", { name: "Resources" })).toBeVisible();
}

export async function closeResources(page: Page) {
  await page.getByRole("button", { name: "Done", exact: true }).click();
}

export async function setResourceMode(
  page: Page,
  resourceLabel: string,
  mode: "Unlimited" | "Excluded" | "Max ≤" | "Min ≥" | "Exact =",
  value?: number
) {
  const row = page
    .locator('[class*="chakra-stack"]')
    .filter({ hasText: new RegExp(`^${resourceLabel}`) })
    .first();
  await row.locator("select").selectOption({ label: mode });
  if (value !== undefined) {
    await row.locator('input[type="number"]').fill(String(value));
  }
}
