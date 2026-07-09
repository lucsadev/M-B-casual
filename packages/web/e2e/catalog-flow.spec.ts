/**
 * E2E: Catalog browsing flow
 *
 * Covers:
 * - Navigate to home → see products
 * - Click a product → view detail page
 * - Verify product name, price, and image are rendered
 * - Navigate back to catalog
 */
import { test, expect } from '@playwright/test';

test.describe('Catalog flow', () => {
  test('navigate home → catalog → product detail → back', async ({ page }) => {
    // Navigate to home
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    // Look for a "Ver catálogo" link or nav link to catalog
    const catalogLink = page.getByRole('link', { name: /catálogo|Catálogo|ver más|Ver más/i });
    if (await catalogLink.isVisible()) {
      await catalogLink.click();
      await page.waitForURL(/\/catalogo/);
    } else {
      await page.goto('/catalogo');
    }

    // Wait for the catalog page heading
    await expect(page.getByRole('heading', { name: /catálogo/i })).toBeVisible();

    // Wait for product cards to appear (they may load from API)
    const productLinks = page.getByRole('link').filter({ has: page.locator('img') });

    // Click the first visible product card link
    const firstProduct = productLinks.first();
    await expect(firstProduct).toBeVisible({ timeout: 10_000 });
    await firstProduct.click();

    // We should now be on a product detail page (/producto/:slug)
    await expect(page).toHaveURL(/\/producto\//);

    // Verify product detail elements are present
    // Product name (h1)
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Price indicator (search for common price patterns like $, ARS, etc.)
    await expect(page.locator('text=/\\$|ARS|precio/i').first()).toBeVisible({ timeout: 5_000 });

    // Image or picture element
    await expect(page.locator('img, picture').first()).toBeVisible({ timeout: 5_000 });

    // Navigate back to catalog
    const backLink = page.getByRole('link', { name: /catálogo|volver/i }).first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/catalogo/);
    }
  });

  test('catalog page shows header and search bar', async ({ page }) => {
    await page.goto('/catalogo');
    await expect(page.getByRole('heading', { name: /catálogo/i })).toBeVisible();

    // Search bar should be present (input with placeholder)
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="Buscar" i], input[type="search"]');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
  });
});
