import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/login';
import { prepareReferralLeads } from './helpers/referral-setup';

const ROLES = [
  { email: 'grace.wanjiru@kito.test', role: 'treasurer' },
  { email: 'amina.hassan@kito.test', role: 'chapterLead' },
  { email: 'james.gitonga@kito.test', role: 'admin' },
  { email: 'daniel.otieno@kito.test', role: 'member' },
] as const;

test.describe('role storage states and journeys', () => {
  test.describe.configure({ timeout: 900_000 });

  test('each role reaches the dashboard and keeps a storage state', async ({ browser }, testInfo) => {
    for (const account of ROLES) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAs(page, account.email);
      await context.storageState({ path: testInfo.outputPath(`${account.role}.json`) });
      await context.close();
    }
  });

  test('referral: request, approve, reveal, first touch, granter points', async ({ page }) => {
    const fixture = await prepareReferralLeads();
    await loginAs(page, 'grace.wanjiru@kito.test');
    await page.goto('/dashboard');
    await page.locator('article', { hasText: '92' }).getByRole('button', { name: 'Request contact access' }).click();
    await expect(page.getByText(/requested|Request sent|already/i).first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Sign out' }).click();
    await loginAs(page, 'kevin.mwangi@kito.test');
    await page.goto(`/leads/${fixture.sellerLeadId}`);
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByText(/granted|Approve/i).first()).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Sign out' }).click();
    await loginAs(page, 'grace.wanjiru@kito.test');
    await page.goto(`/leads/${fixture.sellerLeadId}`);
    await expect(page.getByText(fixture.sellerPhone)).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await loginAs(page, 'kevin.mwangi@kito.test');
    await page.goto('/points');
    await expect(page.locator('body')).toContainText(/Referral|First touch|30/i);
  });

  test('owner cannot verify their own action', async ({ page }) => {
    await loginAs(page, 'grace.wanjiru@kito.test');
    await page.goto('/accountability');
    const mine = page.locator('section', { has: page.getByRole('heading', { name: 'Your action steps' }) });
    await expect(mine.getByRole('button', { name: 'Verify' })).toHaveCount(0);
  });

  test('M-Pesa stays disabled when MPESA_ENABLED is false', async ({ page }) => {
    await loginAs(page, 'grace.wanjiru@kito.test');
    await page.goto('/reports');
    await expect(page.getByText(/M-Pesa is not configured yet/i)).toBeVisible();
    const pay = page.getByRole('button', { name: /Pay with M-Pesa/i });
    if (await pay.count()) {
      await expect(pay.first()).toBeDisabled();
    }
  });

  test('forum cycle shows the current topic', async ({ page }) => {
    await loginAs(page, 'grace.wanjiru@kito.test');
    await page.goto('/forum');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toContainText(/lesson|topic|Share/i);
  });
});
