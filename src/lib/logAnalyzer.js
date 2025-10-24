// Utilitário de análise e geração de relatório de erros da exportação TASY
// Este módulo é referenciado por ExportDialog.jsx

/**
 * Analisa e categoriza erros capturados durante a exportação.
 * @param {Array<{type?: string, message?: string, details?: any}>} errors
 * @returns {{ analyzed: true, count: number, summary: Record<string, number> }}
 */
export const analyzeErrors = (errors = []) => {
  const summary = {};
  for (const err of errors) {
    const t = err?.type || 'Desconhecido';
    summary[t] = (summary[t] || 0) + 1;
  }
  return { analyzed: true, count: errors.length, summary };
};

/**
 * Gera um relatório em Markdown com os erros detectados durante a exportação.
 * @param {Array<{type?: string, message?: string, details?: any}>} errors
 * @returns {string}
 */
export const generateMarkdownReport = (errors = []) => {
  const header = [
    '# Relatório de Erros da Exportação TASY',
    '',
    `Total de erros: ${errors.length}`,
    '',
  ].join('\n');

  if (errors.length === 0) {
    return header + '\nNenhum erro encontrado durante a exportação.';
  }

  const lines = [header, '## Detalhamento', ''];
  errors.forEach((err, i) => {
    lines.push(`### Erro ${i + 1}`);
    lines.push(`- Tipo: ${err?.type || 'Desconhecido'}`);
    lines.push(`- Mensagem: ${err?.message || 'N/A'}`);
    if (err?.details) {
      lines.push(`- Detalhes: \n\n\`\`\`json\n${JSON.stringify(err.details, null, 2)}\n\`\`\``);
    }
    lines.push('');
  });

  return lines.join('\n');
};