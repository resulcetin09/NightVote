import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const view of ["vote", "organize", "privacy"])
  test(`${view} view has no WCAG A/AA violations`, async ({ page }) => {
    await page.goto(`/#${view}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(result.violations).toEqual([]);
  });

test("rehearsal counts one ballot and the circuit rejects a second", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Rehearse a ballot" }).click();
  await expect(page.getByRole("heading", { name: /Adopt the 2027/ })).toBeVisible({ timeout: 20000 });
  await page.locator(".box", { hasText: "Yes" }).click();
  await page.getByRole("button", { name: "Cast ballot" }).click();
  await expect(page.getByText("Ballot cast")).toBeVisible();
  await expect(page.getByText("No proof was generated")).toBeVisible();
  await page.getByRole("button", { name: "Cast ballot" }).click();
  await expect(page.getByRole("alert")).toContainText("already voted");
});

test("rejects an address that is not a contract address", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Election address").fill("not-an-address");
  await page.getByRole("button", { name: "Open election" }).click();
  await expect(page.getByRole("alert")).toContainText("64 hexadecimal");
});

test("explains how to get a wallet when none is installed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Connect wallet" }).click();
  await expect(page.getByRole("alert")).toContainText("Install Lace");
});
