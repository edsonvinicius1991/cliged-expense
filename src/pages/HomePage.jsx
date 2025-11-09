import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, TrendingUp, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage = ({ onSelectUserType }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
<img src="/amplus-logo-svg.svg" alt="Amplus Solutions Logo" style={{ height: '60px' }} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Bem-vindo ao Sistema de Despesas
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie relatórios de despesas com eficiência e transparência
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-custom-light hover:shadow-xl transition-all duration-300 p-8 border border-border h-full">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Colaborador</h3>
                <p className="text-muted-foreground mb-6">
                  Crie e gerencie seus relatórios de despesas, acompanhe aprovações e receba reembolsos.
                </p>
                <Button 
                  onClick={() => onSelectUserType('collaborator')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Acessar como Colaborador
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-custom-light hover:shadow-xl transition-all duration-300 p-8 border border-border h-full">
                <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Administrador/Financeiro</h3>
                <p className="text-muted-foreground mb-6">
                  Aprove relatórios, gerencie usuários e tenha visão completa das despesas corporativas.
                </p>
                <Button 
                  onClick={() => onSelectUserType('admin')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Acessar como Administrador
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-border">
              <TrendingUp className="w-10 h-10 text-primary mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Controle Total</h4>
              <p className="text-sm text-muted-foreground">Acompanhe todas as despesas em tempo real</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-border">
              <FileText className="w-10 h-10 text-primary mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Relatórios Detalhados</h4>
              <p className="text-sm text-muted-foreground">Exportação em PDF e Excel para análise</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-border">
              <Shield className="w-10 h-10 text-secondary mb-3" />
              <h4 className="font-semibold text-foreground mb-2">Segurança Garantida</h4>
              <p className="text-sm text-muted-foreground">Dados protegidos e auditoria completa</p>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="bg-white border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-2">© 2025 Sistema de Despesas CLIGED</p>
          <p className="text-sm text-muted-foreground">Contato: financeiro@cliged.com</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;