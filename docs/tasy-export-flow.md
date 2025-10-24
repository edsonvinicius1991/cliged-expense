# Fluxo Completo de Exportação de Relatório TASY

Este documento descreve detalhadamente o fluxo de informação quando o usuário seleciona o botão para extrair o relatório TASY, incluindo sistemas/módulos envolvidos, formatos de dados, pontos de falha, validações e tempos estimados por etapa.

## Visão Geral
- A exportação é realizada no frontend, gerando um arquivo `.txt` em formato de linhas com campos delimitados por `|` (pipe-separated), conforme convenção interna.
- Não há interação direta com o banco de dados do TASY a partir desta aplicação. A interação ocorre quando o arquivo gerado é importado pelo sistema TASY (etapa externa).

## Sistemas e Módulos
- Usuario (UI): Usuário final que aciona a exportação.
- AdminDashboard.jsx (src/pages/AdminDashboard.jsx): Página com o botão de "Exportar TASY".
- ExportDialog.jsx (src/components/ExportDialog.jsx): Componente que coordena a exportação e chama funções utilitárias.
- exportToTASY (dentro de ExportDialog.jsx): Função principal de validação, normalização e formatação das linhas TASY.
- sessionStorage (Erros): Armazenamento temporário de erros e inconsistências.
- FileSaver (navegador): Mecanismo para criação e download do arquivo `.txt`.
- Sistema TASY (externo): Importa o arquivo gerado e interage com seu banco de dados.

## Sequência de Chamadas
1. Usuário clica em "Exportar TASY" no AdminDashboard.jsx.
2. AdminDashboard abre ExportDialog.jsx com os relatórios selecionados.
3. ExportDialog.jsx invoca `exportToTASY(reports)`.
4. `exportToTASY`:
   - Normaliza CPF: remove caracteres não numéricos; aceita vazio e atribui default `"00000000000"` para exportação.
   - Normaliza unidade: mapeia nomes para códigos TASY.
   - Filtra itens inválidos (valor 0, dados ausentes).
   - Formata data (ddMMyyyy) e valor (duas casas decimais).
   - Monta linhas pipe-separated e agrega em `content`.
   - Coleta `errors` e registra em `sessionStorage`.
5. ExportDialog recebe `{ fileName, content, errors }` e solicita download via FileSaver.
6. Se houver erros, ExportDialog oferece um relatório `.md` gerado por `logAnalyzer.js` (src/lib/logAnalyzer.js).
7. Usuário envia o arquivo `.txt` para o sistema TASY (processo externo), que valida e grava no seu banco de dados.

## Formatos de Dados
- Entrada (ExportDialog -> exportToTASY): `Array<Report>` em JSON.
- Saída (exportToTASY -> ExportDialog): `{ fileName: string, content: string, errors: Array<{type, message, details}> }`.
- Arquivo gerado: `.txt` (UTF-8) com linhas e campos delimitados por `|`.
- Relatório de erros: `.md` (Markdown) textual.
- Armazenamento de erros: `sessionStorage` (JSON serializado).

## Pontos de Falha e Validações
- UI/Click: botão desativado, sem seleção de relatório.
- ExportDialog: estado inconsistente, erros de importação de módulos (ex.: logAnalyzer.js ausente).
- exportToTASY:
  - CPF vazio/inválido: tratado com default `"00000000000"` e log.
  - Unidade sem mapeamento: log de erro e possível exclusão da linha.
  - Itens com valor 0: ignorar.
  - Datas inválidas: log e substituição por data padrão ou exclusão.
- FileSaver: bloqueios de pop-up/download do navegador.
- TASY (externo): rejeição na importação por formato/códigos inválidos; divergências de CPF/unidade.

## Tempos Estimados
- Clique e abertura do diálogo: ~10–80 ms.
- Processamento (exportToTASY) para 50–200 itens: ~50–300 ms.
- Geração e download do `.txt`: ~10–50 ms.
- Upload e processamento no TASY (externo): ~1–5 s (dependendo da infraestrutura).

## Diagrama UML
Consulte o arquivo PlantUML:
- `docs/tasy-export-sequence.puml`

## Observações
- O módulo `logAnalyzer.js` foi criado em `src/lib/logAnalyzer.js` para suportar a geração de relatório de erros.
- Caso o ambiente reporte `net::ERR_ABORTED` ao carregar `src/lib/logAnalyzer`, verifique se o caminho e o nome do arquivo estão corretos e se o bundler (Vite) detectou o novo arquivo (reinicie o servidor se necessário).