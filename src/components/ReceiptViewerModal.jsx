import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, getStoragePathFromPublicUrl } from '@/lib/supabase';

  const ReceiptViewerModal = ({ report, onClose }) => {
      const [currentIndex, setCurrentIndex] = useState(0);
      const [viewerUrl, setViewerUrl] = useState(null);
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState(null);

      // Monta lista de recibos a partir de expense_items (preferencial) ou categorias antigas
      const receipts = useMemo(() => {
        try {
          const items = Array.isArray(report?.expense_items)
            ? report.expense_items
            : [
                ...(report?.transport || []),
                ...(report?.food || []),
                ...(report?.miscellaneous || []),
                ...(report?.advances || []),
              ];

          return (items || [])
            .filter(it => !!it.receipt_url)
            .map(it => {
              const filename = it.receipt_filename || '';
              const isPdf = filename.toLowerCase().endsWith('.pdf') || (it.receipt_url || '').toLowerCase().endsWith('.pdf');
              return {
                id: it.id,
                description: it.description || 'Sem descrição',
                publicUrl: it.receipt_url,
                filename,
                isPdf,
              };
            });
        } catch (_) {
          return [];
        }
      }, [report]);

      useEffect(() => {
        const handleKeyDown = (e) => {
          if (e.key === 'Escape') onClose();
          if (e.key === 'ArrowLeft') prevReceipt();
          if (e.key === 'ArrowRight') nextReceipt();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [receipts, onClose]);

      // Carregar conteúdo da posição atual
      useEffect(() => {
        const load = async () => {
          setError(null);
          setLoading(true);
          try {
            const current = receipts[currentIndex];
            if (!current) {
              setViewerUrl(null);
              return;
            }
            if (current.isPdf) {
              const key = getStoragePathFromPublicUrl(current.publicUrl);
              if (!key) throw new Error('Chave de Storage não encontrada para o recibo');
              const { data, error } = await supabase.storage.from('receipts').download(key);
              if (error) throw error;
              const blobUrl = URL.createObjectURL(data);
              setViewerUrl(blobUrl);
            } else {
              setViewerUrl(current.publicUrl);
            }
          } catch (e) {
            console.error('Erro ao carregar recibo:', e);
            setError('Não foi possível carregar o comprovante.');
            setViewerUrl(null);
          } finally {
            setLoading(false);
          }
        };
        load();
        return () => {
          if (viewerUrl && viewerUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewerUrl);
          }
        };
      }, [currentIndex, receipts]);

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
                {receipts.length === 0 && (
                  <div className="text-center text-slate-500 flex flex-col items-center">
                    <FileQuestion className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="font-medium">Nenhum comprovante encontrado</p>
                    <p className="text-sm">Não há comprovantes anexados para este relatório.</p>
                  </div>
                )}
                {receipts.length > 0 && (
                  <div className="w-full h-full flex items-center justify-center relative">
                    {loading && <p className="text-muted-foreground">Carregando comprovante...</p>}
                    {!loading && error && (
                      <div className="text-center">
                        <p className="text-destructive mb-3">{error}</p>
                        <Button variant="outline" onClick={() => window.open(receipts[currentIndex].publicUrl, '_blank')}>Abrir em nova aba</Button>
                      </div>
                    )}
                    {!loading && !error && viewerUrl && (
                      receipts[currentIndex].isPdf ? (
                        <iframe src={viewerUrl} title={`Comprovante ${currentIndex + 1}`} className="w-full h-[70vh]" />
                      ) : (
                        <motion.img
                          key={currentIndex}
                          src={viewerUrl}
                          alt={`Comprovante ${currentIndex + 1}`}
                          className="max-w-full max-h-[70vh] object-contain rounded-lg"
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.3 }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
              
              {receipts.length > 0 && (
                <div className="p-4 border-t flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-600 truncate flex-shrink">
                        {receipts[currentIndex]?.description || ''}
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