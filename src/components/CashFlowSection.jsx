
    import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { Edit2, Plus, Minus, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, ArrowDownRight } from 'lucide-react';
    import { BarChart, Bar, LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';

    const GaugeChart = ({ value, max = 100 }) => {
        const percentage = Math.min(Math.max(value / max, 0), 1);
        const angle = percentage * 180 - 90;
        const color = percentage > 0.6 ? '#22c55e' : percentage > 0.3 ? '#f59e0b' : '#ef4444';

        return (
            <div className="relative w-full h-16 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 rounded-t-full border-t-8 border-r-8 border-b-8 border-l-8 border-slate-200" style={{
                    clipPath: 'polygon(0% 100%, 0% 0%, 100% 0%, 100% 100%, 50% 50%)'
                }}></div>
                 <div className="absolute top-0 left-0 w-full h-32 rounded-t-full border-t-8 border-r-8 border-b-8 border-l-8" style={{
                    borderColor: color,
                    clipPath: 'polygon(0% 100%, 0% 0%, 100% 0%, 100% 100%, 50% 50%)',
                    clipPath: `polygon(0% 0%, ${percentage*100}% 0, ${percentage*100}% 100%, 0% 100%)`
                }}></div>

                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 h-full transform-origin-bottom transition-transform duration-500" style={{ transform: `rotate(${angle}deg)` }}>
                    <div className="w-1 h-1/2 bg-slate-700"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-800 -mt-1.5 -ml-1"></div>
                </div>
            </div>
        );
    };


    const CashFlowSection = () => {
        const [data, setData] = useState({
            balance: 50000,
            dailySpend: 750,
            history: [],
            weeklyFlow: []
        });
        const [isEditingBalance, setIsEditingBalance] = useState(false);
        const [isEditingSpend, setIsEditingSpend] = useState(false);
        const [editValue, setEditValue] = useState('');
        const [flowValue, setFlowValue] = useState('');
        const { toast } = useToast();

        useEffect(() => {
            const savedData = JSON.parse(localStorage.getItem('cashFlowDataV2'));
            if (savedData) {
                setData(savedData);
            } else {
                // Initialize with some default data if nothing is saved
                const today = new Date();
                const history = Array.from({length: 30}).map((_, i) => ({
                    date: new Date(today.getTime() - (29-i) * 24*60*60*1000).toISOString().split('T')[0],
                    balance: 50000 - (29-i) * (Math.random() * 500 - 200)
                }));
                const weeklyFlow = Array.from({length: 7}).map((_, i) => ({
                    date: new Date(today.getTime() - (6-i) * 24*60*60*1000).toISOString().split('T')[0],
                    in: Math.random() * 1000,
                    out: Math.random() * 1200
                }));
                const initialState = { balance: 50000, dailySpend: 750, history, weeklyFlow };
                setData(initialState);
                localStorage.setItem('cashFlowDataV2', JSON.stringify(initialState));
            }
        }, []);
        
        const saveData = (newData) => {
            localStorage.setItem('cashFlowDataV2', JSON.stringify(newData));
            setData(newData);
        };

        const handleUpdate = (field) => {
            const value = parseFloat(editValue);
            if(isNaN(value) || value < 0) {
                toast({ title: 'Valor inválido', variant: 'destructive' });
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const newHistory = [...data.history.filter(h => h.date !== today), { date: today, balance: field === 'balance' ? value : data.balance }];
            
            saveData({ ...data, [field]: value, history: newHistory });

            setIsEditingBalance(false);
            setIsEditingSpend(false);
            setEditValue('');
            toast({ title: `${field === 'balance' ? 'Saldo' : 'Gasto diário'} atualizado!` });
        };
        
        const handleFlow = (type) => {
            const value = parseFloat(flowValue);
            if(isNaN(value) || value <= 0) {
                toast({ title: 'Valor inválido', variant: 'destructive' });
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const newBalance = type === 'in' ? data.balance + value : data.balance - value;
            
            const weeklyFlowIndex = data.weeklyFlow.findIndex(d => d.date === today);
            let newWeeklyFlow = [...data.weeklyFlow];
            if(weeklyFlowIndex > -1) {
                newWeeklyFlow[weeklyFlowIndex][type] += value;
            } else {
                newWeeklyFlow.shift();
                newWeeklyFlow.push({ date: today, in: type === 'in' ? value : 0, out: type === 'out' ? value : 0 });
            }

            const newHistory = [...data.history.filter(h => h.date !== today), { date: today, balance: newBalance }];

            saveData({ ...data, balance: newBalance, weeklyFlow: newWeeklyFlow, history: newHistory });
            setFlowValue('');
            toast({ title: `Valor de ${type === 'in' ? 'entrada' : 'saída'} registrado!` });
        };

        const daysLeft = data.dailySpend > 0 ? Math.floor(data.balance / data.dailySpend) : 0;
        
        const daysLeftBar = useMemo(() => {
            const percentage = Math.min((daysLeft / 90) * 100, 100);
            let color = 'bg-red-500';
            if (daysLeft > 60) color = 'bg-green-500';
            else if (daysLeft >= 30) color = 'bg-yellow-500';
            return { percentage, color };
        }, [daysLeft]);

        const trend = useMemo(() => {
            if(data.history.length < 2) return { text: 'Estável', icon: ArrowRight, color: 'text-slate-600'};
            const last = data.history[data.history.length-1].balance;
            const secondLast = data.history[data.history.length-2].balance;
            if(last > secondLast) return { text: 'Subindo', icon: ArrowUpRight, color: 'text-green-600'};
            if(last < secondLast) return { text: 'Descendo', icon: ArrowDownRight, color: 'text-red-600'};
            return { text: 'Estável', icon: ArrowRight, color: 'text-slate-600'};
        }, [data.history]);
        const TrendIcon = trend.icon;
        
        const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

        const Card = ({ title, children }) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-md border border-slate-200 p-4 flex flex-col h-full"
            >
                <h3 className="font-bold text-slate-600 text-sm mb-2">{title}</h3>
                <div className="flex-grow flex flex-col justify-center">{children}</div>
            </motion.div>
        );

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card title="Caixa Hoje">
                    {isEditingBalance ? (
                         <div className="flex gap-2">
                             <Input type="number" placeholder="Novo saldo" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                             <Button size="sm" onClick={() => handleUpdate('balance')}>Salvar</Button>
                         </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center">
                                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(data.balance)}</p>
                                <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => { setIsEditingBalance(true); setEditValue(data.balance)}}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <GaugeChart value={daysLeft} max={90} />
                        </>
                    )}
                </Card>
                <Card title="Quantos Dias Dura">
                    {isEditingSpend ? (
                        <div className="flex gap-2">
                            <Input type="number" placeholder="Gasto/dia" value={editValue} onChange={(e) => setEditValue(e.target.value)} autoFocus />
                            <Button size="sm" onClick={() => handleUpdate('dailySpend')}>Salvar</Button>
                        </div>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-slate-800 text-center">{daysLeft} <span className="text-xl">dias</span></p>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 my-2">
                                <div className={`${daysLeftBar.color} h-2.5 rounded-full`} style={{ width: `${daysLeftBar.percentage}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">Gasto/dia: {formatCurrency(data.dailySpend)}</p>
                                <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => { setIsEditingSpend(true); setEditValue(data.dailySpend)}}>
                                    <Edit2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
                <Card title="Esta Semana">
                    <div className="h-20">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weeklyFlow}>
                                <Tooltip contentStyle={{fontSize: '12px', padding: '4px 8px', borderRadius: '6px'}}/>
                                <Bar dataKey="in" fill="#22c55e" name="Entrada" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="out" fill="#ef4444" name="Saída" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <Input type="number" placeholder="Valor" className="h-8" value={flowValue} onChange={e => setFlowValue(e.target.value)} />
                        <Button size="icon" className="h-8 w-8 bg-green-500 hover:bg-green-600" onClick={() => handleFlow('in')}><Plus className="w-4 h-4" /></Button>
                        <Button size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600" onClick={() => handleFlow('out')}><Minus className="w-4 h-4" /></Button>
                    </div>
                </Card>
                <Card title="Como Está Indo">
                     <div className="h-24 -mx-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.history}>
                                <Line type="monotone" dataKey="balance" stroke={trend.color} strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className={`flex items-center justify-center gap-2 font-bold ${trend.color}`}>
                       <TrendIcon className="w-5 h-5"/>
                       <p>Tendência: {trend.text}</p>
                    </div>
                </Card>
            </div>
        );
    };

    export default CashFlowSection;
  