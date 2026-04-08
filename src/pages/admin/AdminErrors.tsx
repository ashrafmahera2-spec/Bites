import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, Clock, Globe, Smartphone, Trash2, RefreshCcw, Copy, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [errorToDelete, setErrorToDelete] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      setIsConfirmOpen(false);
    }
  };

  const deleteError = async () => {
    if (errorToDelete === null) return;
    try {
      await api.deleteError(errorToDelete);
      setErrors(prev => prev.filter(e => e.id !== errorToDelete));
      toast.success(t('admin.error_deleted') || 'Error deleted');
    } catch (error) {
      toast.error(t('admin.error_delete_failed') || 'Failed to delete error');
    } finally {
      setIsDeleteConfirmOpen(false);
      setErrorToDelete(null);
    }
  };

  const confirmDelete = (id: number) => {
    setErrorToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied') || 'Copied to clipboard');
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
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setErrorToDelete(null);
        }}
        onConfirm={deleteError}
        title={t('common.delete')}
        message={t('admin.errors_delete_confirm')}
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
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <RefreshCcw className="animate-spin text-orange-600" size={32} />
          <p className="text-gray-500 font-medium">{t('common.loading')}</p>
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-green-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.errors_no_data')}</h3>
          <p className="text-gray-500 max-w-md mx-auto">{t('admin.errors_no_data_desc')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {errors.map((error) => (
            <div 
              key={error.id} 
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${expandedId === error.id ? 'ring-2 ring-red-100 border-red-200' : 'hover:border-gray-200'}`}
            >
              <div className="p-5">
                <div className={`flex items-start justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        Error
                      </span>
                      <span className="text-xs text-gray-400 font-mono">ID: {error.id}</span>
                    </div>
                    <h3 className={`font-bold text-gray-900 mb-2 break-words text-lg leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                      {error.message}
                    </h3>
                    <div className={`flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Clock size={14} className="text-gray-400" />
                        {(() => {
                          if (!error.createdAt) return 'N/A';
                          const date = new Date(error.createdAt);
                          return isNaN(date.getTime()) ? error.createdAt : date.toLocaleString(isRTL ? 'ar-EG' : 'en-US');
                        })()}
                      </span>
                      <span className={`flex items-center gap-1.5 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Globe size={14} className="text-gray-400" />
                        <span className="truncate max-w-[200px]" title={error.url}>{error.url}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={() => confirmDelete(error.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title={t('common.delete')}
                    >
                      <XCircle size={18} />
                    </button>
                    <button
                      onClick={() => setExpandedId(expandedId === error.id ? null : error.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      {expandedId === error.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === error.id && (
                <div className="border-t border-gray-50 bg-gray-50/50 p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('admin.errors_browser')}
                      </p>
                      <div className={`flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded-lg border border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Smartphone size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate font-mono">{error.userAgent}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('admin.errors_url')}
                      </p>
                      <div className={`flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded-lg border border-gray-100 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Globe size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate font-mono">{error.url}</span>
                        <button 
                          onClick={() => copyToClipboard(error.url)}
                          className="ml-auto p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {error.stack && (
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t('admin.errors_stack')}
                        </p>
                        <button
                          onClick={() => copyToClipboard(error.stack)}
                          className={`flex items-center gap-1.5 text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <Copy size={12} />
                          {t('common.copy') || 'Copy'}
                        </button>
                      </div>
                      <pre className={`text-[11px] text-gray-600 overflow-x-auto p-4 bg-white rounded-xl border border-gray-100 font-mono leading-relaxed max-h-64 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}>
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminErrors;
