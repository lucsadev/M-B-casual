/**
 * E2E: Auth flow (login + register)
 *
 * Covers:
 * - Navigate to /login → verify form is visible
 * - Submit with invalid credentials → see error message
 * - Navigate to /register → verify form is visible
 */
import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('login page shows form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Verify heading
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();

    // Verify form fields
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();

    // Verify link to register
    await expect(page.getByRole('link', { name: /crear cuenta/i })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');

    // Fill with invalid credentials
    await page.locator('#email').fill('invalid@test.com');
    await page.locator('#password').fill('wrongpassword');

    // Submit the form
    await page.getByRole('button', { name: /ingresar/i }).click();

    // Expect an error message to appear (either Zod validation or server error)
    // Zod might block invalid email format, or server returns error
    await page.waitForTimeout(2_000);

    // Check for either a server error box or field-level validation error
    const errorElements = page.locator(
      'text=/inválido|inválida|requerido|requerida|error|incorrect|not found/i'
    );
    await expect(errorElements.first()).toBeVisible({ timeout: 10_000 });
  });

  test('register page shows form with all fields', async ({ page }) => {
    await page.goto('/register');

    // Verify heading
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();

    // Verify required form fields
    await expect(page.locator('#nombre')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmarPassword')).toBeVisible();

    // Verify submit button
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();

    // Verify link to login
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();
  });
});
