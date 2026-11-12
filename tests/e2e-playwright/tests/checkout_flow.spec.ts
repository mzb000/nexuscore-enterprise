import { test, expect } from '@playwright/test';

test.describe('Enterprise E-Commerce User Journey', () => {
  test('User can browse products, add to cart, and chat with AI Concierge', async ({ page }) => {
    // 1. Visit Storefront
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/NexusCore/);

    // 2. Verify Product Catalog is rendered
    const productCards = page.locator('h3');
    await expect(productCards.first()).toBeVisible();

    // 3. Add first item to cart
    const addToCartButton = page.getByRole('button', { name: /Add to Cart/i }).first();
    await addToCartButton.click();

    // 4. Verify cart badge increments
    const cartBadge = page.locator('header span:has-text("1")');
    await expect(cartBadge).toBeVisible();

    // 5. Open AI Concierge Drawer
    const aiButton = page.getByRole('button', { name: /AI Concierge/i });
    await aiButton.click();

    // 6. Verify Drawer is open
    await expect(page.getByText('AI Concierge & RAG Agent')).toBeVisible();
  });
});
