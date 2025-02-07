import { test, expect, Page } from '@playwright/test';
import { USER_DATA } from '../data'

/**
Write a Playwright test for the happy path from landing on this page to completing the card details in the checkout.
Write a Playwright test for an unhappy path of your choosing for a user landing on this page and trying to checkout.
*/

const DeliveryOptions = {
  rm_rmt48__2: 'Royal Mail- UK Delivery (3-5 days from dispatch)',
  rm_rmt24: 'Next Day UK Delivery (order by 3pm Mon-Fri)',
  DHL_DHLDOMEXP_3: 'DHL Domestic Express',
  dhl_dhlnd_1: 'Next Working Day with DHL',
  DHL_DHLDOMEXP12_3: 'DHL Domestic Express 12:00',
  DHL_DHLDOMEXP9_3: 'DHL DHL Domestic Express 9:00',
  buywithharper: 'Try before you buy from Next Day',
};

type TDeliveryOptions = typeof DeliveryOptions;
type TDeliveryOptionsKeys = keyof TDeliveryOptions;

test.describe('Workflow testing', () => {

  /**
   * Before hook
   */
  test.beforeEach(async ({ page }) => {

    // Base url navigation
    await page.goto('/palazzo-pant-black');
    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Palazzo Pant - Black/);

    // Cookies
    process.env.CI
      ? async () => {
        // Github actions workflow
        await page.getByRole('button', { name: 'Accept Cookies' }).click();
        await page.getByRole('button', { name: 'Continue to shop' }).click();
      }
      : async () => {
        // Local workflow
        await page.getByRole('button', { name: 'Accept All Cookies' }).click()
      }

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

    getCartSize(page);
    
    // Try to add to bag
    await expect(page.getByText('You must select a size')).toBeHidden();
    await page.getByRole('button', { name: 'Add to Bag' }).click();
    // Error displayed
    await expect(page.getByText('You must select a size')).toBeVisible();
    
  });

  /**
   * Individual steps
   */
  const selectAndAddToBag = async (page: Page) => {
    await test.step('Select and add to bag', async () => {

      // Check current bag size
      const itemCount = await getCartSize(page);

      // Add to bag
      await page.getByRole('button', { name: 'Add to Bag' }).click();

      // Check bag contents
      const bagItems = page.locator('div.minicart-items > ol > li');
      await expect(bagItems).toHaveCount(itemCount + 1);

    })
  }

  const simpleCheckout = async (page: Page) => {

    // Various simplistic checkout steps
    await checkoutAsGuest(page);
    await fillInAddress(page);
    await fillInBillingSameAddress(page);
    await selectBasicDeliveryMethod(page, 'rm_rmt48__2');
    await fillInPayment(page);
    await handlePaymentPopup(page);
    
  }

  const checkoutAsGuest = async (page: Page) => {
    await test.step('Checkout as guest', async () => {
      // Part 1. (Use guest checkout)
      await page.getByRole('button', { name: 'Continue as Guest' }).click();
      await page.getByRole('textbox', { name: 'Email Address*' }).fill(USER_DATA.email);
      await page.getByRole('button', { name: 'Continue to Delivery' }).click();
      await expect(page.getByText('Guest details complete')).toBeVisible();
    })
  }

  const fillInAddress = async (page: Page) => {
    await test.step('Address details', async () => {
      // Part 2.
      await page.getByRole('textbox', { name: 'First Name*' }).fill(USER_DATA.firstName);
      await page.getByRole('textbox', { name: 'Last Name*' }).fill(USER_DATA.lastName);
      await page.getByRole('textbox', { name: 'Phone Number*' }).fill(USER_DATA.phone_number);
      await page.getByLabel('Country*').selectOption(USER_DATA.address.country_code);
      await page.getByRole('combobox', { name: 'Address Line1*' }).fill(USER_DATA.address.addressLine1);
      await page.getByRole('textbox', { name: 'County/State' }).fill(USER_DATA.address.county);
      await page.getByRole('combobox', { name: 'Post code*' }).fill(USER_DATA.address.postcode);
      await page.getByRole('textbox', { name: 'City*' }).fill(USER_DATA.address.city);
      await page.getByTestId('deliveryAddress').getByRole('button', { name: 'Submit to Continue' }).click();
      await expect(page.getByText('Address details complete')).toBeVisible();
    })
  }

  const fillInBillingSameAddress = async (page: Page) => {
    await test.step('Billing details (same as address)', async () => {
      // Part 3.
      await page.getByTestId('billingAddress').getByRole('button', { name: 'Submit to Continue' }).click();
      await expect(page.getByText('Billing address is the same as shipping')).toBeVisible();
    })
  }

  const selectBasicDeliveryMethod = async (page: Page, deliveryMethod: TDeliveryOptionsKeys) => {
    await test.step('Select delivery method', async () => {
      // Part 4.
      await page.getByTestId('deliveryOptions').getByRole('button', { name: 'Submit to Continue' }).click();
      await expect(page.getByText(DeliveryOptions[deliveryMethod]).locator('svg')).toBeVisible();
    })
  }

  const fillInPayment = async (page: Page) => {
    await test.step('Payment details', async () => {
      // Part 5.
      await page.frameLocator('#braintree-hosted-field-number').getByRole('textbox', { name: 'Credit Card Number' }).fill(USER_DATA.payment.card_number);
      await page.frameLocator('#braintree-hosted-field-expirationDate').getByRole('textbox', { name: 'Expiration Date' }).fill(USER_DATA.payment.expiry);
      await page.frameLocator('#braintree-hosted-field-cvv').getByRole('textbox', { name: 'CVV' }).fill(USER_DATA.payment.cvv);
      await page.frameLocator('#braintree-hosted-field-cardholderName').getByRole('textbox', { name: 'Cardholder Name' }).fill(`${USER_DATA.firstName} ${USER_DATA.lastName}`);
      await page.frameLocator('#braintree-hosted-field-postalCode').getByRole('textbox', { name: 'Postal Code' }).fill(USER_DATA.address.postcode);
      await page.getByRole('button', { name: 'Place Order' }).click();
    })
  }

  const handlePaymentPopup = async (page: Page) => {
    await test.step('Validate payment details on popup', async () => {
      const paymentIFrame = page.frameLocator('#Cardinal-CCA-IFrame')
      await paymentIFrame.getByRole('textbox', { name: 'Enter Code Here' }).fill(USER_DATA.payment.otp);
      await paymentIFrame.getByRole('button', { name: 'SUBMIT' }).click();
    })
  }

  /**
   * Utils
   */
  const getCartSize = async (page: Page) => {
    const cart = page.getByRole('link', { name: 'Cart' }).locator('span');
    return parseInt((await cart.textContent()) || '0');
  }

  const cartToCheckout = async (page: Page) => {
    await page.getByRole('link', { name: 'Checkout' }).click();
    await page.waitForURL('**/checkout');
  }

  // For debugging
  const forceWait = async (page: Page, milliseconds: number) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

});