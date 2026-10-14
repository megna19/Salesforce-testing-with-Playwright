import { test, expect } from '@playwright/test';
import { appUrl } from '../utils/salesforce';

test.beforeEach(async ({ page }) => {
  // Every test starts by opening the tab
  await page.goto(appUrl('/lightning/n/User_Permission_Comparison'));

  // Wait until the component is really drawn (the page is slow in debug mode)
  await expect(
    page.getByRole('button', { name: 'Compare', exact: true })
  ).toBeVisible({ timeout: 60_000 });
});

test('Compare button is disabled at the start', async ({ page }) => {
  //open the User Permission Comparison tab
  //await page.goto(appUrl('/lightning/n/User_Permission_Comparison'));
  //Check the Compare button is disabled
  await expect(page.getByRole('button', { name: 'Compare', exact: true })).toBeDisabled();
});

test('Compare two users and see the results', async ({ page }) => {

  //search and pick User A
  await page.getByRole('textbox').first().fill('Megna K');
  await page.getByText('megna.kannan@gmail.com').first().click();

  //search and pick User B
  await page.getByRole('textbox').nth(1).fill('mal');
  await page.getByText('malvika.infinity@gmail.com').first().click();

  //click Compare
  await page.getByRole('button', { name: 'Compare', exact: true }).click();

  //Check the results sections are visible
  await expect(page.getByText('Permission Sets', { exact: true })).toBeVisible();
  await expect(page.getByText('Permission Set Groups', { exact: true })).toBeVisible();
});

//the user details rows show up after comparing
test('User details rows are shown in the results', async ({ page }) => {
  await page.getByRole('textbox').first().fill('Megna K');
  await page.getByText('megna.kannan@gmail.com').first().click();
  await page.getByRole('textbox').nth(1).fill('mal');
  await page.getByText('malvika.infinity@gmail.com').first().click();
  await page.getByRole('button', { name: 'Compare', exact: true }).click();

  await expect(page.getByText('User Type', { exact: true })).toBeVisible();
  await expect(page.getByText('Account Status', { exact: true })).toBeVisible();
  await expect(page.getByText('Timezone', { exact: true })).toBeVisible();
  await expect(page.getByText('Language', { exact: true })).toBeVisible();
});
