import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAs } from './helpers/login';

test.describe('accessibility', () => {
  test.describe.configure({ timeout: 300_000 });

  test('dashboard, leads, forum and settings have no serious axe violations', async ({ page }) => {
    await loginAs(page, 'grace.wanjiru@kito.test');
    for (const path of ['/dashboard', '/leads', '/forum', '/settings']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const serious = results.violations.filter((row) => row.impact === 'serious' || row.impact === 'critical');
      expect(serious, `${path}: ${serious.map((row) => row.id).join(', ')}`).toEqual([]);
    }
  });
});
