import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, Download, FileText, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

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

import { db } from '@/lib/supabase';

const ReportDetailsView = ({ report, onBack }) => {
  const { toast } = useToast();
  const [detail, setDetail] = useState(report || null);
  const [items, setItems] = useState([]);

  // Carregar detalhes do relatório e itens a partir da base
  useEffect(() => {
    const load = async () => {
      try {
        if (!report?.id) {
          setDetail(report || null);
          setItems([]);
          return;
        }
        const dbReport = await db.expenseReports.getById(report.id);
        setDetail(dbReport || report);
        const mapped = Array.isArray(dbReport?.expense_items)
          ? dbReport.expense_items.map(it => ({
              id: it.id,
              category: it.category,
              date: it.expense_date,
              description: it.description,
              amount: it.amount,
              receipt_url: it.receipt_url,
              receipt_filename: it.receipt_filename,
            }))
          : [];
        setItems(mapped);
      } catch (e) {
        console.error('Falha ao carregar detalhes:', e);
        setDetail(report || null);
        setItems([]);
      }
    };
    load();
  }, [report]);

  const allExpenses = useMemo(() => {
    if (items?.length) return items;
    // Fallback para estrutura antiga
    const expenses = [
      ...(detail?.transport || []).map(item => ({ ...item, category: 'Transporte' })),
      ...(detail?.food || []).map(item => ({ ...item, category: 'Alimentação' })),
      ...(detail?.miscellaneous || []).map(item => ({ ...item, category: 'Despesas com Viagem' })),
      ...(detail?.advances || []).map(item => ({ ...item, category: 'Despesas com Treinamento' })),
    ];
    return expenses;
  }, [items, detail]);

  const stats = useMemo(() => {
    const status = (detail?.status || 'PENDENTE').toString().toUpperCase();
    const total = Number(detail?.total_amount || 0);
    return {
      submitted: total,
      approved: status === 'APROVADO' ? total : 0,
      rejected: status === 'REJEITADO' ? total : 0,
      pending: status === 'PENDENTE' ? total : 0,
    };
  }, [detail]);

  const pieData = [
    { name: 'Aprovado', value: stats.approved, color: '#95B8A3' },
    { name: 'Rejeitado', value: stats.rejected, color: '#C49BA3' },
    { name: 'Pendente', value: stats.pending, color: '#E8C4A3' },
  ].filter(d => d.value > 0);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleDownload = (receiptData, expense) => {
    if (!receiptData) {
      toast({ title: "Nenhum comprovante para baixar.", variant: "destructive" });
      return;
    }
    const link = document.createElement('a');
    link.href = receiptData;
    const fileType = receiptData.split(';')[0].split('/')[1].split('+')[0] || 'jpg';
    const fileName = `${report.userName.replace(' ', '_')}_${expense.category}_${new Date(expense.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.${fileType}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTasyExport = () => {
    if (!report.cpf || report.cpf.length !== 14) {
        toast({ title: "CPF Inválido", description: "É necessário um CPF válido para a exportação TASY.", variant: "destructive" });
        return;
    }

    const cd_estabelecimento = getTasyCode(report.unit);
    if (!cd_estabelecimento) {
        toast({ title: "Mapeamento de Unidade Falhou", description: `A unidade '${report.unit}' não pôde ser mapeada para um código TASY.`, variant: "destructive" });
        return;
    }

    const formatDate = (dateString) => {
        const [year, month, day] = dateString.split('-');
        return `${day}${month}${year}`;
    };

    const formatValue = (value) => Math.round((parseFloat(value) || 0) * 100);

    const fields = new Array(65).fill('');
    
    // Official TASY format based on user request
    fields[0] = 'T'; // DS_TIPO
    fields[1] = report.id; // NR_TITULO_EXTERNO
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
    const totalValue = formatValue(report.totalAmount);
    fields[60] = totalValue; // VL_TITULO
    fields[61] = totalValue; // VL_SALDO_TITULO

    const tasyContent = `|${fields.join('|')}||`;
    const encodedUri = encodeURI("data:text/plain;charset=utf-8," + tasyContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TASY_${report.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Exportação TASY concluída!", description: "Seu arquivo .txt foi baixado." });
  };


  const getStatusBadge = (status) => {
    const badges = {
      PENDENTE: { label: 'Pendente', color: 'bg-warning text-warning-foreground', icon: Clock },
      APROVADO: { label: 'Aprovado', color: 'bg-success text-success-foreground', icon: CheckCircle },
      REJEITADO: { label: 'Rejeitado', color: 'bg-destructive text-destructive-foreground', icon: XCircle },
    };
    const badge = badges[(status || '').toString().toUpperCase()] || badges.PENDENTE;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };
  
  const StatCard = ({ title, value, color, icon: Icon }) => (
    <div className={`bg-white rounded-lg shadow-custom-light border border-border p-5`}>
        <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{title}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
        </div>
        <p className="text-2xl font-bold text-foreground mt-2">{formatCurrency(value)}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-5 h-5 mr-2" />Voltar</Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Detalhes do Relatório</h1>
              <p className="text-sm text-muted-foreground">Relatório de {detail?.userName || detail?.employee_name || ''} - {detail?.submission_date ? new Date(detail.submission_date).toLocaleDateString('pt-BR') : (detail?.created_at ? new Date(detail.created_at).toLocaleDateString('pt-BR') : '')}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleTasyExport}>
            <FileText className="w-4 h-4 mr-2" /> Exportar TASY (.txt)
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Submetido" value={stats.submitted} color="text-primary" icon={FileText} />
                <StatCard title="Aprovado" value={stats.approved} color="text-secondary" icon={CheckCircle} />
                <StatCard title="Rejeitado" value={stats.rejected} color="text-destructive" icon={XCircle} />
                <StatCard title="Pendente" value={stats.pending} color="text-warning-foreground" icon={Clock} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-custom-light border border-border">
                    <h3 className="text-lg font-bold text-foreground mb-4">Status do Relatório</h3>
                    <div className="h-64">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                        ) : <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum dado para exibir.</div>
                      }
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-custom-light border border-border">
                    <h3 className="text-lg font-bold text-foreground mb-4">Informações Gerais</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                        <div><p className="text-muted-foreground">Colaborador</p><p className="font-semibold text-foreground">{detail?.userName || detail?.employee_name || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">CPF</p><p className="font-semibold text-foreground">{detail?.cpf || detail?.employee_cpf || 'N/A'}</p></div>
                        <div><p className="text-muted-foreground">Unidade</p><p className="font-semibold text-foreground">{detail?.unit || detail?.department || ''}</p></div>
                        <div><p className="text-muted-foreground">Setor</p><p className="font-semibold text-foreground">{detail?.sector || detail?.project_code || ''}</p></div>
                        <div><p className="text-muted-foreground">Data de Envio</p><p className="font-semibold text-foreground">{detail?.submission_date ? new Date(detail.submission_date).toLocaleString('pt-BR') : (detail?.created_at ? new Date(detail.created_at).toLocaleString('pt-BR') : 'N/A')}</p></div>
                        <div className="col-span-2 md:col-span-3"><p className="text-muted-foreground">Motivo da Decisão</p><p className="font-semibold text-foreground">{detail?.rejection_reason || ((detail?.status || '').toString().toUpperCase() === 'APROVADO' ? 'Aprovado sem ressalvas.' : 'Aguardando avaliação.')}</p></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-custom-light border border-border">
                <div className="p-5 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">Itens de Despesa</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-foreground uppercase bg-muted">
                            <tr>
                                <th className="px-6 py-3 text-left">Categoria</th>
                                <th className="px-6 py-3 text-left">Data</th>
                                <th className="px-6 py-3 text-left">Descrição</th>
                                <th className="px-6 py-3 text-right">Valor</th>
                                <th className="px-6 py-3 text-center">Comprovante</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-foreground">
                            {allExpenses.map((expense, index) => (
                                <tr key={expense.id || index} className="border-b border-border hover:bg-muted">
                                    <td className="px-6 py-4 font-medium">{expense.category}</td>
                                    <td className="px-6 py-4">{expense.date ? new Date(expense.date).toLocaleDateString('pt-BR') : ''}</td>
                                    <td className="px-6 py-4 max-w-xs truncate">{expense.description}</td>
                                    <td className="px-6 py-4 text-right font-mono">{formatCurrency(expense.amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {expense.receipt_url ? (
                                            <Button variant="outline" size="sm" onClick={() => window.open(expense.receipt_url, '_blank')}>
                                                <Download className="w-4 h-4" /> Download
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">{getStatusBadge(detail?.status)}</td>
                                </tr>
                            ))}
                            {allExpenses.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-muted-foreground">Nenhuma despesa neste relatório.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ReportDetailsView;