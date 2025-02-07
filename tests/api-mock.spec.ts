import { test, expect } from '@playwright/test';
import { USER_DATA } from '../data'
import { selectAndAddToBag, cartToCheckout, forceWait } from '../utils/steps';

/**
Optional Task: Write a Playwright test where the user tries to checkout as a guest, but the call submitting the guest email address 500s.
*/

test.describe('API Testing', () => {

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

  test('http 500 on guest checkout', async ({ page }) => {

    // Add item to bag and validate
    await page.locator('[name="size"]').selectOption({ label: 'UK 12' });
    await selectAndAddToBag(page);

    // Go to bag
    await page.getByRole('link', { name: 'Review Bag and Checkout' }).click();
    await expect(page).toHaveTitle(/Cart/);

    // Checkout
    await cartToCheckout(page);

    await page.getByRole('button', { name: 'Continue as Guest' }).click();
    await page.getByRole('textbox', { name: 'Email Address*' }).fill(USER_DATA.email);

    await page.route('**/checkout', async (route) => {
      await route.fulfill({
        status: 500,
      })
    })

    await page.getByRole('button', { name: 'Continue to Delivery' }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible();

  });

})
