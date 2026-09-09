import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/login';

const ROUTES = [
  '/dashboard',
  '/leads',
  '/leads/new',
  '/accountability',
  '/forum',
  '/reports',
  '/points',
  '/notifications',
  '/settings',
  '/admin',
  '/admin/members',
  '/admin/sessions',
  '/admin/topics',
  '/admin/pairings',
  '/admin/payments',
  '/admin/audit',
];

test.describe('375px pass', () => {
  test.describe.configure({ timeout: 300_000 });
  test.use({ viewport: { width: 375, height: 812 } });

  test('no horizontal scroll on member and admin routes', async ({ page }) => {
    await loginAs(page, 'james.gitonga@kito.test');
    for (const path of ROUTES) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(1);
    }
  });
});
