import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import HomePage from '@/pages/HomePage';
    import LoginPage from '@/pages/LoginPage';
    import CollaboratorDashboard from '@/pages/CollaboratorDashboard';
    import AdminDashboard from '@/pages/AdminDashboard';
    import ExpenseReportForm from '@/pages/ExpenseReportForm';
    import ReportDetailsView from '@/pages/ReportDetailsView';
    import { Toaster } from '@/components/ui/toaster';
    import { auth } from '@/lib/supabase';

    function App() {
      const [currentPage, setCurrentPage] = useState('home');
      const [userType, setUserType] = useState(null);
      const [currentUser, setCurrentUser] = useState(null);
      const [editingReport, setEditingReport] = useState(null);
      const [viewingReport, setViewingReport] = useState(null);

      useEffect(() => {
  // Verificar se há usuário logado no sistema de autenticação
  const checkCurrentUser = async () => {
    try {
      const user = await auth.getCurrentUser();
      console.log('Usuário recuperado na inicialização:', user);
      
      if (user) {
        setCurrentUser(user);
        setUserType(user.role?.toLowerCase() || 'user');
        setCurrentPage(user.role?.toLowerCase() === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
      } else {
        console.log('Nenhuma sessão ativa encontrada');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário atual:', error);
    }
  };

  checkCurrentUser();

  // Monitorar mudanças no estado de autenticação
  const unsubscribe = auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change:', event, session);
    
    if (session?.user) {
      // Buscar perfil complementar
      let profile = null;
      try {
        profile = await db.appUsers.getById(session.user.id);
      } catch (profileError) {
        console.warn('Perfil não encontrado:', profileError);
      }
      
      const userData = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.user_metadata?.username || session.user.email.split('@')[0],
        role: session.user.user_metadata?.role || 'USER',
        type: session.user.user_metadata?.role?.toLowerCase() || 'user',
        profile: profile
      };
      
      setCurrentUser(userData);
      setUserType(userData.role?.toLowerCase() || 'user');
      setCurrentPage(userData.role?.toLowerCase() === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
    } else {
      setCurrentUser(null);
      setUserType(null);
      setCurrentPage('home');
    }
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
}, []);

      const handleSelectUserType = (type) => {
        setUserType(type);
        setCurrentPage('login');
      };

      const handleLogin = (user) => {
        setCurrentUser(user);
        setCurrentPage(user.type === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
      };

      const handleLogout = async () => {
        try {
          await auth.signOut();
          setCurrentUser(null);
          setUserType(null);
          setCurrentPage('home');
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
          // Mesmo com erro, limpar o estado local
          setCurrentUser(null);
          setUserType(null);
          setCurrentPage('home');
        }
      };

      const handleCreateReport = () => {
        setEditingReport(null);
        setCurrentPage('expense-form');
      };

      const handleEditReport = (report) => {
        setEditingReport(report);
        setCurrentPage('expense-form');
      };
      
      const handleViewReportDetails = (report) => {
        const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
        const reportWithReceipts = { ...report };
        const categories = ['transport', 'food', 'miscellaneous', 'advances'];
        
        categories.forEach(category => {
          if (reportWithReceipts[category]) {
            reportWithReceipts[category] = reportWithReceipts[category].map(item => {
              if (item.receiptId && receiptsData[item.receiptId]) {
                return { ...item, receipt: receiptsData[item.receiptId] };
              }
              return item;
            });
          }
        });
        
        setViewingReport(reportWithReceipts);
        setCurrentPage('report-details');
      };

      const handleBackToDashboard = () => {
        setEditingReport(null);
        setViewingReport(null);
        setCurrentPage(currentUser.type === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
      };

      return (
        <>
          <Helmet>
            <title>Sistema de Relatório de Despesas Corporativas</title>
            <meta name="description" content="Gerencie despesas corporativas com facilidade - sistema completo de relatórios, aprovações e controle financeiro" />
          </Helmet>
          
          <div className="min-h-screen">
            {currentPage === 'home' && (
              <HomePage onSelectUserType={handleSelectUserType} />
            )}
            
            {currentPage === 'login' && (
              <LoginPage 
                userType={userType} 
                onLogin={handleLogin}
                onBack={() => setCurrentPage('home')}
              />
            )}
            
            {currentPage === 'collaborator-dashboard' && currentUser && (
              <CollaboratorDashboard 
                user={currentUser}
                onLogout={handleLogout}
                onCreateReport={handleCreateReport}
                onEditReport={handleEditReport}
              />
            )}
            
            {currentPage === 'admin-dashboard' && currentUser && (
              <AdminDashboard 
                user={currentUser}
                onLogout={handleLogout}
                onViewDetails={handleViewReportDetails}
              />
            )}
            
            {currentPage === 'expense-form' && currentUser && (
              <ExpenseReportForm 
                user={currentUser}
                editingReport={editingReport}
                onBack={handleBackToDashboard}
              />
            )}

            {currentPage === 'report-details' && currentUser && viewingReport && (
              <ReportDetailsView 
                report={viewingReport}
                user={currentUser}
                onBack={handleBackToDashboard}
              />
            )}
          </div>
          
          <Toaster />
        </>
      );
    }

    export default App;