import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  CRAWL_PATHS,
  LEAK_PASSWORD,
  LEAK_USERS,
  prepareLeakFixture,
  revokeLeakGrant,
  SENTINEL_EMAIL,
  SENTINEL_NAME,
  SENTINEL_NOTE,
  SENTINEL_PHONE,
} from './helpers/leak-setup';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

const SENTINELS = [SENTINEL_NAME, SENTINEL_PHONE, SENTINEL_EMAIL, SENTINEL_NOTE];

async function login(page: Page, email: string): Promise<void> {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('form[data-hydrated="ready"]').waitFor({ timeout: 60_000 });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(LEAK_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForFunction(() => {
    const path = window.location.pathname;
    if (path === '/dashboard' || path === '/inactive') return true;
    const notice = document.querySelector('[aria-live="polite"]')?.textContent ?? '';
    return notice.length > 0 && notice !== 'Signing you in…';
  }, { timeout: 90_000 });
  if (!/\/(dashboard|inactive)/.test(page.url())) {
    const notice = (await page.locator('[aria-live="polite"]').textContent()) ?? '';
    throw new Error(`Login did not reach dashboard for ${email}: ${notice}`);
  }
}

async function crawl(
  page: Page,
  paths: string[],
): Promise<{ html: string; network: string }> {
  const network: string[] = [];
  const onResponse = async (response: { url: () => string; text: () => Promise<string> }) => {
    try {
      const text = await response.text();
      network.push(`${response.url()}\n${text}`);
    } catch {
      network.push(response.url());
    }
  };
  page.on('response', onResponse);
  let html = '';
  for (const path of paths) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    html += `\n<!-- ${path} -->\n${await page.content()}`;
  }
  page.off('response', onResponse);
  return { html, network: network.join('\n') };
}

function assertNone(haystack: string, label: string): void {
  for (const sentinel of SENTINELS) {
    expect(haystack, `${label} leaked ${sentinel}`).not.toContain(sentinel);
  }
}

test.describe('client PII leak crawl', () => {
  test.describe.configure({ timeout: 1_200_000 });

  test('sentinels stay off every surface except the grantee lead page', async ({ page, browser }) => {
    const { leadId, matchId } = await prepareLeakFixture();
    const leadPath = `/leads/${leadId}`;
    const matchPath = `/matches/${matchId}`;
    const extra = [leadPath, matchPath];

    const denied = [
      LEAK_USERS.stranger,
      LEAK_USERS.treasurer,
      LEAK_USERS.chapterLead,
      LEAK_USERS.admin,
    ];
    for (const user of denied) {
      const context = await browser.newContext();
      const rolePage = await context.newPage();
      await login(rolePage, user.email);
      const result = await crawl(rolePage, [...CRAWL_PATHS, ...extra]);
      assertNone(result.html, `${user.email} html`);
      assertNone(result.network, `${user.email} network`);
      await context.close();
    }

    await login(page, LEAK_USERS.grantee.email);
    const granted = await crawl(page, [...CRAWL_PATHS, matchPath]);
    assertNone(granted.html, 'grantee other routes html');
    assertNone(granted.network, 'grantee other routes network');
    await page.goto(leadPath, { waitUntil: 'domcontentloaded' });
    const leadHtml = await page.content();
    expect(leadHtml).toContain(SENTINEL_NAME);
    expect(leadHtml).toContain(SENTINEL_PHONE);
    expect(leadHtml).toContain(SENTINEL_EMAIL);
    expect(leadHtml).toContain(SENTINEL_NOTE);

    await revokeLeakGrant(leadId);
    await page.goto('/dashboard');
    const after = await crawl(page, [...CRAWL_PATHS, ...extra]);
    assertNone(after.html, 'grantee after revoke html');
    assertNone(after.network, 'grantee after revoke network');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) throw new Error('anon env missing');
    const anonClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: leads } = await anonClient.from('leads').select('id');
    expect(leads ?? []).toEqual([]);
    const { data: anonPool } = await anonClient.from('lead_pool').select('*');
    expect(anonPool ?? []).toEqual([]);
    const scoped = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await scoped.auth.signInWithPassword({
      email: LEAK_USERS.stranger.email,
      password: LEAK_PASSWORD,
    });
    const { data: poolRows } = await scoped.from('lead_pool').select('*').limit(1);
    const row = poolRows?.[0];
    if (row) {
      expect(row).not.toHaveProperty('client_name');
      expect(row).not.toHaveProperty('client_phone');
      expect(row).not.toHaveProperty('client_email');
      expect(row).not.toHaveProperty('notes');
    }
  });
});
