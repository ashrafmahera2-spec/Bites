import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning'
}) => {
  const { t, isRTL } = useLanguage();

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-orange-600 hover:bg-orange-700 text-white',
    info: 'bg-blue-600 hover:bg-blue-700 text-white'
  };

  const iconColors = {
    danger: 'text-red-600 bg-red-50',
    warning: 'text-orange-600 bg-orange-50',
    info: 'text-blue-600 bg-blue-50'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 hover:bg-gray-100 rounded-full transition-colors`}
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="p-8">
              <div className={`flex flex-col items-center text-center ${isRTL ? 'rtl' : 'ltr'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${iconColors[type]}`}>
                  <AlertTriangle size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8">{message}</p>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`flex-1 py-3.5 rounded-2xl font-bold transition-all shadow-lg ${colors[type]}`}
                  >
                    {confirmText || t('common.confirm')}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    {cancelText || t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
