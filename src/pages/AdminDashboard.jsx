import React, { useState, useEffect, useMemo } from 'react';
    import { motion } from 'framer-motion';
    import { FileText, LogOut, Clock, CheckCircle, XCircle, Search, Eye, FileSpreadsheet, Download, DollarSign, ClipboardList } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { useToast } from '@/components/ui/use-toast';
    import ApprovalDialog from '@/components/ApprovalDialog';
    import ExpenseChart from '@/components/ExpenseChart';
    import ExportDialog from '@/components/ExportDialog';
    import CashFlowModal from '@/components/CashFlowModal';
    import MonthlyControl from '@/components/MonthlyControl';
    import JSZip from 'jszip';
    import ComboBox from '@/components/ComboBox';
    import ReceiptViewerModal from '@/components/ReceiptViewerModal';

    const AdminDashboard = ({ user, onLogout, onViewDetails }) => {
      const [reports, setReports] = useState([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('all');
      const [selectedReport, setSelectedReport] = useState(null);
      const [showApprovalDialog, setShowApprovalDialog] = useState(false);
      const [approvalAction, setApprovalAction] = useState(null);
      const [showExportDialog, setShowExportDialog] = useState(false);
      const [exportType, setExportType] = useState(null);
      const [showCashFlowModal, setShowCashFlowModal] = useState(false);
      const [showReceiptViewer, setShowReceiptViewer] = useState(false);
      const [reportForReceipts, setReportForReceipts] = useState(null);
      const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      });
      const { toast } = useToast();

      useEffect(() => {
        loadReports();
        const handleStorageChange = (e) => {
          if (e.key === 'expenseReports') {
            loadReports();
          }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
      }, []);

      const loadReports = () => {
        const allReports = JSON.parse(localStorage.getItem('expenseReports') || '[]');
        setReports(allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      };

      const filteredReports = useMemo(() => {
        return reports.filter(report => {
          if (report.status === 'draft') return false;

          const searchMatch = searchTerm.toLowerCase() === '' ||
            report.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.id.toLowerCase().includes(searchTerm.toLowerCase());
          
          const statusMatch = statusFilter === 'all' || report.status === statusFilter;

          return searchMatch && statusMatch;
        });
      }, [reports, searchTerm, statusFilter]);
      
      const handleViewReceipts = (report) => {
        setReportForReceipts(report);
        setShowReceiptViewer(true);
      };

      const monthOptions = useMemo(() => {
        const options = new Set();
        reports.forEach(report => {
          const date = new Date(report.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          options.add(monthKey);
        });
        const sortedOptions = Array.from(options).sort().reverse();
        return sortedOptions.map(monthKey => {
            const [year, month] = monthKey.split('-');
            const date = new Date(year, month - 1);
            return {
                value: monthKey,
                label: `${date.toLocaleString('pt-BR', { month: 'long' })}/${year}`.replace(/^\w/, c => c.toUpperCase())
            };
        });
    }, [reports]);

      const stats = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const approvedReportsThisMonth = reports.filter(r => {
          const reportDate = new Date(r.date);
          return r.status === 'approved' &&
                 reportDate.getFullYear() === year &&
                 (reportDate.getMonth() + 1) === month;
        });

        const totalApproved = approvedReportsThisMonth.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
        
        return {
          pendingCount: reports.filter(r => r.status === 'pending').length,
          totalApproved,
        };
      }, [reports, selectedMonth]);

      const handleApprovalAction = (report, action) => {
        setSelectedReport(report);
        setApprovalAction(action);
        setShowApprovalDialog(true);
      };

      const confirmApproval = (approved, reason = '') => {
        const updatedReports = reports.map(r => {
          if (r.id === selectedReport.id) {
            const signature = {
              name: user.name,
              role: user.role,
              timestamp: new Date().toISOString(),
              action: approved ? 'approved' : 'rejected'
            };
            return {
              ...r,
              status: approved ? 'approved' : 'rejected',
              rejectionReason: approved ? null : reason,
              signatures: [...(r.signatures || []), signature],
            };
          }
          return r;
        });
        localStorage.setItem('expenseReports', JSON.stringify(updatedReports));
        setReports(updatedReports);
        setShowApprovalDialog(false);
        setSelectedReport(null);
        setApprovalAction(null);
        toast({
          title: `Relatório ${approved ? "aprovado" : "rejeitado"}!`,
          description: `O colaborador será notificado.`,
          className: approved ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
        });
      };

      const openExportDialog = (type) => {
        setExportType(type);
        setShowExportDialog(true);
      };

      const handleDownloadAllReceipts = async (report) => {
        const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
        const zip = new JSZip();
        const allItems = [
          ...(report.transport || []),
          ...(report.food || []),
          ...(report.miscellaneous || []),
          ...(report.advances || []),
        ];

        const receipts = allItems.filter(item => item.receiptId && receiptsData[item.receiptId]);

        if (receipts.length === 0) {
          toast({
            title: "Nenhum comprovante",
            description: "Este relatório não possui comprovantes para baixar.",
            variant: "destructive"
          });
          return;
        }

        receipts.forEach((item, index) => {
          const receiptData = receiptsData[item.receiptId];
          const base64Data = receiptData.split(',')[1];
          const fileType = receiptData.split(';')[0].split('/')[1].split('+')[0] || 'jpg';
          const fileName = `${item.category || 'item'}_${index + 1}.${fileType}`;
          zip.file(fileName, base64Data, { base64: true });
        });

        try {
          const content = await zip.generateAsync({ type: "blob" });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `comprovantes_${report.userName.replace(' ', '_')}_${report.id}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast({ title: "Download iniciado!", description: "O arquivo ZIP com os comprovantes está sendo baixado." });
        } catch (error) {
          console.error("Erro ao gerar ZIP:", error);
          toast({ title: "Erro no Download", description: "Não foi possível gerar o arquivo ZIP.", variant: "destructive" });
        }
      };

      const getStatusBadge = (status) => {
        const badges = {
          pending: { label: 'Pendente', color: 'bg-warning text-warning-foreground', icon: Clock },
          approved: { label: 'Aprovado', color: 'bg-success text-success-foreground', icon: CheckCircle },
          rejected: { label: 'Rejeitado', color: 'bg-destructive text-destructive-foreground', icon: XCircle }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
            <Icon className="w-3 h-3" />
            {badge.label}
          </span>
        );
      };

      const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      const StatCard = ({ icon: Icon, title, value, color, children }) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gradient-to-br from-muted to-white rounded-lg shadow-custom-light p-5 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">{title}</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.bg}`}>
              <Icon className={`w-5 h-5 ${color.text}`} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary mt-2">{value}</p>
            {children}
          </div>
        </motion.div>
      );

      return (
        <>
          <div className="min-h-screen bg-white">
            <header className="bg-white shadow-sm border-b border-border sticky top-0 z-40">
              <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src="https://horizons-cdn.hostinger.com/55c4ad92-877a-433d-b426-bfb11b6e624b/cee09543a309484cf4baa2c2eb1babb9.png" alt="CLIGED Logo" style={{ height: '50px' }} />
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground hidden sm:block">Olá, <span className="font-semibold text-foreground">{user.name}</span>!</p>
                    <Button variant="outline" onClick={onLogout} size="sm" className="border-border hover:bg-accent">
                      <LogOut className="w-4 h-4 mr-2" /> Sair
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <main className="container mx-auto px-4 py-6">
              <div className="bg-white rounded-lg shadow-custom-light border border-border mb-6">
                <div className="p-5 border-b border-border">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-foreground">Todos os Relatórios</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nome ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-64" />
                      </div>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm w-full sm:w-auto">
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Rejeitados</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-foreground">
                    <thead className="text-xs text-foreground uppercase bg-muted">
                      <tr>
                        <th scope="col" className="px-6 py-3">Colaborador</th>
                        <th scope="col" className="px-6 py-3">Data</th>
                        <th scope="col" className="px-6 py-3">Valor Total</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        <th scope="col" className="px-6 py-3 text-center">Arquivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <FileText className="w-12 h-12 text-border mx-auto mb-3" />
                            <p className="text-muted-foreground">Nenhum relatório encontrado.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredReports.map((report) => (
                          <tr key={report.id} className="bg-white border-b border-border hover:bg-muted">
                            <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{report.userName}</td>
                            <td className="px-6 py-4">{new Date(report.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 font-semibold">{formatCurrency(report.totalAmount + (report.totalAdvances || 0))}</td>
                            <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => onViewDetails(report)}>
                                  <ClipboardList className="w-4 h-4" />
                                </Button>
                                {report.status === 'pending' && (
                                  <>
                                    <Button variant="outline" size="icon" className="text-success-foreground bg-success hover:bg-success/90 border-0" onClick={() => handleApprovalAction(report, 'approve')}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="text-destructive-foreground bg-destructive hover:bg-destructive/90 border-0" onClick={() => handleApprovalAction(report, 'reject')}>
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => handleViewReceipts(report)}>
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDownloadAllReceipts(report)}>
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </Button>
                               </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                 <StatCard icon={Clock} title="Relatórios Pendentes" value={stats.pendingCount} color={{ bg: 'bg-warning/10', text: 'text-warning-foreground' }} />
                 <StatCard 
                    icon={CheckCircle} 
                    title={`Total Aprovado ${monthOptions.find(opt => opt.value === selectedMonth)?.label || ''}`}
                    value={formatCurrency(stats.totalApproved)} 
                    color={{ bg: 'bg-success/10', text: 'text-secondary' }}
                 >
                   <div className="mt-2" style={{ maxWidth: '250px' }}>
                    <ComboBox 
                      options={monthOptions}
                      value={selectedMonth}
                      onChange={(value) => setSelectedMonth(value)}
                      placeholder="Selecione um mês"
                      searchPlaceholder="Buscar mês..."
                      notFoundMessage="Nenhum mês encontrado."
                    />
                   </div>
                 </StatCard>
               </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <ExpenseChart reports={reports} />
                </div>
                <div className="bg-white rounded-lg shadow-custom-light border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Ações Rápidas</h3>
                  <div className="space-y-3">
                      <Button onClick={() => setShowCashFlowModal(true)} variant="outline" className="w-full justify-start">
                          <DollarSign className="w-4 h-4 mr-3 text-primary" /> Situação do Caixa
                      </Button>
                      <Button onClick={() => openExportDialog('csv')} variant="outline" className="w-full justify-start">
                          <FileSpreadsheet className="w-4 h-4 mr-3" /> Exportar Relatórios (CSV)
                      </Button>
                       <Button onClick={() => openExportDialog('tasy')} variant="outline" className="w-full justify-start">
                          <FileText className="w-4 h-4 mr-3" /> Exportar Relatórios (TASY)
                      </Button>
                      <Button onClick={() => openExportDialog('pdf')} variant="outline" className="w-full justify-start">
                          <FileText className="w-4 h-4 mr-3" /> Gerar Relatório Consolidado
                      </Button>
                  </div>
                </div>
              </div>
              
              <MonthlyControl reports={reports} />

            </main>
          </div>
          {showApprovalDialog && (
            <ApprovalDialog
              report={selectedReport}
              action={approvalAction}
              onConfirm={confirmApproval}
              onCancel={() => { setShowApprovalDialog(false); setSelectedReport(null); setApprovalAction(null); }}
            />
          )}
          {showExportDialog && (
            <ExportDialog
              type={exportType}
              reports={filteredReports}
              onClose={() => setShowExportDialog(false)}
            />
          )}
          {showCashFlowModal && (
            <CashFlowModal onClose={() => setShowCashFlowModal(false)} />
          )}
          {showReceiptViewer && reportForReceipts && (
            <ReceiptViewerModal 
              report={reportForReceipts}
              onClose={() => setShowReceiptViewer(false)}
            />
          )}
        </>
      );
    };

    export default AdminDashboard;