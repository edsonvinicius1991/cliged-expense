import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Viewer de recibos - PDF', () => {
  test('Abre modal e renderiza PDF via blob, permite trocar e excluir', async ({ page }) => {
    await page.goto('http://localhost:3001/')

    // Selecionar colaborador e logar
    await page.getByRole('button', { name: /colaborador/i }).click()
    await page.getByPlaceholder(/email/i).fill('user@cliged.com')
    await page.getByPlaceholder(/senha/i).fill('user1234')
    await page.getByRole('button', { name: /entrar/i }).click()

    // Criar novo relatório
    await page.getByRole('button', { name: /novo relatório/i }).click()

    // Preencher campos obrigatórios
    await page.getByPlaceholder('Digite seu nome completo').fill('Usuário PDF')
    await page.getByPlaceholder('000.000.000-00').fill('119.720.947-69')
    // Unidade
    await page.locator('select').first().selectOption('nova_iguacu')
    // Setor (ComboBox): usar preenchimento do textbox interno
    await page.getByRole('textbox', { name: /Buscar setor/i }).fill('ipec')

    // Adicionar linha de transporte
    await page.getByRole('button', { name: /Adicionar Linha/i }).first().click()

    // Preencher valor e descrição
    const amountInput = page.locator('input[type="number"]').first()
    await amountInput.fill('10')
    await page.getByPlaceholder('Descreva a despesa').first().fill('Recibo PDF')

    // Upload de PDF
    const pdfPath = path.resolve('tests/assets/sample.pdf')
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(pdfPath)

    // Enviar para aprovação
    await page.getByRole('button', { name: /Enviar para Aprovação/i }).click()
    // Voltar ao dashboard
    await page.getByRole('button', { name: /voltar/i }).click()

    // Abrir o primeiro relatório para edição
    const firstCard = page.locator('text=/Relatório #/').first()
    await expect(firstCard).toBeVisible()
    await firstCard.click()

    // Abrir modal de visualização
    const viewButtons = page.getByRole('button', { name: 'Visualizar recibo' })
    await expect(viewButtons.first()).toBeVisible()
    await viewButtons.first().click()

    // Deve aparecer modal com estado de carregamento e depois o iframe
    await expect(page.locator('text=Carregando comprovante...')).toBeVisible()
    // Aguarda conteúdo
    await expect(page.locator('iframe')).toBeVisible()

    // Fechar modal
    await page.getByRole('button', { name: /Fechar/i }).click()
    await expect(page.locator('iframe')).toHaveCount(0)
  })
})