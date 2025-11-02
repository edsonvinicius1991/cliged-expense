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
    import { db, supabase, uploadReceipt, deleteReceipt, getReceiptUrl, getStoragePathFromPublicUrl } from '@/lib/supabase';

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
      const [isLoadingData, setIsLoadingData] = useState(false);
      const [cpfValidation, setCpfValidation] = useState({ isValid: true, message: "" });
      const [isCameraOpen, setIsCameraOpen] = useState(false);
      const [cameraCallback, setCameraCallback] = useState(null);
      const [viewerOpen, setViewerOpen] = useState(false);
      const [viewerItem, setViewerItem] = useState(null);
      const [viewerContentUrl, setViewerContentUrl] = useState(null);
      const [viewerLoading, setViewerLoading] = useState(false);
      const [viewerError, setViewerError] = useState(null);

      useEffect(() => {
        const fetchViewerContent = async () => {
          if (!viewerOpen || !viewerItem) return;
          setViewerError(null);
          setViewerLoading(true);
          try {
            const isPdf = (viewerItem.filename || '').toLowerCase().endsWith('.pdf') || (viewerItem.url || '').toLowerCase().endsWith('.pdf');
            if (isPdf) {
              const key = getStoragePathFromPublicUrl(viewerItem.url);
              if (!key) throw new Error('Chave do Storage não encontrada para o recibo');
              const { data, error } = await supabase.storage.from('receipts').download(key);
              if (error) throw error;
              const blobUrl = URL.createObjectURL(data);
              setViewerContentUrl(blobUrl);
            } else {
              // Para imagens, usar URL pública diretamente
              setViewerContentUrl(viewerItem.url);
            }
          } catch (e) {
            console.error('Erro ao carregar conteúdo do recibo:', e);
            setViewerError('Não foi possível carregar o comprovante.');
          } finally {
            setViewerLoading(false);
          }
        };

        fetchViewerContent();

        return () => {
          if (viewerContentUrl && viewerContentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewerContentUrl);
          }
          setViewerContentUrl(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [viewerOpen, viewerItem]);

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
          try {
            setIsLoadingData(true);

            // Caso de edição: buscar detalhes do relatório e itens
            if (editingReport?.id) {
              // Buscar relatório do banco para campos atuais
              let detailedReport = null;
              try {
                detailedReport = await db.expenseReports.getById(editingReport.id);
              } catch (e) {
                console.warn('Falha ao buscar detalhes do relatório, usando objeto passado:', e);
                detailedReport = editingReport;
              }

              // Buscar itens do relatório
              let items = [];
              try {
                items = await db.expenses.getByReportId(editingReport.id);
              } catch (e) {
                console.warn('Falha ao buscar itens do relatório:', e);
                items = [];
              }

              // Agrupar itens por categoria
              const mapItem = (it) => ({
                id: it.id,
                date: it.expense_date ? it.expense_date.split('T')[0] : formData.date,
                description: it.description || '',
                amount: it.amount || 0,
                currency: it.currency || 'BRL',
                receiptName: it.receipt_filename || null,
                receiptPath: null,
                receiptUrl: it.receipt_url || null
              });

              const transport = items.filter(i => i.category === 'TRANSPORTE').map(mapItem);
              const food = items.filter(i => i.category === 'ALIMENTACAO').map(mapItem);
              const miscellaneous = items.filter(i => i.category === 'DIVERSOS').map(mapItem);
              const advances = items.filter(i => i.category === 'ADIANTAMENTOS').map(mapItem);

              // Formatar CPF salvo como dígitos para visualização
              const formatCpfDigits = (digits) => {
                if (!digits) return ''
                const only = String(digits).replace(/\D/g, '').slice(0, 11)
                return only
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})/, '$1-$2')
              }

              setFormData({
                date: detailedReport?.period_start ? detailedReport.period_start.split('T')[0] : (detailedReport?.created_at ? detailedReport.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                userName: detailedReport?.employee_name || user?.username || user?.email?.split('@')[0] || '',
                cpf: formatCpfDigits(detailedReport?.employee_cpf || ''),
                unit: detailedReport?.department || '',
                sector: detailedReport?.project_code || '',
                transport,
                food,
                miscellaneous,
                advances
              });
            } else {
              // Modo criação: limpar e inicializar
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
          } catch (error) {
            console.error('Erro ao carregar dados do relatório:', error);
            toast({
              title: 'Erro ao carregar dados',
              description: 'Não foi possível carregar as informações do relatório selecionado.',
              variant: 'destructive'
            });
          } finally {
            setIsLoadingData(false);
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

        // Montar payload compatível com o schema atual de expense_reports
        // Normalizar CPF: remover não-dígitos e limitar a 11
        const normalizedCpf = (formData.cpf || '').replace(/\D/g, '').slice(0, 11)
        
        const reportData = {
          user_id: user.id,
          title: `Relatório ${formData.date}`,
          description: `${formData.unit} - ${formData.sector}`,
          status: submit ? 'PENDENTE' : 'RASCUNHO',
          currency: 'BRL',
          submission_date: new Date().toISOString(),
          period_start: formData.date,
          period_end: formData.date,
          department: formData.unit || null,
          project_code: formData.sector || null,
          total_amount: totals.totalAmount,
          employee_name: formData.userName,
          employee_cpf: normalizedCpf
        };

        try {
          let savedReport;
          if (editingReport?.id) {
            savedReport = await db.expenseReports.update(editingReport.id, reportData);
          } else {
            savedReport = await db.expenseReports.create(reportData);
          }

          // Sincronizar itens na expense_items vinculados ao relatório (create/update/delete)
          const sections = [
            { key: 'transport', category: 'TRANSPORTE' },
            { key: 'food', category: 'ALIMENTACAO' },
            { key: 'miscellaneous', category: 'DIVERSOS' },
            { key: 'advances', category: 'ADIANTAMENTOS' }
          ];
          // Carregar itens existentes (apenas no modo edição)
          let existingItems = []
          if (editingReport?.id) {
            try {
              existingItems = await db.expenses.getByReportId(editingReport.id)
            } catch (e) {
              existingItems = []
            }
          }

          const existingMap = new Map((existingItems || []).map(it => [it.id, it]))
          const formItems = []
          for (const sec of sections) {
            for (const item of formData[sec.key]) {
              formItems.push({ sec, item })
            }
          }

          const formIds = new Set()
          for (const { sec, item } of formItems) {
            const payload = {
              expense_report_id: savedReport.id,
              category: sec.category,
              description: item.description || `${sec.category} - ${formData.unit}`,
              amount: parseFloat(item.amount) || 0,
              currency: item.currency || 'BRL',
              expense_date: item.date || formData.date,
              receipt_url: item.receiptUrl || null,
              receipt_filename: item.receiptName || null,
              is_reimbursable: sec.key === 'advances' ? false : true,
              employee_name: formData.userName,
              employee_cpf: normalizedCpf
            }

            if (item.id && existingMap.has(item.id)) {
              // update existente
              formIds.add(item.id)
              try {
                await db.expenses.update(item.id, payload)
              } catch (e) {
                console.error('Falha ao atualizar item:', e)
              }
            } else {
              // create novo
              try {
                const created = await db.expenses.create(payload)
                if (created?.id) {
                  formIds.add(created.id)
                }
              } catch (e) {
                console.error('Falha ao inserir item:', e)
              }
            }
          }

          // Deletar itens removidos no formulário (apenas no modo edição)
          if (editingReport?.id && existingItems?.length) {
            for (const old of existingItems) {
              if (!formIds.has(old.id)) {
                try {
                  await db.expenses.delete(old.id)
                } catch (e) {
                  console.error('Falha ao deletar item removido:', e)
                }
              }
            }
          }

          // Registro de submissão
          try {
            await db.appUsers.update(savedReport.user_id, {}) // noop to ensure session
            await db.categories.getAll() // noop simple call
          } catch (_) {}

          // Registrar sucesso
          try {
            await supabase.from('submission_logs').insert([
              { user_id: user.id, report_id: savedReport.id, action: editingReport?.id ? 'UPDATE' : 'CREATE', status: 'SUCCESS' }
            ])
          } catch (logErr) {
            console.warn('Falha ao registrar submissão (sucesso):', logErr)
          }

          toast({
            title: submit ? "Relatório enviado!" : "Relatório salvo!",
            description: submit ? "Seu relatório foi enviado para aprovação." : "Suas alterações foram salvas.",
            className: submit ? 'bg-success text-success-foreground' : ''
          })
          
          if (submit) {
            onBack();
          }
        } catch (error) {
          console.error('Erro ao salvar relatório:', error);

          // Registrar erro
          try {
            await supabase.from('submission_logs').insert([
              { user_id: user.id, report_id: editingReport?.id || null, action: editingReport?.id ? 'UPDATE' : 'CREATE', status: 'ERROR', error_message: String(error.message || error) }
            ])
          } catch (logErr) {
            console.warn('Falha ao registrar submissão (erro):', logErr)
          }
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
                          <label
                            className="flex-1 flex items-center justify-center px-3 py-2 border border-input rounded-lg cursor-pointer hover:bg-accent transition-colors"
                            onClick={(e) => {
                              if (item.receiptUrl) {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewerItem({
                                  url: item.receiptUrl,
                                  filename: item.receiptName,
                                  id: item.id,
                                  category
                                });
                                setViewerOpen(true);
                              }
                            }}
                            title={item.receiptUrl ? 'Visualizar comprovante' : 'Upload de comprovante'}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {item.receiptName ? (
                              <span
                                className="text-[12px] truncate max-w-[140px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px]"
                                title={item.receiptName}
                                aria-label={item.receiptName}
                                data-tooltip={item.receiptName}
                              >
                                {`✓ ${item.receiptName.length > 15 ? item.receiptName.slice(0, 20) + '...' : item.receiptName}`}
                              </span>
                            ) : (
                              <span className="text-sm">Upload</span>
                            )}
                            {!item.receiptUrl && (
                              <input
                                type="file"
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={(e) => handleFileChange(category, item.id, e.target.files[0])}
                                className="hidden"
                              />
                            )}
                          </label>
                          <Button size="sm" variant="outline" onClick={() => openCamera(category, item.id)}><Camera className="w-4 h-4" /></Button>
                          {/* Botão de visualização removido: ação de visualizar está no label acima */}
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
          {viewerOpen && viewerItem && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Comprovante</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={async () => {
                      try {
                        const key = getStoragePathFromPublicUrl(viewerItem.url)
                        if (key) {
                          await deleteReceipt(key)
                        }
                        // limpar dados no form e no banco
                        setFormData(prev => ({
                          ...prev,
                          [viewerItem.category]: prev[viewerItem.category].map(it => it.id === viewerItem.id ? {
                            ...it,
                            receiptUrl: null,
                            receiptName: null,
                            receiptPath: null
                          } : it)
                        }))
                        try {
                          await db.expenses.update(viewerItem.id, {
                            receipt_url: null,
                            receipt_filename: null
                          })
                        } catch(_){ }
                        setViewerOpen(false)
                      } catch (e) {
                        console.error('Erro ao excluir recibo:', e)
                      }
                    }}>Excluir</Button>
                    <label className="inline-flex items-center justify-center text-sm border px-3 py-2 rounded-md cursor-pointer">
                      Trocar arquivo
                      <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const result = await uploadReceipt(file, editingReport?.id || user.id)
                          if (result.success) {
                            setFormData(prev => ({
                              ...prev,
                              [viewerItem.category]: prev[viewerItem.category].map(it => it.id === viewerItem.id ? {
                                ...it,
                                receiptUrl: result.publicUrl,
                                receiptName: file.name
                              } : it)
                            }))
                            try {
                              await db.expenses.update(viewerItem.id, {
                                receipt_url: result.publicUrl,
                                receipt_filename: file.name
                              })
                            } catch(_){ }
                          }
                        } catch (err) {
                          console.error('Erro ao atualizar recibo:', err)
                        }
                      }} />
                    </label>
                    <Button variant="ghost" onClick={() => setViewerOpen(false)}>Fechar</Button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  {viewerLoading && (
                    <div className="text-center text-muted-foreground">Carregando comprovante...</div>
                  )}
                  {!viewerLoading && viewerError && (
                    <div className="text-center">
                      <p className="text-destructive mb-3">{viewerError}</p>
                      <Button variant="outline" onClick={() => window.open(viewerItem.url, '_blank')}>Abrir em nova aba</Button>
                    </div>
                  )}
                  {!viewerLoading && !viewerError && viewerContentUrl && (
                    (viewerItem.filename?.toLowerCase().endsWith('.pdf') || (viewerItem.url || '').toLowerCase().endsWith('.pdf')) ? (
                      <iframe src={viewerContentUrl} title="Comprovante PDF" className="w-full h-[70vh]" />
                    ) : (
                      <img src={viewerContentUrl} alt={viewerItem.filename || 'Comprovante'} className="max-w-full max-h-[70vh] object-contain" />
                    )
                  )}
                </div>
              </div>
            </div>
          )}
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
              {isLoadingData && (
                <div className="mb-6 p-4 border border-border rounded-lg bg-muted text-muted-foreground">
                  Carregando dados do relatório...
                </div>
              )}
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