import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CameraCapture = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Erro ao acessar a câmera: ", err);
        toast({
          title: "Erro de Câmera",
          description: "Não foi possível acessar a câmera. Verifique as permissões do navegador.",
          variant: "destructive",
        });
        onCancel();
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const imageData = canvas.toDataURL('image/jpeg');
      onCapture(imageData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-4 border border-slate-700"
      >
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="outline" onClick={onCancel} className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
            <X className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleCapture} className="bg-blue-600 hover:bg-blue-700 text-white scale-110">
            <Camera className="w-5 h-5 mr-2" />
            Capturar
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default CameraCapture;