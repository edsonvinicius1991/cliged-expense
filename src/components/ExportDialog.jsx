import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { X, Download, FileSpreadsheet, FileText } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Select } from '@/components/ui/select';


    // Funções utilitárias para exportação TASY
    const formatDateDDMMYYYY = (dateIso) => {
      if (!dateIso) return '';
      const date = new Date(dateIso);
      if (isNaN(date.getTime())) return '';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}${month}${year}`;
    };

    const onlyDigits = (str, len) => {
      if (!str) return ''.padStart(len, '0');
      const digits = str.replace(/\D/g, '');
      return digits.padEnd(len, '0').substring(0, len);
    };

    const toCents = (numberLike) => {
      if (numberLike === undefined || numberLike === null) return '0';
      const num = parseFloat(String(numberLike).replace(',', '.'));
      if (isNaN(num)) return '0';
      return Math.round(num * 100).toString();
    };


    // Mapeamento de unidades para códigos TASY conforme documento de referência
    const unitToTasyCodeMap = {
      'macaé': '062',
      'cabo frio': '064',
      'barra da tijuca': '066',
      'são gonçalo': '082',
      'nova iguaçu': '105',
      'duque de caxias': '106',
      'campos dos goytacazes': '107',
      'volta redonda': '108',
      'rio das ostras': '122',
      'mental care': '125',
      'ipanema': '142',
      'ipec': '009',
      'todos': '999'
    };


    /**
     * Obtém o código TASY para uma unidade
     * @param {string} unitName - Nome da unidade
     * @returns {string} - Código TASY com 3 dígitos
     */
    const getTasyCode = (unitName) => {
      if (!unitName) return '';
      
      // Normaliza o nome da unidade removendo prefixos e espaços extras
      const normalizedUnitName = unitName.toLowerCase()
        .replace('cliged ', '')
        .trim();
      
      // Obtém o código do mapa de unidades
      // Os códigos já estão padronizados com 3 dígitos no mapa
      return unitToTasyCodeMap[normalizedUnitName] || '';
    };


    const ExportDialog = ({ type, reports, onClose }) => {
      const [status, setStatus] = useState('all');
      const { toast } = useToast();


      /**
     * Exporta um relatório para o formato TASY conforme especificação do documento
     * "Documento_Importacao_Titulos_a_Pagar.odt"
     * 
     * @param {Object} report - Relatório a ser exportado
     * @returns {Array<string>} - Array com a linha formatada para TASY
     */
    const exportToTASY = (report) => {
        // Validações iniciais
        if (!report) {
            console.error('Relatório inválido para exportação TASY');
            return [];
        }
        
        // Validação de CPF
        const cpf = onlyDigits(report.cpf, 11);
        if (!cpf || cpf.length !== 11) {
            console.warn(`CPF inválido no relatório ${report.id}: ${report.cpf}`);
            // Continuamos com o CPF disponível, mesmo que inválido
        }
        
        // Validação de unidade
        const cdEstabelecimento = getTasyCode(report.unit);
        if (!cdEstabelecimento) {
            console.warn(`Unidade não mapeada para código TASY: ${report.unit}`);
            // Continuamos com código vazio
        }
        
        // Calcula data de vencimento (data + 30 dias)
        const calculateDueDate = (dateIso) => {
            if (!dateIso) return '';
            const date = new Date(dateIso);
            if (isNaN(date.getTime())) return '';
            
            // Adiciona 30 dias à data
            date.setDate(date.getDate() + 30);
            
            return formatDateDDMMYYYY(date.toISOString());
        };
        
        const dueDateStr = calculateDueDate(report.date);
        
        // Inicializa array com campos vazios conforme layout do documento
        const fields = Array(55).fill('');
        
        try {
            // Campos obrigatórios conforme ordem especificada
            fields[0] = '|T';                                // 1. DS_TIPO
            fields[1] = report.id || '';                    // 2. NR_TITULO_EXTERNO
            fields[2] = formatDateDDMMYYYY(report.date);    // 3. DT_EMISSAO
            fields[3] = cdEstabelecimento;                  // 4. CD_ESTABELECIMENTO
            fields[4] = '';                                 // 5. CD_CGC
            fields[5] = '';                                 // 6. CD_CONTA_CONTABIL
            fields[6] = '';                                 // 7. CD_BANCO_PORTADOR
            fields[7] = '';                                 // 8. CD_ESTAB_FINANCEIRO
            fields[8] = '1';                                // 9. CD_MOEDA
            fields[9] = cpf;                                // 10. CD_PESSOA_FISICA
            fields[10] = '';                                // 11. CD_TIPO_BAIXA_NEG
            fields[11] = '';                                // 12. CD_TIPO_TAXA_ANTECIPACAO
            fields[12] = '2';                               // 13. CD_TIPO_TAXA_JURO
            fields[13] = '1';                               // 14. CD_TIPO_TAXA_MULTA
            fields[14] = '';                                // 15. CD_TRIBUTO
            fields[15] = '';                                // 16. DS_COMPL_CONTAB
            fields[16] = '';                                // 17. DS_OBSERVACAO_TITULO
            fields[17] = '';                                // 18. DS_STACK
            fields[18] = '';                                // 19. DT_CONTABIL
            fields[19] = '';                                // 20. DT_INCLUSAO
            fields[20] = '';                                // 21. DT_INTEGRACAO_EXTERNA
            fields[21] = '';                                // 22. DT_LIMITE_ANTECIPACAO
            fields[22] = '';                                // 23. DT_LIQUIDACAO
            fields[23] = '';                                // 24. DT_ULTIMA_DEVOLUCAO
            fields[24] = dueDateStr;                        // 25. DT_VENCIMENTO_ATUAL
            fields[25] = dueDateStr;                        // 26. DT_VENCIMENTO_ORIGINAL
            fields[26] = '';                                // 27. IE_BLOQUETO
            fields[27] = '';                                // 28. IE_DESCONTO_DIA
            fields[28] = '0';                               // 29. IE_ORIGEM_TITULO
            fields[29] = '';                                // 30. IE_PERIODICIDADE
            fields[30] = '';                                // 31. IE_PLS
            fields[31] = 'A';                               // 32. IE_SITUACAO
            fields[32] = '';                                // 33. IE_STATUS_TRIBUTO
            fields[33] = '10';                              // 34. IE_TIPO_TITULO
            fields[34] = '';                                // 35. NR_BLOQUETO
            fields[35] = '';                                // 36. NR_BLOQUETO_LEITURA
            fields[36] = '';                                // 37. NR_CONTA
            fields[37] = '';                                // 38. NR_DOCUMENTO
            fields[38] = '';                                // 39. NR_NOSSO_NUMERO
            fields[39] = '';                                // 40. NR_PARCELAS
            fields[40] = '';                                // 41. NR_SEQ_CLASSE
            fields[41] = '';                                // 42. NR_SEQ_TRANS_FIN_BAIXA
            fields[42] = '';                                // 43. NR_SEQ_TRANS_FIN_CONTAB
            fields[43] = '';                                // 44. NR_TOTAL_PARCELAS
            fields[44] = '';                                // 45. TX_DESC_ANTECIPACAO
            fields[45] = '0';                               // 46. TX_JUROS
            fields[46] = '0';                               // 47. TX_MULTA
            fields[47] = '';                                // 48. VL_COTACAO
            fields[48] = '';                                // 49. VL_DIA_ANTECIPACAO
            fields[49] = '';                                // 50. VL_OUTROS_ACRESCIMOS
            fields[50] = '0';                               // 51. VL_SALDO_JUROS
            fields[51] = '0';                               // 52. VL_SALDO_MULTA
            fields[52] = toCents(report.totalAmount);       // 53. VL_SALDO_TITULO
            fields[53] = toCents(report.totalAmount);       // 54. VL_TITULO
            fields[54] = '|';                                // 55. VL_TITULO_ESTRANG
        } catch (error) {
            console.error('Erro ao formatar relatório para TASY:', error);
            // Continuamos com os campos que foram preenchidos até o erro
        }
        
        return [fields.join('|')];
    };

    /**
     * Gerencia erros de exportação TASY e exibe relatório
     * @param {Array} errors - Lista de erros encontrados durante a exportação
     */
    const handleExportErrors = (errors = []) => {
        if (!errors || errors.length === 0) {
            toast({
                title: "Exportação concluída com sucesso",
                description: "Não foram encontrados erros durante a exportação."
            });
            return;
        }
        
        // Armazena erros no sessionStorage para possível análise posterior
        sessionStorage.setItem('tasyExportErrors', JSON.stringify(errors));
        
        // Exibe toast com resumo dos erros
        toast({
            title: `Exportação concluída com ${errors.length} avisos`,
            description: "Verifique o console para mais detalhes.",
            variant: "warning"
        });
        
        // Loga erros no console para depuração
        console.warn('Erros na exportação TASY:', errors);
    };

    const handleExport = () => {
        const filteredReports = reports.filter(r => status === 'all' || r.status === status);
        const exportErrors = [];

        if (filteredReports.length === 0) {
            toast({
            title: "Nenhum relatório para exportar",
            description: "A seleção atual não contém relatórios.",
            variant: "destructive"
            });
            return;
        }
        
        if (type === 'tasy') {
            let tasyLines = [];

        // Validação prévia dos relatórios
        filteredReports.forEach(report => {
            // Validação de CPF
            if (!report.cpf || onlyDigits(report.cpf, 11).length !== 11) {
                exportErrors.push({
                    type: 'CPF_INVALIDO',
                    message: `CPF inválido no relatório ${report.id}: ${report.cpf || 'não informado'}`,
                    details: { reportId: report.id, cpf: report.cpf }
                });
            }
            
            // Validação de unidade
            if (!report.unit || !getTasyCode(report.unit)) {
                exportErrors.push({
                    type: 'UNIDADE_NAO_MAPEADA',
                    message: `Unidade não mapeada para código TASY: ${report.unit || 'não informada'}`,
                    details: { reportId: report.id, unit: report.unit }
                });
            }
            
            // Validação de data
            if (!report.date) {
                exportErrors.push({
                    type: 'DATA_AUSENTE',
                    message: `Data ausente no relatório ${report.id}`,
                    details: { reportId: report.id }
                });
            }
            
            // Validação de valor
            if (isNaN(parseFloat(String(report.totalAmount).replace(',', '.')))) {
                exportErrors.push({
                    type: 'VALOR_INVALIDO',
                    message: `Valor inválido no relatório ${report.id}: ${report.totalAmount}`,
                    details: { reportId: report.id, totalAmount: report.totalAmount }
                });
            }
        });

        // Processa todos os relatórios - uma linha por relatório
        filteredReports.forEach(report => {
            try {
                const lines = exportToTASY(report);
                tasyLines = tasyLines.concat(lines);
            } catch (error) {
                exportErrors.push({
                    type: 'ERRO_PROCESSAMENTO',
                    message: `Erro ao processar relatório ${report.id}: ${error.message}`,
                    details: { reportId: report.id, error: error.toString() }
                });
                console.error(`Erro ao processar relatório ${report.id}:`, error);
            }
        });
        
        // Sempre permite exportação, mesmo com lista vazia
        if (tasyLines.length === 0) {
            // Cria pelo menos uma linha vazia para garantir que o arquivo seja gerado
            const emptyFields = Array(55).fill('');
            emptyFields[0] = 'T';
            tasyLines.push(emptyFields.join('|'));
            
            if (filteredReports.length > 0) {
                exportErrors.push({
                    type: 'NENHUMA_LINHA_GERADA',
                    message: 'Nenhuma linha foi gerada para os relatórios selecionados',
                    details: { reportCount: filteredReports.length }
                });
            }
        }
        
        const tasyContent = tasyLines.join("\r\n");
        const encodedUri = encodeURI("data:text/plain;charset=utf-8," + tasyContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TASY_export_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Trata erros de exportação
        if (exportErrors.length > 0) {
            handleExportErrors(exportErrors);
        } else {
            toast({ 
                title: "Exportação TASY concluída!", 
                description: "Seu arquivo .txt foi baixado no formato padrão TASY conforme especificação." 
            });
        }


        } else if (type === 'csv') {
            exportToCSV(filteredReports);
        } else {
            toast({
            title: "🚧 Exportação em PDF em breve!",
            description: "Por enquanto, use a exportação CSV ou TASY."
            });
        }
        onClose();
        };


    const exportToCSV = (data) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["ID do Relatorio", "Colaborador", "CPF do Colaborador", "Data", "Unidade", "Código Estabelecimento", "Setor", "Status", "Total Despesas", "Total Adiantamentos", "A Receber", "A Devolver", "ID Despesa", "Categoria Despesa", "Data Despesa", "Descricao Despesa", "Valor Despesa"];
        csvContent += headers.join(",") + "\r\n";


        data.forEach(report => {
        const tasyCode = getTasyCode(report.unit);
        const reportBase = [report.id, report.userName, report.cpf || '', report.date, report.unit, tasyCode, report.sector, report.status, report.totalAmount, report.totalAdvances, report.toReceive, report.toReturn];
        const allItems = [
        ...(report.transport || []).map(i => ({...i, category: 'Transporte'})),
        ...(report.food || []).map(i => ({...i, category: 'Alimentacao'})),
        ...(report.miscellaneous || []).map(i => ({...i, category: 'Despesas com Viagem'})),
        ...(report.advances || []).map(i => ({...i, category: 'Despesas com Treinamento'})),
        ];


        if (allItems.length > 0) {
        allItems.forEach(item => {
        const itemRow = [item.id, item.category, item.date, `"${item.description}"`, item.amount];
        csvContent += reportBase.join(",") + "," + itemRow.join(",") + "\r\n";
        });
        } else {
        csvContent += reportBase.join(",") + ",,,,, \r\n";
        }
        });


        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `relatorios_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);


        toast({ title: "Exportação concluída!", description: "Seu arquivo CSV foi baixado." });
        };


        const Icon = type === 'csv' ? FileSpreadsheet : FileText;
        const title = type === 'tasy' ? 'Exportar para TASY (.txt)' : (type === 'csv' ? 'Exportar para CSV' : 'Gerar Relatório PDF');


        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-border relative"
        >
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:bg-accent">
        <X className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">Selecione os filtros para a exportação.</p>
        </div>
        </div>


        <div className="space-y-4">
        <div>
        <Label htmlFor="status-filter">Filtrar por Status</Label>
        <Select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1">
        <option value="all">Todos os Status</option>
        <option value="pending">Pendentes</option>
        <option value="approved">Aprovados</option>
        <option value="rejected">Rejeitados</option>
        </Select>
        </div>
        </div>


        <div className="mt-8 flex justify-end">
        <Button onClick={handleExport} className="bg-primary hover:bg-primary/90 text-primary-foreground">
        <Download className="w-4 h-4 mr-2" />
        Exportar Dados
        </Button>
        </div>
        </motion.div>
        </div>
        );
        };


        export default ExportDialog;