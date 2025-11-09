import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, ArrowRight, TrendingUp, TrendingDown, FileDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useToast } from "@/components/ui/use-toast";

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const CATEGORY_MAP = {
  transport: 'Transporte',
  food: 'Alimentação',
  miscellaneous: 'Despesas com Viagem',
  advances: 'Despesas com Treinamento',
  outros: 'Outros'
};

const normalizeCategory = (category, expenseType) => {
    const lowerCategory = category?.toLowerCase();
    if (lowerCategory?.includes('uber') || lowerCategory?.includes('99') || lowerCategory?.includes('transporte')) return CATEGORY_MAP.transport;
    if (lowerCategory?.includes('ifood') || lowerCategory?.includes('restaurante') || lowerCategory?.includes('comida') || lowerCategory?.includes('aliment')) return CATEGORY_MAP.food;
    
    return CATEGORY_MAP[expenseType] || CATEGORY_MAP.outros;
};


const MonthlyControl = ({ reports }) => {
  const [monthlyGoal, setMonthlyGoal] = useState(() => {
    const savedGoal = localStorage.getItem('monthlyGoal');
    return savedGoal ? parseFloat(savedGoal) : 50000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(monthlyGoal);
  const { toast } = useToast();

  const handleSaveGoal = () => {
    setMonthlyGoal(goalInput);
    localStorage.setItem('monthlyGoal', goalInput);
    setIsEditingGoal(false);
  };
  
  const handleDetailsClick = (categoryName) => {
    toast({
      title: `Detalhes para ${categoryName}`,
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const handleExportTop5 = () => {
    toast({
      title: "Exportar Top 5",
      description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const monthlyData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });

    const monthlyTotals = Array(6).fill(0).map((_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        return {
            name: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            month: date.getMonth(),
            total: 0
        };
    }).reverse();

    const normalizeStatusKey = (status) => {
      const s = (status || '').toString().trim().toUpperCase();
      if (s === 'PENDENTE' || s === 'PENDING') return 'pending';
      if (s === 'APROVADO' || s === 'APPROVED') return 'approved';
      if (s === 'REJEITADO' || s === 'REJECTED') return 'rejected';
      return 'pending';
    };
    const getMonthKey = (r) => {
      const dStr = r?.period_start || r?.created_at || r?.submission_date || r?.period_end || r?.period_start || r?.date;
      if (!dStr) return null;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };
    const getTotalAmount = (r) => {
      const val = r?.total_amount ?? r?.totalAmount;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return Number.isFinite(num) ? num : 0;
    };

    const categorySpending = {};
    let totalApprovedThisMonth = 0;
    const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    reports.forEach(report => {
        if (normalizeStatusKey(report.status) !== 'approved') return;
        const mk = getMonthKey(report);
        if (!mk) return;
        const [y, m] = mk.split('-');
        const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);

        const matchedMonth = monthlyTotals.find(mm => mm.month === d.getMonth() && mm.year === d.getFullYear());
        if (matchedMonth) {
            const reportTotal = getTotalAmount(report);
            matchedMonth.total += reportTotal;
            if (mk === currentMonthKey) {
                totalApprovedThisMonth += reportTotal;
            }
        }

        if (mk === currentMonthKey) {
          if (Array.isArray(report.expense_items)) {
            report.expense_items.forEach(item => {
              const catKey = (item.category || '').toString().toUpperCase();
              const amount = parseFloat(item.amount || 0);
              let mainCategory = CATEGORY_MAP.outros;
              if (catKey === 'TRANSPORTE') mainCategory = CATEGORY_MAP.transport;
              else if (catKey === 'ALIMENTACAO') mainCategory = CATEGORY_MAP.food;
              else if (catKey === 'DIVERSOS') mainCategory = CATEGORY_MAP.miscellaneous;
              else if (catKey === 'ADIANTAMENTOS') mainCategory = CATEGORY_MAP.advances;
              if (!categorySpending[mainCategory]) categorySpending[mainCategory] = 0;
              categorySpending[mainCategory] += amount;
            });
          } else {
            ['transport', 'food', 'miscellaneous'].forEach(expenseType => {
                if (report[expenseType] && Array.isArray(report[expenseType])) {
                    report[expenseType].forEach(item => {
                        const mainCategory = normalizeCategory(item.category, expenseType);
                        if (!categorySpending[mainCategory]) {
                            categorySpending[mainCategory] = 0;
                        }
                        categorySpending[mainCategory] += item.amount || 0;
                    });
                }
            });
            if (report.advances && Array.isArray(report.advances)) {
                const advancesTotal = report.advances.reduce((sum, item) => sum + (item.amount || 0), 0);
                if (advancesTotal > 0) {
                    if (!categorySpending[CATEGORY_MAP.advances]) {
                        categorySpending[CATEGORY_MAP.advances] = 0;
                    }
                    categorySpending[CATEGORY_MAP.advances] += advancesTotal;
                }
            }
          }
        }
    });

    const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, total]) => ({ 
            name, 
            total,
            percentage: totalApprovedThisMonth > 0 ? (total / totalApprovedThisMonth) * 100 : 0
        }));

    const currentMonthData = monthlyTotals.find(m => m.month === currentMonth && m.year === currentYear) || { total: 0 };
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthData = monthlyTotals.find(m => m.month === previousMonthDate.getMonth() && m.year === previousMonthDate.getFullYear()) || { total: 0 };

    const sixMonthAvg = monthlyTotals.reduce((sum, m) => sum + m.total, 0) / 6;

    return {
        monthlyTotals,
        currentMonthTotal: currentMonthData.total,
        previousMonthTotal: previousMonthData.total,
        sixMonthAvg,
        topCategories,
        currentMonthName,
    };
  }, [reports]);

  const { currentMonthTotal, previousMonthTotal, sixMonthAvg, monthlyTotals, topCategories, currentMonthName } = monthlyData;

  const progress = monthlyGoal > 0 ? (currentMonthTotal / monthlyGoal) * 100 : 0;
  
  const comparisonDiff = currentMonthTotal - previousMonthTotal;
  const comparisonPerc = previousMonthTotal > 0 ? (comparisonDiff / previousMonthTotal) * 100 : currentMonthTotal > 0 ? 100 : 0;
  
  const trend = monthlyTotals.length > 1 && monthlyTotals[5].total > monthlyTotals[0].total ? 'Subindo' : monthlyTotals.length > 1 && monthlyTotals[5].total < monthlyTotals[0].total ? 'Descendo' : 'Estável';
  const currentVsAvg = currentMonthTotal - sixMonthAvg;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
        },
    }),
  };

  return (
    <div className="bg-white rounded-lg shadow-custom-light border border-border p-5 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-4">Controle Mensal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible" className="flex flex-col justify-between p-5 rounded-lg border border-border bg-muted">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Gastamos Este Mês</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(currentMonthTotal)}</p>
          </div>
          <div className="mt-4">
             <Progress value={progress} className="h-2" indicatorClassName={progress > 100 ? 'bg-destructive' : progress > 80 ? 'bg-warning' : 'bg-success'} />
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>Meta: {formatCurrency(monthlyGoal)}</span>
              {!isEditingGoal ? (
                <Button variant="link" className="p-0 h-auto text-xs text-primary" onClick={() => setIsEditingGoal(true)}>Editar</Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Input type="number" value={goalInput} onChange={(e) => setGoalInput(parseFloat(e.target.value))} className="h-6 w-20 text-xs" />
                  <Button size="sm" className="h-6 px-2 text-xs" onClick={handleSaveGoal}>Salvar</Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible" className="flex flex-col justify-between p-5 rounded-lg border border-border bg-muted">
          <p className="text-sm font-medium text-muted-foreground mb-2">Este Mês vs Anterior</p>
          <div className="flex items-baseline justify-between gap-4">
              <div><span className="text-xs text-muted-foreground">Atual:</span> <p className="font-bold text-lg text-foreground">{formatCurrency(currentMonthTotal)}</p></div>
              <div><span className="text-xs text-muted-foreground">Anterior:</span> <p className="font-bold text-lg text-foreground">{formatCurrency(previousMonthTotal)}</p></div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className={`text-lg font-bold ${comparisonDiff > 0 ? 'text-destructive' : 'text-success'}`}>
              {comparisonDiff >= 0 ? '+' : ''}{formatCurrency(comparisonDiff)}
            </span>
            <span className={`flex items-center text-sm font-medium rounded-full px-2 py-0.5 ${comparisonDiff > 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
              {comparisonDiff > 0 ? <ArrowUpRight className="w-4 h-4"/> : comparisonDiff < 0 ? <ArrowDownRight className="w-4 h-4"/> : <ArrowRight className="w-4 h-4"/>}
              {comparisonPerc.toFixed(1)}%
            </span>
          </div>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="flex flex-col justify-between p-5 rounded-lg border border-border bg-muted">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Média Semestral</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(sixMonthAvg)}</p>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div className="text-xs">
                <p className={`flex items-center font-semibold ${trend === 'Subindo' ? 'text-destructive' : 'text-success'}`}>
                    {trend === 'Subindo' ? <TrendingUp className="w-4 h-4 mr-1"/> : trend === 'Descendo' ? <TrendingDown className="w-4 h-4 mr-1"/> : <ArrowRight className="w-4 h-4 mr-1" />}
                    Tendência: {trend}
                </p>
                <p className="text-muted-foreground mt-1">
                    {currentVsAvg > 0 ? 'Acima' : 'Abaixo'} da média este mês
                </p>
            </div>
            <div className="w-24 h-10">
              <ResponsiveContainer>
                <LineChart data={monthlyTotals}>
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};

export default MonthlyControl;