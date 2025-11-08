import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, Utensils, PiggyBank, FileText, CheckCircle, XCircle } from 'lucide-react';

const ExpenseChart = ({ reports }) => {
  const chartData = useMemo(() => {
    const normalizeStatusKey = (status) => {
      const s = (status || '').toString().trim().toUpperCase();
      if (s === 'PENDENTE' || s === 'PENDING') return 'pending';
      if (s === 'APROVADO' || s === 'APPROVED') return 'approved';
      if (s === 'REJEITADO' || s === 'REJECTED') return 'rejected';
      return 'pending';
    };
    const getTotalAmount = (r) => {
      const val = r?.total_amount ?? r?.totalAmount;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return Number.isFinite(num) ? num : 0;
    };

    const approvedReports = reports.filter(r => normalizeStatusKey(r.status) === 'approved');
    const rejectedReports = reports.filter(r => normalizeStatusKey(r.status) === 'rejected');

    const data = {
      transport: 0,
      food: 0,
      miscellaneous: 0,
    };

    approvedReports.forEach(report => {
      if (Array.isArray(report.expense_items)) {
        report.expense_items.forEach(item => {
          const cat = (item.category || '').toString().toUpperCase();
          const amount = parseFloat(item.amount || 0);
          if (cat === 'TRANSPORTE') data.transport += amount;
          else if (cat === 'ALIMENTACAO') data.food += amount;
          else if (cat === 'DIVERSOS') data.miscellaneous += amount;
        });
      } else {
        (report.transport || []).forEach(item => data.transport += parseFloat(item.amount || 0));
        (report.food || []).forEach(item => data.food += parseFloat(item.amount || 0));
        (report.miscellaneous || []).forEach(item => data.miscellaneous += parseFloat(item.amount || 0));
      }
    });

    const totalApproved = data.transport + data.food + data.miscellaneous;
    const totalRejected = rejectedReports.reduce((sum, r) => sum + getTotalAmount(r), 0);

    const categories = [
      { name: 'Transporte', value: data.transport, color: '#81b29a', icon: Briefcase },
      { name: 'Alimentação', value: data.food, color: '#f2cc8f', icon: Utensils },
      { name: 'Diversas', value: data.miscellaneous, color: '#e07a5f', icon: PiggyBank },
    ];

    return { totalApproved, totalRejected, categories };
  }, [reports]);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border">
          <p className="font-bold text-foreground">{label}</p>
          <p className="text-sm text-primary">{`Valor: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-custom-light border border-border p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Despesas Aprovadas por Categoria</h2>
        <FileText className="w-6 h-6 text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-success/10 border-l-4 border-success p-3 rounded-r-lg">
          <p className="text-xs text-success font-medium">Total Aprovado</p>
          <p className="text-lg font-bold text-success">{formatCurrency(chartData.totalApproved)}</p>
        </div>
        <div className="bg-destructive/10 border-l-4 border-destructive p-3 rounded-r-lg">
          <p className="text-xs text-destructive font-medium">Total Rejeitado</p>
          <p className="text-lg font-bold text-destructive">{formatCurrency(chartData.totalRejected)}</p>
        </div>
      </div>

      <div className="flex-grow h-64">
        {chartData.totalApproved > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.categories} margin={{ top: 5, right: 0, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.categories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-muted-foreground">Nenhuma despesa aprovada para exibir no gráfico.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ExpenseChart;