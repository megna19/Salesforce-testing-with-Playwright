import { test, expect, Page } from '@playwright/test';
import { appUrl } from '../utils/salesforce';

async function openNewAccountDialog(page: Page) {
  await page.goto(appUrl('/lightning/o/Account/list'));
  await page.getByRole('button', { name: 'New', exact: true }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  return dialog;
}

test.describe('Salesforce Locators Practice', () => {

  // 1. getByRole
  test('getByRole', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    await expect(dialog.getByRole('heading', { name: 'New Account' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
  });

  // 2. getByLabel
  test('getByLabel', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    await dialog.getByLabel('Account Name').fill('megu');
    await dialog.getByLabel('Phone').fill('994444444');

    await expect(dialog.getByLabel('Account Name')).toHaveValue('megu');
    await expect(dialog.getByLabel('Phone')).toHaveValue('994444444');
  });

  // 3. getByPlaceholder
  test('getByPlaceholder', async ({ page }) => {
    await page.goto(appUrl('/lightning/o/Account/list'));

    const searchBox = page.getByPlaceholder('Search this list...');
    await searchBox.fill('Practice');

    await expect(searchBox).toHaveValue('Practice');
  });

  // 4. getByText
  test('getByText', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    await expect(dialog.getByText('Account Name').first()).toBeVisible();
    await expect(dialog.getByText('Phone').first()).toBeVisible();
  });

  // 5. getByTitle
  test('getByTitle', async ({ page }) => {
    await page.goto(appUrl('/lightning/o/Account/list'));

    await expect(page.getByTitle('Select list display')).toBeVisible();
  });

  // 6. Child locators
  test('Child locators', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    const nameField = dialog
      .locator('lightning-input')
      .getByRole('textbox', { name: 'Account Name' });

    await nameField.fill('Child Locator Practice');
    await expect(nameField).toHaveValue('Child Locator Practice');
  });

  // 7. Parent locators
  test('Parent locators', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    const phoneBlock = dialog
      .locator('lightning-input')
      .filter({ hasText: 'Phone' });

    await phoneBlock.locator('input').fill('1234567890');
    await expect(phoneBlock.locator('input')).toHaveValue('1234567890');
  });

  // 8. Reusing locators
  test('Reusing locators', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    const nameField = dialog.getByLabel('Account Name');
    const phoneField = dialog.getByLabel('Phone');

    await nameField.fill('Reuse Practice');
    await phoneField.fill('5555555555');

    await expect(nameField).toHaveValue('Reuse Practice');
    await expect(phoneField).toHaveValue('5555555555');
  });

  // 9. first(), nth(), last(), count()
  test('testtt', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);
    const buttons = dialog.getByRole('button');

    console.log('Buttons in dialog:', await buttons.count());

    await expect(buttons.first()).toBeVisible();
    await expect(buttons.nth(1)).toBeVisible();
    await expect(buttons.last()).toBeVisible();
  });

  // 10. Extracting values
  test('Extracting values', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);
    const nameField = dialog.getByLabel('Account Name');

    await nameField.fill('asdf');

    const typedValue = await nameField.inputValue();
    console.log('Input value:', typedValue);
    expect(typedValue).toEqual('asdf');

    const headingText = await dialog
      .getByRole('heading', { name: 'New Account' })
      .textContent();

    console.log('Heading text:', headingText);
    expect(headingText).toContain('New Account');

    const allButtonTexts = await dialog.getByRole('button').allTextContents();
    console.log('All button texts:', allButtonTexts);
    expect(allButtonTexts.join(' ')).toContain('Save');
  });

  // 11. Assertions
  test('Assertions', async ({ page }) => {
    expect(5).toEqual(5);

    const dialog = await openNewAccountDialog(page);
    const nameField = dialog.getByLabel('Account Name');

    await expect(dialog).toContainText('New Account');

    await nameField.fill('asdf');
    await expect(nameField).toHaveValue('asdf');

    await expect.soft(
      dialog.getByRole('heading', { name: 'New Account' })
    ).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  });

  // 12. Negative test
  test('Negative test - empty Account Name', async ({ page }) => {
    const dialog = await openNewAccountDialog(page);

    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByText('Complete this field.').first()).toBeVisible();
    await expect(dialog).toBeVisible();
  });

});