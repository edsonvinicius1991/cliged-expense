import React, { useState } from 'react';
    import { motion } from 'framer-motion';
    import { X, Download, FileSpreadsheet, FileText } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { Select } from '@/components/ui/select';


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


    const getTasyCode = (unitName) => {
      if (!unitName) return '';
      const normalizedUnitName = unitName.toLowerCase()
        .replace('cliged ', '')
        .trim();
      return unitToTasyCodeMap[normalizedUnitName] || '';
    };


    const ExportDialog = ({ type, reports, onClose }) => {
      const [status, setStatus] = useState('all');
      const { toast } = useToast();


      const exportToTASY = (report) => {
        // Sem validações - aceita qualquer formato de dados
        
        // Normalização básica de CPF (sem validação)
        let cleanCpf = report.cpf ? report.cpf.replace(/\D/g, '') : '00000000000';
        // Garante que sempre terá 11 dígitos (sem validação)
        cleanCpf = cleanCpf.padEnd(11, '0').substring(0, 11);
        
        // Usa todos os itens sem filtrar por validade
        const allItems = [
          ...(report.transport || []),
          ...(report.food || []),
          ...(report.miscellaneous || []),
          ...(report.advances || []),
        ];
        
        // Se não houver itens, cria pelo menos uma linha com valores vazios
        if (allItems.length === 0) {
          allItems.push({ amount: 0, date: report.date || new Date().toISOString().split('T')[0] });
        }
        
        const reportLines = allItems.map(item => {
            const fields = Array(62).fill('');
            fields[0] = 'T'; // Tipo de registro
            fields[1] = cleanCpf; // CPF do colaborador
            fields[2] = report.name || ''; // Nome do colaborador
            
            // Usa código da unidade sem validação ou mapeamento
            const unitCode = getTasyCode(report.unit) || ''; 
            fields[3] = unitCode; // Código da unidade sem validação
            fields[4] = report.unit || ''; // Nome da unidade
            
            // Aceita qualquer formato de data
            const dateStr = item.date ? item.date.toString() : '';
            fields[5] = dateStr; // Data sem formatação específica
            
            // Aceita qualquer valor, inclusive zero ou negativo
            const amountStr = item.amount !== undefined ? String(item.amount).replace('.', ',') : '0';
            fields[6] = amountStr; // Valor sem validação
            
            fields[7] = item.description || ''; // Descrição da despesa
            fields[8] = report.id || ''; // ID do relatório
            
            return fields.join('|');
        });
        
        return reportLines;
    };

    // Função simplificada sem validações ou relatórios de erro
    const handleExportErrors = () => {
        alert('Exportação concluída com sucesso. Não há validações ou erros para exibir.');
    };

    const handleExport = () => {
        const filteredReports = reports.filter(r => status === 'all' || r.status === status);


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

        // Processa todos os relatórios sem validações
        filteredReports.forEach(report => {
            const lines = exportToTASY(report);
            tasyLines = tasyLines.concat(lines);
        });
        
        // Sempre permite exportação, mesmo com lista vazia
        if (tasyLines.length === 0) {
            // Cria pelo menos uma linha vazia para garantir que o arquivo seja gerado
            tasyLines.push('T|00000000000||||||||');
        }
        
        const tasyContent = tasyLines.join("\r\n");
        const encodedUri = encodeURI("data:text/plain;charset=utf-8," + tasyContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TASY_export_${new Date().toISOString().split('T')[0]}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportação TASY concluída!", description: "Seu arquivo .txt foi baixado." });


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