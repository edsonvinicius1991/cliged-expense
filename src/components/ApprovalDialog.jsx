import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const ApprovalDialog = ({ report, action: initialAction, onConfirm, onCancel }) => {
  const [action, setAction] = useState(initialAction);
  const [reason, setReason] = useState('');

  useEffect(() => {
    setAction(initialAction);
  }, [initialAction]);

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      return;
    }
    onConfirm(action === 'approve', reason);
  };

  const renderContent = () => {
    if (!action) {
      return (
        <div className="space-y-4">
          <p className="text-muted-foreground mb-6">
            Selecione a ação para o relatório de <strong>{report.userName}</strong>:
          </p>
          <Button
            onClick={() => setAction('approve')}
            className="w-full h-14 bg-success hover:bg-success/90 text-success-foreground text-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Aprovar Relatório
          </Button>
          <Button
            onClick={() => setAction('reject')}
            variant="outline"
            className="w-full h-14 border-destructive text-destructive hover:bg-destructive/10 text-lg"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Rejeitar Relatório
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {action === 'approve' ? (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
            <p className="text-success">
              Você está prestes a aprovar este relatório. O colaborador será notificado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive mb-3">
                Por favor, informe o motivo da rejeição:
              </p>
            </div>
            <div>
              <Label htmlFor="reason" className="text-foreground font-medium">
                Motivo da Rejeição *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                className="mt-2 min-h-[100px]"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={action === 'reject' && !reason.trim()}
            className={`flex-1 ${
              action === 'approve'
                ? 'bg-success hover:bg-success/90 text-success-foreground'
                : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            }`}
          >
            Confirmar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-foreground">
              {action ? (action === 'approve' ? 'Aprovar Relatório' : 'Rejeitar Relatório') : 'Ação Necessária'}
            </h3>
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {renderContent()}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApprovalDialog;