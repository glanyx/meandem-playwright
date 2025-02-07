import { test, expect } from '@playwright/test';
import { selectAndAddToBag, cartToCheckout, simpleCheckout } from '../utils/steps';

/**
Write a Playwright test for the happy path from landing on this page to completing the card details in the checkout.
Write a Playwright test for an unhappy path of your choosing for a user landing on this page and trying to checkout.
*/

test.describe('Workflow testing', () => {

  /**
   * Before hook
   */
  test.beforeEach(async ({ page }) => {

    // Base url navigation
    await page.goto('/palazzo-pant-black');
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Palazzo Pant - Black/);

    // Cookies (workflow changes slightly on Github actions)
    await page.getByRole('button', { name: /Accept (All )?Cookies/g }).click();
    if (process.env.CI) await page.getByRole('button', { name: 'Continue to shop' }).click();

  });

  /**
   * Tests
   */

  test('Happy path', async ({ page }) => {

    // Add item to bag and validate
    await page.locator('[name="size"]').selectOption({ label: 'UK 12' });
    await selectAndAddToBag(page);

    // Go to bag
    await page.getByRole('link', { name: 'Review Bag and Checkout' }).click();
    await expect(page).toHaveTitle(/Cart/);

    // Checkout
    await cartToCheckout(page);
    await simpleCheckout(page);
    
    // Wait for order confirmation
    await page.waitForURL('**/checkout/order-confirmation');
    await expect(page.getByText('Thank you for your purchase')).toBeVisible()

  });

  test('Unhappy path', async ({ page }) => {
    
    // Select item size
    await page.locator('[name="size"]').selectOption({ label: 'UK 12' });
    // Select other colour
    await page.getByLabel('Dark Navy').click();
    await expect(page).toHaveTitle(/Palazzo Pant - Dark Navy/);

    // Try to add to bag
    await expect(page.getByText('You must select a size')).toBeHidden();
    await page.getByRole('button', { name: 'Add to Bag' }).click();
    // Error displayed
    await expect(page.getByText('You must select a size')).toBeVisible();
    
  });

});