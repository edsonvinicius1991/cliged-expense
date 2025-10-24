import React, { useState, useEffect, useMemo } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { X, ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';
    import { Button } from '@/components/ui/button';

    const ReceiptViewerModal = ({ report, onClose }) => {
      const [currentIndex, setCurrentIndex] = useState(0);

      const receipts = useMemo(() => {
        const receiptsData = JSON.parse(localStorage.getItem('receiptsData') || '{}');
        const allItems = [
          ...(report.transport || []),
          ...(report.food || []),
          ...(report.miscellaneous || []),
          ...(report.advances || []),
        ];
        
        return allItems
          .filter(item => item.receiptId && receiptsData[item.receiptId])
          .map(item => ({
            id: item.receiptId,
            src: receiptsData[item.receiptId],
            description: item.description || 'Sem descrição'
          }));
      }, [report]);

      useEffect(() => {
        const handleKeyDown = (e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'ArrowLeft') prevReceipt();
          if (e.key === 'ArrowRight') nextReceipt();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [receipts]);

      const nextReceipt = () => {
        setCurrentIndex((prev) => (prev + 1) % receipts.length);
      };

      const prevReceipt = () => {
        setCurrentIndex((prev) => (prev - 1 + receipts.length) % receipts.length);
      };

      return (
        <AnimatePresence>
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Visualizador de Comprovantes</h2>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 p-4 flex items-center justify-center min-h-[400px]">
                {receipts.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentIndex}
                        src={receipts[currentIndex].src}
                        alt={`Comprovante ${currentIndex + 1}`}
                        className="max-w-full max-h-[60vh] object-contain rounded-lg"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                    <FileQuestion className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="font-medium">Nenhum comprovante encontrado</p>
                    <p className="text-sm">Não há imagens de comprovantes para este relatório.</p>
                  </div>
                )}
              </div>
              
              {receipts.length > 0 && (
                <div className="p-4 border-t flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 truncate flex-shrink">
                        {receipts[currentIndex].description}
                    </p>
                    <div className="flex items-center gap-2 flex-none">
                        <Button variant="outline" size="icon" onClick={prevReceipt} disabled={receipts.length <= 1}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <span className="text-sm font-medium text-slate-700 w-16 text-center">
                            {currentIndex + 1} / {receipts.length}
                        </span>
                        <Button variant="outline" size="icon" onClick={nextReceipt} disabled={receipts.length <= 1}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
              )}
            </motion.div>
          </div>
        </AnimatePresence>
      );
    };

    export default ReceiptViewerModal;