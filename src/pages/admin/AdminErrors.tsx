import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, Clock, Globe, Smartphone, Trash2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

interface ErrorLog {
  id: number;
  message: string;
  stack: string;
  url: string;
  userAgent: string;
  createdAt: string;
}

const AdminErrors: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const data = await api.getErrors();
      setErrors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching errors:", error);
      toast.error(t('admin.errors_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = async () => {
    try {
      setLoading(true);
      await api.clearErrors();
      setErrors([]);
      toast.success(t('admin.errors_clear_success'));
    } catch (error: any) {
      console.error("Error clearing errors:", error);
      toast.error(t('admin.errors_clear_error') + ': ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={clearErrors}
        title={t('admin.errors_clear')}
        message={t('admin.errors_clear_confirm')}
        type="danger"
      />
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <AlertTriangle className="text-red-600" />
          {t('admin.errors_title')}
        </h2>
        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className={`flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all font-bold text-sm ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Trash2 size={18} />
            {t('admin.errors_clear')}
          </button>
          <button
            onClick={fetchErrors}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('admin.errors_refresh')}
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">{t('common.loading')}</div>
      ) : errors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{t('admin.errors_no_data')}</h3>
          <p className="text-gray-500">{t('admin.errors_no_data_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {errors.map((error) => (
            <div key={error.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
              <div className={`flex items-start justify-between gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <h3 className={`font-bold text-red-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>{error.message}</h3>
                  <div className={`flex flex-wrap gap-4 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Clock size={14} />
                      {error.createdAt ? new Date(error.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US') : 'N/A'}
                    </span>
                    <span className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe size={14} />
                      {error.url}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className={`flex items-center gap-2 text-xs text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Smartphone size={14} />
                  <span className="font-medium">{t('admin.errors_browser')}</span>
                  <span className="truncate">{error.userAgent}</span>
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <p className={`text-xs font-bold text-gray-700 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>Stack Trace:</p>
                    <pre className={`text-[10px] text-gray-500 overflow-x-auto p-2 bg-gray-100 rounded border border-gray-200 font-mono leading-tight max-h-32 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}>
                      {error.stack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminErrors;
