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
    import { db, uploadReceipt, deleteReceipt, getReceiptUrl } from '@/lib/supabase';

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
      const [cpfValidation, setCpfValidation] = useState({ isValid: true, message: "" });
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
      
      const validateCPF = (cpf) => {
        // Remove caracteres não numéricos
        const cleanCPF = cpf.replace(/[^\d]/g, '');
        
        // Verifica se tem 11 dígitos
        if (cleanCPF.length !== 11) {
          return { isValid: false, message: "CPF deve conter 11 dígitos" };
        }
        
        // Verifica se todos os dígitos são iguais (caso inválido)
        if (/^(\d)\1{10}$/.test(cleanCPF)) {
          return { isValid: false, message: "CPF inválido" };
        }
        
        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
          sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
        }
        let remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(9))) {
          return { isValid: false, message: "CPF inválido" };
        }
        
        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
          sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
        }
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cleanCPF.charAt(10))) {
          return { isValid: false, message: "CPF inválido" };
        }
        
        return { isValid: true, message: "CPF válido" };
      };

      useEffect(() => {
        const loadReportData = async () => {
          if (editingReport) {
            const reportData = { ...editingReport };
            const categories = ['transport_expenses', 'food_expenses', 'miscellaneous_expenses', 'advances'];
        
            // Carrega URLs dos recibos para cada categoria
            for (const category of categories) {
              const categoryKey = category.replace('_expenses', '');
              if (reportData[category]) {
                reportData[categoryKey] = await Promise.all(
                  reportData[category].map(async (item) => {
                    if (item.receiptPath) {
                      try {
                        const receiptUrl = await getReceiptUrl(item.receiptPath);
                        return { ...item, receiptUrl };
                      } catch (error) {
                        console.error('Erro ao carregar URL do recibo:', error);
                        return item;
                      }
                    }
                    return item;
                  })
                );
              }
            }

            setFormData({
              date: reportData.created_at ? reportData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              userName: reportData.employee_name || '',
              cpf: reportData.employee_cpf || '',
              unit: reportData.unit || '',
              sector: reportData.sector || '',
              transport: reportData.transport_expenses || [],
              food: reportData.food_expenses || [],
              miscellaneous: reportData.miscellaneous_expenses || [],
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
        };

        loadReportData();
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
            receiptName: null,
            receiptPath: null,
            receiptUrl: null,
          }]
        }));
      };

      const removeExpenseLine = async (category, id) => {
        const itemToRemove = formData[category].find(item => item.id === id);
        
        // Remove o recibo do Supabase Storage se existir
        if (itemToRemove && itemToRemove.receiptPath) {
          try {
            await deleteReceipt(itemToRemove.receiptPath);
          } catch (error) {
            console.error('Erro ao deletar recibo:', error);
          }
        }

        setFormData(prev => ({
          ...prev,
          [category]: prev[category].filter(item => item.id !== id)
        }));
      };

      const updateExpenseLine = (category, id, field, value) => {
        setFormData(prev => ({
          ...prev,
          [category]: prev[category].map(item =>
            item.id === id ? { ...item, [field]: value } : item
          )
        }));
      };

      const handleFileChange = async (category, id, file) => {
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

        try {
          // Remove o recibo anterior se existir
          const currentItem = formData[category].find(item => item.id === id);
          if (currentItem && currentItem.receiptPath) {
            await deleteReceipt(currentItem.receiptPath);
          }

          // Faz upload do novo recibo
          const result = await uploadReceipt(file, user.id);
          
          updateExpenseLine(category, id, 'receiptPath', result.path);
          updateExpenseLine(category, id, 'receiptName', file.name);
          updateExpenseLine(category, id, 'receiptUrl', result.publicUrl);
          
          toast({ title: "Comprovante anexado!", description: "Arquivo carregado com sucesso." });
        } catch (error) {
          console.error('Erro ao fazer upload do recibo:', error);
          toast({ 
            title: "Erro no upload", 
            description: "Não foi possível fazer upload do comprovante. Tente novamente.", 
            variant: "destructive" 
          });
        }
      };

      const openCamera = (category, id) => {
        setCameraCallback(() => async (imageData) => {
          try {
            // Remove o recibo anterior se existir
            const currentItem = formData[category].find(item => item.id === id);
            if (currentItem && currentItem.receiptPath) {
              await deleteReceipt(currentItem.receiptPath);
            }

            // Converte base64 para blob
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], `captura_${Date.now()}.jpg`, { type: 'image/jpeg' });

            // Faz upload do recibo
            const result = await uploadReceipt(file, user.id);
            
            updateExpenseLine(category, id, 'receiptPath', result.path);
            updateExpenseLine(category, id, 'receiptName', file.name);
            updateExpenseLine(category, id, 'receiptUrl', result.publicUrl);
            
            setIsCameraOpen(false);
            toast({ title: "Foto capturada!", description: "Comprovante anexado com sucesso." });
          } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
            toast({ 
              title: "Erro no upload", 
              description: "Não foi possível salvar a foto. Tente novamente.", 
              variant: "destructive" 
            });
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

      const handleSave = async (submit = false) => {
        if (!formData.userName || !formData.cpf || !formData.unit || !formData.sector) {
          toast({
            title: "Campos obrigatórios",
            description: "Por favor, preencha Nome, CPF, Unidade e Setor.",
            variant: "destructive"
          });
          return;
        }

        // Validação completa do CPF
        const cpfValidationResult = validateCPF(formData.cpf);
        if (!cpfValidationResult.isValid) {
            toast({
                title: "CPF Inválido",
                description: cpfValidationResult.message,
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

        const reportData = {
          user_id: user.id,
          description: `${formData.unit} - ${formData.sector}`,
          status: submit ? 'pending' : 'draft',
          total_amount: totals.totalAmount,
          amount_to_receive: totals.toReceive,
          amount_to_return: totals.toReturn,
          transport_expenses: reportDataForStorage.transport,
          food_expenses: reportDataForStorage.food,
          miscellaneous_expenses: reportDataForStorage.miscellaneous,
          advances: reportDataForStorage.advances,
          employee_name: formData.userName,
          employee_cpf: formData.cpf,
          unit: formData.unit,
          sector: formData.sector
        };

        try {
          let savedReport;
          if (editingReport?.id) {
            savedReport = await db.expenseReports.update(editingReport.id, reportData);
          } else {
            savedReport = await db.expenseReports.create(reportData);
          }

          toast({
            title: submit ? "Relatório enviado!" : "Relatório salvo!",
            description: submit ? "Seu relatório foi enviado para aprovação." : "Suas alterações foram salvas.",
            className: submit ? 'bg-success text-success-foreground' : ''
          });
          
          if (submit) {
            onBack();
          }
        } catch (error) {
          console.error('Erro ao salvar relatório:', error);
          toast({
            title: "Erro ao Salvar",
            description: "Não foi possível salvar o relatório. Tente novamente.",
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
                            <Upload className="w-4 h-4 mr-2" />
                            <span className="text-sm truncate">
                              {item.receiptName ? `✓ ${item.receiptName}` : 'Upload'}
                            </span>
                            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(category, item.id, e.target.files[0])} className="hidden" />
                          </label>
                          <Button size="sm" variant="outline" onClick={() => openCamera(category, item.id)}><Camera className="w-4 h-4" /></Button>
                          {item.receiptUrl && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => window.open(item.receiptUrl, '_blank')}
                              title="Visualizar recibo"
                            >
                              👁️
                            </Button>
                          )}
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
                      onChange={(e) => {
                        const formattedCPF = formatCPF(e.target.value);
                        setFormData(prev => ({ ...prev, cpf: formattedCPF }));
                        
                        // Só valida se tiver pelo menos alguns dígitos
                        if (formattedCPF.replace(/[^\d]/g, '').length >= 3) {
                          const validation = validateCPF(formattedCPF);
                          setCpfValidation(validation);
                        } else {
                          setCpfValidation({ isValid: true, message: "" });
                        }
                      }} 
                      placeholder="000.000.000-00" 
                      className={`mt-1 ${formData.cpf && !cpfValidation.isValid ? 'border-red-500 focus:ring-red-500' : formData.cpf && cpfValidation.isValid && formData.cpf.replace(/[^\d]/g, '').length === 11 ? 'border-green-500 focus:ring-green-500' : ''}`}
                      maxLength="14"
                    />
                    {formData.cpf && !cpfValidation.isValid && (
                      <p className="text-red-500 text-sm mt-1">{cpfValidation.message}</p>
                    )}
                    {formData.cpf && cpfValidation.isValid && formData.cpf.replace(/[^\d]/g, '').length === 11 && (
                      <p className="text-green-500 text-sm mt-1">CPF válido</p>
                    )}
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