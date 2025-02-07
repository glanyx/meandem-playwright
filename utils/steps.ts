import { test, expect, Page } from '@playwright/test';
import { USER_DATA } from '../data'

/**
 * Types
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


/**
 * Individual steps
 */
export const selectAndAddToBag = async (page: Page) => {
  await test.step('Select and add to bag', async () => {

    // Check current bag size
    const itemCount = await getCartSize(page);

    // Add to bag
    await page.getByRole('button', { name: 'Add to Bag' }).click();

    // Check bag contents
    const bagItems = page.locator('div.minicart-items > ol > li');
    await expect(bagItems).toBeVisible();
    await expect(bagItems).toHaveCount(itemCount + 1);

  })
}

export const simpleCheckout = async (page: Page) => {

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
    await page.getByTestId('signInOrRegister').getByRole('textbox', { name: 'Email Address*' }).fill(USER_DATA.email);
    await page.getByRole('button', { name: 'Continue to Delivery' }).click();
    await expect(page.getByText('Guest details complete').locator('svg')).toBeVisible();
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
    await expect(page.getByText('Address details complete').locator('svg')).toBeVisible();
  })
}

const fillInBillingSameAddress = async (page: Page) => {
  await test.step('Billing details (same as address)', async () => {
    // Part 3.
    await page.getByTestId('billingAddress').getByRole('button', { name: 'Submit to Continue' }).click();
    await expect(page.getByText('Billing address is the same as shipping').locator('svg')).toBeVisible();
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

export const cartToCheckout = async (page: Page) => {
  await page.getByRole('link', { name: 'Checkout' }).click();
  await page.waitForURL('**/checkout');
}

// For debugging
export const forceWait = async (page: Page, milliseconds: number) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
