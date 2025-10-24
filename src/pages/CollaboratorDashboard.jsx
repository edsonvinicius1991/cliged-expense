import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { Plus, FileText, Clock, CheckCircle, XCircle, LogOut, DollarSign, Calendar } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';

    const CollaboratorDashboard = ({
      user,
      onLogout,
      onCreateReport,
      onEditReport
    }) => {
      const [reports, setReports] = useState([]);
      const {
        toast
      } = useToast();

      useEffect(() => {
        loadReports();
      }, [user]);

      const loadReports = () => {
        const allReports = JSON.parse(localStorage.getItem('expenseReports') || '[]');
        const userReports = allReports.filter(r => r.userId === user.id);
        setReports(userReports);
      };

      const getStatusBadge = status => {
        const badges = {
          pending: {
            label: 'Pendente',
            color: 'bg-warning text-warning-foreground',
            icon: Clock
          },
          approved: {
            label: 'Aprovado',
            color: 'bg-success text-success-foreground',
            icon: CheckCircle
          },
          rejected: {
            label: 'Rejeitado',
            color: 'bg-destructive text-destructive-foreground',
            icon: XCircle
          }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${badge.color}`}>
            <Icon className="w-3 h-3" />
            {badge.label}
          </span>;
      };

      const formatCurrency = value => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        approved: reports.filter(r => r.status === 'approved').length,
        rejected: reports.filter(r => r.status === 'rejected').length,
        totalApprovedToReceive: reports.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.toReceive || 0), 0)
      };

      const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay }}
            className="bg-gradient-to-br from-muted to-white rounded-lg shadow-custom-light p-5 border border-border"
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-foreground text-sm font-bold">{title}</span>
                <Icon className={`w-5 h-5 ${colorClass}`} />
            </div>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </motion.div>
      );

      return <div className="min-h-screen bg-white">
          <header className="bg-white shadow-sm border-b border-border sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src="https://horizons-cdn.hostinger.com/55c4ad92-877a-433d-b426-bfb11b6e624b/cee09543a309484cf4baa2c2eb1babb9.png" alt="CLIGED Logo" style={{ height: '50px' }} />
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground hidden sm:block">Olá, <span className="font-semibold text-foreground">{user.name}</span>!</p>
                    <Button variant="outline" onClick={onLogout} className="border-border hover:bg-accent">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-5 gap-4 mb-8">
                <StatCard title="Total" value={stats.total} icon={FileText} colorClass="text-primary" delay={0.1} />
                <StatCard title="Pendentes" value={stats.pending} icon={Clock} colorClass="text-warning-foreground" delay={0.2} />
                <StatCard title="Aprovados" value={stats.approved} icon={CheckCircle} colorClass="text-secondary" delay={0.3} />
                <StatCard title="Rejeitados" value={stats.rejected} icon={XCircle} colorClass="text-destructive" delay={0.4} />
                <StatCard title="A Receber" value={formatCurrency(stats.totalApprovedToReceive)} icon={DollarSign} colorClass="text-primary" delay={0.5} />
            </div>

            <div className="bg-white rounded-lg shadow-custom-light border border-border p-5 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-foreground">Minhas Despesas</h2>
                <Button onClick={onCreateReport} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Relatório
                </Button>
              </div>

              {reports.length === 0 ? <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-border mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg mb-4">Você ainda não tem relatórios.</p>
                  <Button onClick={onCreateReport} className="bg-primary hover:bg-primary/90">
                      Criar Primeiro Relatório
                  </Button>
                </div> : <div className="space-y-4">
                  {reports.map((report, index) => <motion.div key={report.id} initial={{
                opacity: 0,
                x: -20
              }} animate={{
                opacity: 1,
                x: 0
              }} transition={{
                delay: index * 0.1
              }} className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer bg-white hover:bg-muted" onClick={() => onEditReport(report)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-lg mb-1">
                            Relatório #{report.id.slice(0, 8)}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              {new Date(report.date).toLocaleDateString('pt-BR')}
                            </span>
                            {report.sector && (
                              <span className="flex items-center gap-1.5">
                                <FileText className="w-4 h-4" />
                                {report.sector}
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Gasto</p>
                          <p className="font-semibold text-foreground">{formatCurrency(report.totalAmount || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">A Receber</p>
                          <p className="font-semibold text-secondary">{formatCurrency(report.toReceive || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">A Devolver</p>
                          <p className="font-semibold text-destructive">{formatCurrency(report.toReturn || 0)}</p>
                        </div>
                      </div>

                      {report.rejectionReason && <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm text-destructive">
                            <strong>Motivo da rejeição:</strong> {report.rejectionReason}
                          </p>
                        </div>}
                    </motion.div>)}
                </div>}
            </div>
          </main>
        </div>;
    };
    export default CollaboratorDashboard;