import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { ArrowLeft, Plus, Trash2, Upload, Save, Send, Camera } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import CameraCapture from '@/components/CameraCapture';
    import ComboBox from '@/components/ComboBox';
    import { Select } from '@/components/ui/select';

    const units = [
      { value: 'macae', label: 'Macaé' },
      { value: 'barra_tijuca', label: 'Barra da Tijuca' },
      { value: 'cabo_frio', label: 'Cabo Frio' },
      { value: 'duque_caxias', label: 'Duque de Caxias' },
      { value: 'nova_iguacu', label: 'Nova Iguaçu' },
      { value: 'sao_goncalo', label: 'São Gonçalo' },
      { value: 'campos_goytacazes', label: 'Campos dos Goytacazes' },
      { value: 'volta_redonda', label: 'Volta Redonda' },
      { value: 'ipec', label: 'IPEC' },
      { value: 'todos', label: 'Todos' },
    ];

    const sectors = [
      { value: 'terapia_assistida', label: 'Terapia Assistida' },
      { value: 'endoscopia', label: 'Endoscopia' },
      { value: 'ipec', label: 'IPEC' },
      { value: 'todos', label: 'Todos' },
    ];

    const ExpenseReportForm = ({ user, editingReport, onBack }) => {
      const { toast } = useToast();
      const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        userName: '',
        cpf: '',
        unit: '',
        sector: '',
        transport: [],
        food: [],
        miscellaneous: [],
        advances: []
      });
      const [isCameraOpen, setIsCameraOpen] = useState(false);
      const [cameraCallback, setCameraCallback] = useState(null);

      const formatCPF = (value) => {
        const onlyNumbers = value.replace(/[^\d]/g, '');
        return onlyNumbers
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d)/, '$1.$2')
          .replace(/(\d{3})(\d{1,2})/, '$1-$2')
          .slice(0, 14);
      };

      useEffect(() => {
        if (editingReport) {
          const reportData = { ...editingReport };
          const categories = ['transport', 'food', 'miscellaneous', 'advances'];
          const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
      
          categories.forEach(category => {
            if (reportData[category]) {
              reportData[category] = reportData[category].map(item => {
                if (item.receiptId && receiptsData[item.receiptId]) {
                  return { ...item, receipt: receiptsData[item.receiptId] };
                }
                return item;
              });
            }
          });

          setFormData({
            date: reportData.date,
            userName: reportData.userName || '',
            cpf: reportData.cpf || '',
            unit: reportData.unit || '',
            sector: reportData.sector || '',
            transport: reportData.transport || [],
            food: reportData.food || [],
            miscellaneous: reportData.miscellaneous || [],
            advances: reportData.advances || [],
          });
        } else {
             setFormData({
                date: new Date().toISOString().split('T')[0],
                userName: '',
                cpf: '',
                unit: '',
                sector: '',
                transport: [],
                food: [],
                miscellaneous: [],
                advances: []
            });
        }
      }, [editingReport, user]);


      const addExpenseLine = (category) => {
        setFormData(prev => ({
          ...prev,
          [category]: [...prev[category], {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: 0,
            currency: 'BRL',
            receipt: null,
            receiptName: null,
            receiptId: null,
          }]
        }));
      };

      const removeExpenseLine = (category, id) => {
        setFormData(prev => {
          const itemToRemove = prev[category].find(item => item.id === id);
          if (itemToRemove && itemToRemove.receiptId) {
            const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
            delete receiptsData[itemToRemove.receiptId];
            localStorage.setItem('receiptsData', JSON.stringify(receiptsData));
          }
          return {
            ...prev,
            [category]: prev[category].filter(item => item.id !== id)
          };
        });
      };

      const updateExpenseLine = (category, id, field, value) => {
        setFormData(prev => ({
          ...prev,
          [category]: prev[category].map(item =>
            item.id === id ? { ...item, [field]: value } : item
          )
        }));
      };

      const handleFileChange = (category, id, file) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
          toast({ title: "Tipo de arquivo inválido", description: "Apenas JPG, PNG e PDF são permitidos.", variant: "destructive" });
          return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
          toast({ title: "Arquivo muito grande", description: "O tamanho máximo do arquivo é 5MB.", variant: "destructive" });
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const receiptId = `receipt_${Date.now()}`;
          const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
          receiptsData[receiptId] = reader.result;
          try {
            localStorage.setItem('receiptsData', JSON.stringify(receiptsData));
            updateExpenseLine(category, id, 'receiptId', receiptId);
            updateExpenseLine(category, id, 'receiptName', file.name);
            updateExpenseLine(category, id, 'receipt', null);
            toast({ title: "Comprovante anexado!", description: "Arquivo carregado com sucesso." });
          } catch(e) {
             toast({ title: "Erro de armazenamento", description: "Não foi possível salvar o comprovante. O armazenamento está cheio.", variant: "destructive" });
          }
        };
        reader.readAsDataURL(file);
      };

      const openCamera = (category, id) => {
        setCameraCallback(() => (imageData) => {
          const receiptId = `receipt_${Date.now()}`;
          const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
          receiptsData[receiptId] = imageData;
           try {
            localStorage.setItem('receiptsData', JSON.stringify(receiptsData));
            updateExpenseLine(category, id, 'receiptId', receiptId);
            updateExpenseLine(category, id, 'receiptName', `captura_${Date.now()}.jpg`);
            updateExpenseLine(category, id, 'receipt', null);
            setIsCameraOpen(false);
            toast({ title: "Foto capturada!", description: "Comprovante anexado com sucesso." });
          } catch(e) {
            toast({ title: "Erro de armazenamento", description: "Não foi possível salvar o comprovante. O armazenamento está cheio.", variant: "destructive" });
          }
        });
        setIsCameraOpen(true);
      };

      const calculateTotals = () => {
        const categories = ['transport', 'food', 'miscellaneous', 'advances'];
        let totalAmount = 0;
        let totalAdvances = 0;

        categories.forEach(cat => {
          formData[cat].forEach(item => {
            const amount = parseFloat(item.amount) || 0;
            if (cat === 'advances') {
              totalAdvances += amount;
            } else {
              totalAmount += amount;
            }
          });
        });

        const toReceive = Math.max(0, totalAmount - totalAdvances);
        const toReturn = Math.max(0, totalAdvances - totalAmount);

        return { totalAmount, totalAdvances, toReceive, toReturn };
      };

      const handleSave = (submit = false) => {
        if (!formData.userName || !formData.cpf || !formData.unit || !formData.sector) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha Nome, CPF, Unidade e Setor.",
            variant: "destructive"
          });
          return;
        }

        if (formData.cpf.length !== 14) {
            toast({
                title: "CPF Inválido",
                description: "Por favor, preencha o CPF completo.",
                variant: "destructive"
            });
            return;
        }

        const totals = calculateTotals();
        
        if (submit && totals.totalAmount === 0 && totals.totalAdvances === 0) {
          toast({
            title: "Relatório Vazio",
            description: "Adicione pelo menos uma despesa ou adiantamento para enviar.",
            variant: "destructive"
          });
          return;
        }
        
        const reportDataForStorage = JSON.parse(JSON.stringify(formData));
        const categories = ['transport', 'food', 'miscellaneous', 'advances'];
        categories.forEach(cat => {
            reportDataForStorage[cat] = reportDataForStorage[cat].map(item => {
                const { receipt, ...rest } = item;
                return rest;
            });
        });

        const report = {
          ...reportDataForStorage,
          id: editingReport?.id || Date.now().toString(),
          userId: user.id,
          userName: formData.userName,
          cpf: formData.cpf,
          status: submit ? 'pending' : 'draft',
          ...totals,
          createdAt: editingReport?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          signatures: editingReport?.signatures || []
        };

        const allReports = JSON.parse(localStorage.getItem('expenseReports') || '[]');
        const existingIndex = allReports.findIndex(r => r.id === report.id);
        
        if (existingIndex >= 0) {
          allReports[existingIndex] = report;
        } else {
          allReports.push(report);
        }

        try {
            localStorage.setItem('expenseReports', JSON.stringify(allReports));
            toast({
              title: submit ? "Relatório enviado!" : "Relatório salvo!",
              description: submit ? "Seu relatório foi enviado para aprovação." : "Suas alterações foram salvas.",
              className: submit ? 'bg-success text-success-foreground' : ''
            });
            if (submit) {
              onBack();
            }
        } catch (e) {
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível salvar o relatório. O armazenamento do navegador pode estar cheio.",
                variant: "destructive"
            });
        }
      };

      const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      };

      const totals = calculateTotals();

      const renderExpenseSection = (title, category, color) => (
        <div className="bg-white rounded-lg shadow-custom-light border border-border p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${color}`}>{title}</h3>
            <Button onClick={() => addExpenseLine(category)} size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Linha
            </Button>
          </div>

          {formData[category].length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma despesa adicionada</p>
          ) : (
            <div className="space-y-4">
              {formData[category].map((item) => (
                <div key={item.id} className="border border-border rounded-lg p-4 bg-muted">
                  <div className="grid md:grid-cols-5 gap-4">
                    <div><Label className="text-xs text-muted-foreground">Data</Label><Input type="date" value={item.date} onChange={(e) => updateExpenseLine(category, item.id, 'date', e.target.value)} className="mt-1" /></div>
                    <div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={item.description} onChange={(e) => updateExpenseLine(category, item.id, 'description', e.target.value)} placeholder="Descreva a despesa" className="mt-1" /></div>
                    <div><Label className="text-xs text-muted-foreground">Valor</Label><Input type="number" step="0.01" value={item.amount} onChange={(e) => updateExpenseLine(category, item.id, 'amount', e.target.value)} className="mt-1" /></div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Comprovante</Label>
                        <div className="flex gap-2 mt-1">
                          <label className="flex-1 flex items-center justify-center px-3 py-2 border border-input rounded-lg cursor-pointer hover:bg-accent transition-colors">
                            <Upload className="w-4 h-4 mr-2" /><span className="text-sm truncate">{item.receiptName ? '✓' : 'Upload'}</span>
                            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(category, item.id, e.target.files[0])} className="hidden" />
                          </label>
                          <Button size="sm" variant="outline" onClick={() => openCamera(category, item.id)}><Camera className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={() => removeExpenseLine(category, item.id)} className="border-destructive/50 text-destructive hover:bg-destructive/10 h-10 w-10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

      return (
        <>
          {isCameraOpen && <CameraCapture onCapture={cameraCallback} onCancel={() => setIsCameraOpen(false)} />}
          <div className="min-h-screen bg-white">
            <header className="bg-white shadow-sm border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5 mr-2" />Voltar</Button>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{editingReport ? 'Editar Relatório' : 'Novo Relatório de Despesas'}</h1>
                    <p className="text-sm text-muted-foreground">{editingReport ? formData.userName : 'Preencha os dados'}</p>
                  </div>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
              <div className="bg-white rounded-lg shadow-custom-light border border-border p-5 mb-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Informações Gerais</h2>
                <div className="grid md:grid-cols-5 gap-6">
                  <div>
                    <Label className="font-semibold">Data do Relatório</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label className="font-semibold">Nome do Colaborador</Label>
                    <Input value={formData.userName} onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))} placeholder="Digite seu nome completo" className="mt-1" />
                  </div>
                  <div>
                    <Label className="font-semibold">CPF do Colaborador</Label>
                    <Input 
                      value={formData.cpf} 
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))} 
                      placeholder="000.000.000-00" 
                      className="mt-1" 
                      maxLength="14"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Unidade</Label>
                    <Select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} className="mt-1">
                      <option value="" disabled>Selecione uma unidade</option>
                      {units.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label className="font-semibold">Setor</Label>
                    <ComboBox
                      options={sectors}
                      value={formData.sector}
                      onChange={(value) => setFormData(prev => ({ ...prev, sector: value }))}
                      placeholder="Selecione um setor"
                      searchPlaceholder="Buscar setor..."
                      notFoundMessage="Nenhum setor encontrado."
                    />
                  </div>
                </div>
              </div>

              {renderExpenseSection('Transporte', 'transport', 'text-blue-500')}
              {renderExpenseSection('Alimentação', 'food', 'text-green-500')}
              {renderExpenseSection('Despesas com Viagem', 'miscellaneous', 'text-purple-500')}
              {renderExpenseSection('Despesas com Treinamento', 'advances', 'text-orange-500')}

              <div className="bg-primary rounded-lg shadow-lg p-6 mb-6 text-primary-foreground">
                <h3 className="text-2xl font-bold mb-4">Resumo Financeiro</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><p className="text-sm opacity-90 mb-1">Total Gasto</p><p className="text-2xl font-bold">{formatCurrency(totals.totalAmount)}</p></div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><p className="text-sm opacity-90 mb-1">Despesas com Treinamento</p><p className="text-2xl font-bold">{formatCurrency(totals.totalAdvances)}</p></div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><p className="text-sm opacity-90 mb-1">A Receber</p><p className="text-2xl font-bold text-green-300">{formatCurrency(totals.toReceive)}</p></div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4"><p className="text-sm opacity-90 mb-1">A Devolver</p><p className="text-2xl font-bold text-red-300">{formatCurrency(totals.toReturn)}</p></div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => handleSave(false)} variant="outline" className="flex-1 h-12"><Save className="w-5 h-5 mr-2" />Salvar Rascunho</Button>
                <Button onClick={() => handleSave(true)} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"><Send className="w-5 h-5 mr-2" />Enviar para Aprovação</Button>
              </div>
            </main>
          </div>
        </>
      );
    };

    export default ExpenseReportForm;