import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { X, Save, DollarSign, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Edit2, Info } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';

    const CashFlowModal = ({ onClose }) => {
      const [cashData, setCashData] = useState(null);
      const [isEditingBalance, setIsEditingBalance] = useState(false);
      const [isEditingSpend, setIsEditingSpend] = useState(false);
      const [editValue, setEditValue] = useState(0);
      const [quickAdd, setQuickAdd] = useState('');
      const [quickSubtract, setQuickSubtract] = useState('');
      const { toast } = useToast();

      useEffect(() => {
        const data = JSON.parse(localStorage.getItem('cashFlowData'));
        if (data) {
          setCashData(data);
        } else {
          setIsEditingBalance(true);
          setIsEditingSpend(true);
        }
      }, []);

      const handleSaveInitial = () => {
        const balance = parseFloat(editValue.balance);
        const dailySpend = parseFloat(editValue.dailySpend);

        if (isNaN(balance) || isNaN(dailySpend) || dailySpend <= 0) {
          toast({
            title: "Valores Inválidos",
            description: "Por favor, insira valores numéricos válidos. O gasto diário deve ser maior que zero.",
            variant: "destructive",
          });
          return;
        }

        const newData = { balance, dailySpend };
        setCashData(newData);
        localStorage.setItem('cashFlowData', JSON.stringify(newData));
        setIsEditingBalance(false);
        setIsEditingSpend(false);
        toast({ title: "Configuração Salva!", description: "A situação do caixa foi configurada." });
      };

      const handleUpdateValue = (field) => {
        const value = parseFloat(editValue);
        if (isNaN(value) || (field === 'dailySpend' && value <= 0)) {
          toast({ title: "Valor Inválido", variant: "destructive" });
          return;
        }

        const newData = { ...cashData, [field]: value };
        setCashData(newData);
        localStorage.setItem('cashFlowData', JSON.stringify(newData));
        if (field === 'balance') setIsEditingBalance(false);
        if (field === 'dailySpend') setIsEditingSpend(false);
        setEditValue(0);
        toast({ title: "Valor atualizado!" });
      };

      const handleQuickUpdate = (type, valueStr) => {
        const value = parseFloat(valueStr);
        if (isNaN(value) || value <= 0) {
          toast({ title: "Valor Inválido", variant: "destructive" });
          return;
        }
        const newBalance = type === 'add' ? cashData.balance + value : cashData.balance - value;
        const newData = { ...cashData, balance: newBalance };
        setCashData(newData);
        localStorage.setItem('cashFlowData', JSON.stringify(newData));
        if (type === 'add') setQuickAdd('');
        if (type === 'subtract') setQuickSubtract('');
        toast({ title: `Valor ${type === 'add' ? 'adicionado' : 'descontado'} com sucesso!` });
      };

      const daysLeft = cashData && cashData.dailySpend > 0 ? Math.floor(cashData.balance / cashData.dailySpend) : 0;
      let semaphore = { color: 'bg-destructive', icon: AlertTriangle, text: 'Cuidado!', subtext: 'Menos de 30 dias' };
      if (daysLeft > 60) {
        semaphore = { color: 'bg-success', icon: CheckCircle, text: 'Tranquilo', subtext: 'Mais de 60 dias' };
      } else if (daysLeft >= 30) {
        semaphore = { color: 'bg-warning', icon: AlertTriangle, text: 'Atenção', subtext: 'Entre 30 e 60 dias' };
      }
      const SemaphoreIcon = semaphore.icon;
      const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      if (!cashData) {
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-2">Configuração Inicial do Caixa</h2>
              <p className="text-sm text-muted-foreground mb-6">Digite quanto tem na conta hoje e quanto gasta por dia em média.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="initialBalance">Saldo Atual em Caixa</Label>
                  <Input id="initialBalance" type="number" placeholder="R$ 10000.00" onChange={(e) => setEditValue(v => ({...v, balance: e.target.value}))} className="text-lg p-4 mt-1" />
                </div>
                <div>
                  <Label htmlFor="initialSpend">Gasto Médio por Dia</Label>
                  <Input id="initialSpend" type="number" placeholder="R$ 300.00" onChange={(e) => setEditValue(v => ({...v, dailySpend: e.target.value}))} className="text-lg p-4 mt-1" />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <Button onClick={onClose} variant="outline" className="w-full">Fechar</Button>
                <Button onClick={handleSaveInitial} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"><Save className="w-4 h-4 mr-2" /> Salvar</Button>
              </div>
            </motion.div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-border">
            <header className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Situação do Caixa da Clínica</h2>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
            </header>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted p-6 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                <p className="text-muted-foreground text-sm">Saldo Atual</p>
                <p className="text-5xl font-bold text-primary my-2">{formatCurrency(cashData.balance)}</p>
                <p className="text-foreground">Com esse dinheiro, conseguimos pagar as contas por <strong className="text-foreground">{daysLeft} dias</strong>.</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingBalance(true)}><Edit2 className="w-3 h-3 mr-2" /> Atualizar Saldo</Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingSpend(true)}><Edit2 className="w-3 h-3 mr-2" /> Gasto Diário</Button>
                </div>
              </div>
              <div className={`p-6 rounded-lg text-white flex flex-col items-center justify-center text-center ${semaphore.color}`}>
                <SemaphoreIcon className="w-16 h-16" />
                <p className="text-3xl font-bold mt-2">{semaphore.text}</p>
                <p className="opacity-90">{semaphore.subtext}</p>
              </div>
            </div>

            <div className="p-6 bg-muted border-t border-border">
                <h3 className="font-bold text-foreground mb-3">Atualização Rápida</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-border">
                        <Label htmlFor="quickAdd">Entrou hoje</Label>
                        <div className="flex gap-2 mt-1">
                            <Input id="quickAdd" type="number" placeholder="R$ 500" value={quickAdd} onChange={e => setQuickAdd(e.target.value)} />
                            <Button onClick={() => handleQuickUpdate('add', quickAdd)} className="bg-success hover:bg-success/90"><TrendingUp className="w-4 h-4" /></Button>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-border">
                        <Label htmlFor="quickSubtract">Saiu hoje</Label>
                        <div className="flex gap-2 mt-1">
                            <Input id="quickSubtract" type="number" placeholder="R$ 150" value={quickSubtract} onChange={e => setQuickSubtract(e.target.value)} />
                            <Button onClick={() => handleQuickUpdate('subtract', quickSubtract)} className="bg-destructive hover:bg-destructive/90"><TrendingDown className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
            {(isEditingBalance || isEditingSpend) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white p-6 rounded-lg shadow-xl border border-border w-96">
                  <h3 className="font-bold text-lg mb-4">Atualizar {isEditingBalance ? 'Saldo' : 'Gasto Diário'}</h3>
                  <Input type="number" autoFocus defaultValue={isEditingBalance ? cashData.balance : cashData.dailySpend} onChange={e => setEditValue(e.target.value)} className="text-xl p-4"/>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => { setIsEditingBalance(false); setIsEditingSpend(false); }} className="w-full">Cancelar</Button>
                    <Button onClick={() => handleUpdateValue(isEditingBalance ? 'balance' : 'dailySpend')} className="w-full bg-primary hover:bg-primary/90">Salvar</Button>
                  </div>
                </motion.div>
              </div>
            )}
            </AnimatePresence>
          </motion.div>
        </div>
      );
    };

    export default CashFlowModal;