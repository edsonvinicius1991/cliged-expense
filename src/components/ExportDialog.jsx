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
        if (!report.cpf || report.cpf.length !== 14) {
          toast({ title: "CPF Inválido", description: `O relatório ${report.id} não possui um CPF válido.`, variant: "destructive" });
          return [];
        }


        const cd_estabelecimento = getTasyCode(report.unit);
        if (!cd_estabelecimento) {
          toast({ title: "Mapeamento de Unidade Falhou", description: `A unidade '${report.unit}' no relatório ${report.id} não pôde ser mapeada para um código TASY.`, variant: "destructive" });
          return [];
        }


        const formatDate = (dateString) => {
          const [year, month, day] = dateString.split('-');
          return `${day}${month}${year}`;
        };


        const formatValue = (value) => {
          return Math.round((parseFloat(value) || 0) * 100);
        };
        
        const allItems = [
          ...(report.transport || []),
          ...(report.food || []),
          ...(report.miscellaneous || []),
          ...(report.advances || []),
        ];


        if (allItems.length === 0) {
            return [];
        }


        const reportLines = allItems.map((item, index) => {
            const fields = new Array(65).fill('');
            const sequentialId = `${report.id}-${String(index + 1).padStart(3, '0')}`;
            
            // Official TASY format based on user request
            fields[0] = 'T'; // DS_TIPO
            fields[1] = sequentialId; // NR_TITULO_EXTERNO (sequencial por item)
            fields[2] = formatDate(report.date); // DT_EMISSAO
            fields[3] = cd_estabelecimento; // CD_ESTABELECIMENTO
            fields[4] = report.cpf.replace(/[^\d]/g, ''); // CD_CGC (CPF/CNPJ)
            // fields[5] is empty
            fields[6] = '2'; // Static value
            // fields[7] is empty
            fields[8] = '1'; // Static value
            // fields[9-12] are empty
            fields[13] = '2'; // Static value
            fields[14] = '1'; // Static value
            // fields[15-26] are empty
            fields[27] = formatDate(report.date); // DT_VENCIMENTO_ATUAL
            fields[28] = formatDate(report.date); // DT_VENCIMENTO_ORIGINAL
            // fields[29-30] are empty
            fields[31] = '0'; // Static value
            // fields[32-33] are empty
            fields[34] = 'A'; // Static value
            // fields[35-36] are empty
            fields[37] = '10'; // Static value
            // fields[38-51] are empty
            fields[52] = '0'; // Static value
            fields[53] = '0'; // Static value
            // fields[54-57] are empty
            fields[58] = '0'; // Static value
            fields[59] = '0'; // Static value
            const itemValue = formatValue(item.amount);
            fields[60] = itemValue; // VL_TITULO (valor do item individual)
            fields[61] = itemValue; // VL_SALDO_TITULO (valor do item individual)


            return `|${fields.join('|')}||`;
        });
        
        return reportLines;
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
          let hasErrors = false;


          filteredReports.forEach(report => {
              const lines = exportToTASY(report);
              if (lines.length > 0) {
                  tasyLines = tasyLines.concat(lines);
              } else if (report.status === 'approved' && (!report.cpf || report.cpf.length !== 14 || !getTasyCode(report.unit))) {
                  // This condition checks if an error was already toasted inside exportToTASY.
                  hasErrors = true;
              }
          });
          
          if (hasErrors) {
              toast({ title: "Exportação Incompleta", description: "Alguns relatórios não puderam ser exportados. Verifique as notificações de erro.", variant: "destructive" });
          }
          
          if (tasyLines.length === 0) {
              if (!hasErrors) {
                toast({ title: "Exportação Falhou", description: "Nenhum item de despesa válido para exportar no formato TASY.", variant: "destructive" });
              }
              return;
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