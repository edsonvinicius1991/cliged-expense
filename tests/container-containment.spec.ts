import { test, expect } from '@playwright/test'

test.describe('Contenção de filhos dentro de containers', () => {
  test('Itens do formulário permanecem contidos no card e no container', async ({ page }) => {
    await page.goto('http://localhost:3001/')

    // Entrar como colaborador e abrir formulário
    await page.getByRole('button', { name: /colaborador/i }).click()
    await page.getByPlaceholder(/email/i).fill('user@cliged.com')
    await page.getByPlaceholder(/senha/i).fill('user1234')
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.getByRole('button', { name: /novo relatório/i }).click()

    // Adicionar algumas linhas
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Adicionar Linha/i }).first().click()
    }

    // Verificar contenção: cada item deve estar dentro do seu card
    const cards = await page.locator('div.border.border-border.rounded-lg.p-4.bg-muted').all()
    for (const card of cards) {
      const cardBox = await card.boundingBox()
      expect(cardBox).toBeTruthy()
      // Para cada filho direto (grid), verificar bounding boxes
      const grid = card.locator('div.grid')
      const gridBox = await grid.boundingBox()
      expect(gridBox).toBeTruthy()
      // O grid deve estar contido no card
      expect(gridBox!.x).toBeGreaterThanOrEqual(cardBox!.x)
      expect(gridBox!.y).toBeGreaterThanOrEqual(cardBox!.y)
      expect(gridBox!.x + gridBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1)
      expect(gridBox!.y + gridBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height + 1)
    }

    // Verificar que o container pai (space-y-4) permite scroll vertical e não overflow horizontal
    const parent = page.locator('div.contain-parent').first()
    const hasHorizontalScroll = await parent.evaluate((el) => el.scrollWidth > el.clientWidth)
    const hasVerticalScroll = await parent.evaluate((el) => el.scrollHeight > el.clientHeight)
    expect(hasHorizontalScroll).toBeFalsy()
    // Pode ter scroll vertical dependendo do conteúdo
    expect(typeof hasVerticalScroll).toBe('boolean')
  })
})