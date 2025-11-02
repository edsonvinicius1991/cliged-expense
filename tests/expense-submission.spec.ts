import { test, expect } from '@playwright/test'

test.describe('Submissão e edição de relatório', () => {
  test('Usuário colaborador submete relatório com Nome e CPF e edita com dados preenchidos', async ({ page }) => {
    // Acessar app
    await page.goto('http://localhost:3001/')

    // Selecionar colaborador
    await page.getByRole('button', { name: /colaborador/i }).click()

    // Login
    await page.getByPlaceholder('Email').fill('user@cliged.com')
    await page.getByPlaceholder('Senha').fill('user1234')
    await page.getByRole('button', { name: /entrar/i }).click()

    // Criar novo relatório
    await page.getByRole('button', { name: /novo relatório/i }).click()

    // Preencher Nome e CPF
    await page.getByPlaceholder('Digite seu nome completo').fill('Usuário Teste')
    await page.getByPlaceholder('000.000.000-00').fill('123.456.789-09')

    // Preencher unidade e setor
    await page.getByRole('combobox').first().selectOption('nova_iguacu')
    await page.getByRole('textbox', { name: /Selecione um setor/i }).fill('ipec')

    // Adicionar uma despesa de transporte
    await page.getByRole('button', { name: /transporte/i }).click()
    await page.getByRole('button', { name: /adicionar linha/i }).click()

    // Preencher a linha
    const inputs = await page.locator('input[type="number"]').all()
    await inputs[0].fill('25')
    await page.getByPlaceholder('Descreva a despesa').fill('Uber até clínica')

    // Enviar para aprovação
    await page.getByRole('button', { name: /enviar para aprovação/i }).click()

    // Voltar ao dashboard
    await page.getByRole('button', { name: /voltar/i }).click()

    // Conferir se o relatório aparece e abrir para edição
    const card = page.locator('text=/Relatório #/').first()
    await expect(card).toBeVisible()
    await card.click()

    // Verificar se o formulário está preenchido
    await expect(page.getByPlaceholder('Digite seu nome completo')).toHaveValue('Usuário Teste')
    await expect(page.getByPlaceholder('000.000.000-00')).toHaveValue('123.456.789-09')
    await expect(page.getByRole('combobox').first()).toHaveValue('nova_iguacu')
  })
})