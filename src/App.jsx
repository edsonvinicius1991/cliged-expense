import React, { useState, useEffect } from 'react';
    import { Helmet } from 'react-helmet';
    import HomePage from '@/pages/HomePage';
    import LoginPage from '@/pages/LoginPage';
    import CollaboratorDashboard from '@/pages/CollaboratorDashboard';
    import AdminDashboard from '@/pages/AdminDashboard';
    import ExpenseReportForm from '@/pages/ExpenseReportForm';
    import ReportDetailsView from '@/pages/ReportDetailsView';
    import { Toaster } from '@/components/ui/toaster';

    function App() {
      const [currentPage, setCurrentPage] = useState('home');
      const [userType, setUserType] = useState(null);
      const [currentUser, setCurrentUser] = useState(null);
      const [editingReport, setEditingReport] = useState(null);
      const [viewingReport, setViewingReport] = useState(null);

      useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setUserType(user.type);
          setCurrentPage(user.type === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
        }
      }, []);

      const handleSelectUserType = (type) => {
        setUserType(type);
        setCurrentPage('login');
      };

      const handleLogin = (user) => {
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentPage(user.type === 'admin' ? 'admin-dashboard' : 'collaborator-dashboard');
      };

      const handleLogout = () => {
        setCurrentUser(null);
        setUserType(null);
        localStorage.removeItem('currentUser');
        setCurrentPage('home');
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