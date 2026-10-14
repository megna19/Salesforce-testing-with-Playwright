import { test, expect } from '@playwright/test';
import { AccountPage } from '../pages/AccountPage';
import {
  createRecord,
  deleteRecord,
  findRecordIdByName,
} from '../utils/salesforce';

test.describe('Account', () => {
  test('create a new account from the UI', async ({ page }) => {
    const accountName = `PW UI Test ${Date.now()}`;
    const accountPage = new AccountPage(page);

    await accountPage.openNewForm();
    await accountPage.createAccount(accountName);
    await accountPage.expectRecordName(accountName);

    // Clean up the record
    const id = await findRecordIdByName('Account', accountName);
    if (id) await deleteRecord('Account', id);
  });

  test('open an account created through the API', async ({ page }) => {
    const accountName = `PW API Test ${Date.now()}`;
    const recordId = await createRecord('Account', { Name: accountName });

    try {
      const accountPage = new AccountPage(page);
      await accountPage.openRecord(recordId);
      await accountPage.expectRecordName(accountName);
    } finally {
      await deleteRecord('Account', recordId);
    }
  });

  test('account list view loads', async ({ page }) => {
    const accountPage = new AccountPage(page);
    await accountPage.openListView();
    await expect(page).toHaveURL(/Account\/list/);
  });
});