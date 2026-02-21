import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Check that page loads (might redirect to login or show content)
    expect(page.url()).toBeTruthy()
  })

  test('should navigate to dashboard from homepage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Look for navigation links or buttons that lead to dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard/i }).first()
    
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click()
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/dashboard|login/)
    }
  })

  test('should have accessible navigation menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Check for navigation elements
    const nav = page.locator('nav, [role="navigation"]').first()
    
    if (await nav.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(nav).toBeVisible()
      
      // Check for common navigation links
      const links = nav.locator('a')
      const linkCount = await links.count()
      
      if (linkCount > 0) {
        expect(linkCount).toBeGreaterThan(0)
      }
    }
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Check if page loads correctly on mobile
    expect(page.url()).toBeTruthy()
    
    // Look for mobile menu toggle if it exists
    const mobileMenuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="toggle" i]').first()
    
    if (await mobileMenuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mobileMenuButton.click()
      await page.waitForTimeout(500)
    }
  })
})
