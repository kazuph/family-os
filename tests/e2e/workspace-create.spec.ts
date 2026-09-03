import { expect, test } from '@playwright/test'

test('creates a workspace from the workspace list without returning home', async ({ page }) => {
  await page.goto('/workspaces')

  const createButton = page.getByRole('button', {
    name: /Create workspace|ワークスペースを作成/,
  })
  const onboarding = page.getByRole('heading', { name: /Let's set you up|はじめの設定/ })

  // Dev auto-login stores the real local session asynchronously after the first render. Reload
  // once that session exists so this run uses the authenticated app rather than the login screen.
  await expect(page.getByRole('heading', { name: 'Family OS' })).toBeVisible()
  await page.waitForFunction(() => localStorage.getItem('authToken') !== null)
  await page.reload()

  await expect(onboarding.or(createButton)).toBeVisible()
  if (await onboarding.isVisible()) {
    const next = page.getByRole('button', { name: /Next|次へ/ })
    while (await next.isVisible()) await next.click()
    await page.getByRole('button', { name: /Let's build|はじめる/ }).click()
    await expect(onboarding).toBeHidden()
  }

  await page.goto('/workspaces')
  await expect(createButton).toBeVisible()
  await createButton.click()

  await expect(page).toHaveURL(/\/workspace\/[^/?#]+/)
  await expect(page.getByRole('button', { name: 'Chat', exact: true }))
    .toHaveAttribute('aria-current', 'page')
})
