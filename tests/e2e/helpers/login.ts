import { expect, type Page } from '@playwright/test';

export const DEMO_PASSWORD = 'Kito-Demo-2026!';

export async function loginAs(page: Page, email: string, password = DEMO_PASSWORD): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('form[data-hydrated="ready"]').waitFor({ timeout: 60_000 });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForFunction(() => window.location.pathname === '/dashboard', { timeout: 90_000 });
  expect(page.url()).toContain('/dashboard');
}
