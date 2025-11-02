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

    // Validar no banco: CPF normalizado (apenas dígitos)
    const { data: user } = await sb.auth.signInWithPassword({ email: 'user@cliged.com', password: 'user1234' })
    expect(user?.user?.id).toBeTruthy()

    const { data: reports } = await sb
      .from('expense_reports')
      .select('id, employee_cpf')
      .eq('user_id', user!.user!.id)
      .order('created_at', { ascending: false })
      .limit(1)

    expect(reports && reports.length > 0).toBeTruthy()
    expect(reports![0].employee_cpf).toMatch(/^[0-9]{11}$/)
    expect(reports![0].employee_cpf).toBe('12345678909')
  })
})
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY as string

const sb = createClient(SUPABASE_URL, SUPABASE_ANON)