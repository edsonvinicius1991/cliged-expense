
import React, { useState, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
    import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, Scissors, FileDown, Edit } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/components/ui/use-toast';

    const CashControl = ({ reports }) => {
      const { toast } = useToast();
      const [minCashGoal, setMinCashGoal] = useState(50000);
      const [dailyNotes, setDailyNotes] = useState('');

      const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      const cashData = useMemo(() => {
        // Mock data for inflows and initial balance
        const MOCK_INITIAL_BALANCE = 250000;
        const MOCK_INFLOWS = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(new Date().setDate(new Date().getDate() - 29 + i)).toISOString().split('T')[0],
          amount: 10000 + Math.random() * 5000,
        }));

        const dailyFlow = [];
        let currentBalance = MOCK_INITIAL_BALANCE;

        for (let i = 0; i < 30; i++) {
          const date = new Date(new Date().setDate(new Date().getDate() - 29 + i)).toISOString().split('T')[0];
          const inflow = MOCK_INFLOWS.find(inf => inf.date === date)?.amount || 0;
          const outflow = reports
            .filter(r => r.status === 'approved' && r.date === date)
            .reduce((sum, r) => sum + r.totalAmount, 0);
          
          currentBalance += inflow - outflow;
          dailyFlow.push({ date, inflow, outflow, balance: currentBalance });
        }

        const last30DaysOutflows = dailyFlow.slice(-30).map(d => d.outflow);
        const avgDailySpending = last30DaysOutflows.reduce((a, b) => a + b, 0) / 30;
        const currentCashPosition = dailyFlow[dailyFlow.length - 1]?.balance || 0;
        const remainingCashDays = avgDailySpending > 0 ? Math.floor(currentCashPosition / avgDailySpending) : Infinity;

        const biggestInflow = Math.max(...dailyFlow.map(d => d.inflow));
        const biggestOutflow = Math.max(...dailyFlow.map(d => d.outflow));

        const allExpenses = reports
            .filter(r => r.status === 'approved')
            .flatMap(r => [...(r.transport || []), ...(r.food || []), ...(r.miscellaneous || [])])
            .sort((a, b) => b.amount - a.amount);

        return {
          dailyFlow,
          currentCashPosition,
          remainingCashDays,
          avgDailySpending,
          biggestInflow,
          biggestOutflow,
          top5Expenses: allExpenses.slice(0, 5),
        };
      }, [reports]);

      const getCashDaysColor = (days) => {
        if (days > 60) return 'text-green-500';
        if (days >= 30) return 'text-yellow-500';
        return 'text-red-500';
      };

      const handleEmergencyCuts = () => {
        toast({
          title: "Top 5 Maiores Gastos Variáveis",
          description: (
            <ul className="list-disc pl-5 mt-2">
              {cashData.top5Expenses.map(exp => (
                <li key={exp.id}>{exp.description}: {formatCurrency(exp.amount)}</li>
              ))}
            </ul>
          ),
        });
      };

      const handleExport = () => {
        toast({ title: "🚧 Funcionalidade em breve!", description: "A exportação de PDF estará disponível em breve." });
      };

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md border border-slate-200 p-6"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Controle de Caixa Inteligente</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda: Posição de Caixa e Alertas */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-lg p-6 shadow-lg">
                <p className="text-sm font-medium opacity-80">Cash Position Atual</p>
                <p className="text-4xl font-bold my-2">{formatCurrency(cashData.currentCashPosition)}</p>
                <div className={`flex items-center gap-2 p-2 rounded-md bg-white/20 backdrop-blur-sm ${getCashDaysColor(cashData.remainingCashDays).replace('text-', 'border-b-2 border-')}`}>
                  <Calendar className={`w-5 h-5 ${getCashDaysColor(cashData.remainingCashDays)}`} />
                  <span className="font-semibold text-white">{cashData.remainingCashDays} Dias de Caixa Restantes</span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="font-bold text-slate-700">Alertas e Projeções</h3>
                {cashData.remainingCashDays < 45 && (
                  <div className="flex items-center gap-3 bg-red-100 text-red-800 p-3 rounded-md">
                    <AlertTriangle className="w-5 h-5" />
                    <p className="text-sm font-semibold">ATENÇÃO: Revisar gastos urgente!</p>
                  </div>
                )}
                <p className="text-sm text-slate-600">No ritmo atual, saldo zerado em <strong>{cashData.remainingCashDays} dias</strong>.</p>
                <div>
                  <Label htmlFor="min-cash" className="text-sm font-medium">Meta de Cash Mínimo</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input id="min-cash" type="number" value={minCashGoal} onChange={e => setMinCashGoal(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Fluxo Diário e Ações */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg"><p className="text-xs text-blue-700">Maior Entrada (Mês)</p><p className="text-lg font-bold text-blue-800">{formatCurrency(cashData.biggestInflow)}</p></div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg"><p className="text-xs text-orange-700">Maior Saída (Mês)</p><p className="text-lg font-bold text-orange-800">{formatCurrency(cashData.biggestOutflow)}</p></div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg"><p className="text-xs text-purple-700">Média Diária de Gastos</p><p className="text-lg font-bold text-purple-800">{formatCurrency(cashData.avgDailySpending)}</p></div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cashData.dailyFlow}>
                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip content={({ active, payload }) => active && payload?.length ? <div className="bg-white p-2 shadow-lg rounded-md border"><p>{`Saldo: ${formatCurrency(payload[0].value)}`}</p></div> : null} />
                    <Line type="monotone" dataKey="balance" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-bold text-slate-700 mb-2">Ações Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="daily-notes">Observações do Dia</Label>
                    <Textarea id="daily-notes" value={dailyNotes} onChange={e => setDailyNotes(e.target.value)} placeholder="Anote decisões importantes..." className="mt-1" />
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleEmergencyCuts} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50"><Scissors className="w-4 h-4 mr-2" /> Cortes de Emergência</Button>
                    <Button onClick={handleExport} variant="outline" className="w-full"><FileDown className="w-4 h-4 mr-2" /> Exportar PDF</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    };

    export default CashControl;
