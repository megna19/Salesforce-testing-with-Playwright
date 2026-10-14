import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { runSfJson, getOrgInfo, toLightningUrl } from './utils/salesforce';

dotenv.config();

async function globalSetup(_config: FullConfig) {
  const alias = process.env.SF_ORG_ALIAS;
  if (!alias) {
    throw new Error('SF_ORG_ALIAS is missing in your .env file');
  }

  fs.mkdirSync('auth', { recursive: true });

  // Lightning address
  const { instanceUrl } = getOrgInfo();
  const lightningBase = toLightningUrl(instanceUrl);

  // One-time login link from the Salesforce CLI
  const { url: loginUrl } = runSfJson(
    `org open --target-org ${alias} --url-only`
  );

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

    // Go to the Lightning home page so the session is saved for Lightning
    await page.goto(`${lightningBase}/lightning/page/home`, {
      waitUntil: 'domcontentloaded',
    });

    // Wait until we are really on Lightning and not on a login page
    await page.waitForURL(
      (url) =>
        url.href.includes('lightning.force.com') &&
        !url.href.includes('login'),
      { timeout: 90_000 }
    );

    await page
      .locator(
        '.slds-global-header, one-app-launcher-header, .slds-context-bar >> visible=true'
      )
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 });

    await context.storageState({ path: 'auth/sf-session.json' });
    fs.writeFileSync('auth/base-url.txt', lightningBase);
  } catch (error) {

    await page.screenshot({ path: 'auth/setup-failed.png', fullPage: true });
    console.error(`Login failed. Page address was: ${page.url()}`);
    console.error('Screenshot saved to auth/setup-failed.png');
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
