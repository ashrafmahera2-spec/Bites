import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, Clock, Globe, Smartphone, Trash2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ErrorLog {
  id: number;
  message: string;
  stack: string;
  url: string;
  userAgent: string;
  createdAt: string;
}

const AdminErrors: React.FC = () => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const data = await api.getErrors();
      setErrors(data);
    } catch (error) {
      console.error("Error fetching errors:", error);
      toast.error('فشل تحميل سجل الأخطاء');
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = async () => {
    if (!window.confirm('هل أنت متأكد من مسح جميع السجلات؟')) return;
    try {
      setLoading(true);
      await api.clearErrors();
      setErrors([]);
      toast.success('تم مسح السجلات بنجاح');
    } catch (error: any) {
      console.error("Error clearing errors:", error);
      toast.error('فشل مسح السجلات: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-red-600" />
          سجل أخطاء المنيو
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={clearErrors}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-all font-bold text-sm"
          >
            <Trash2 size={18} />
            مسح السجلات
          </button>
          <button
            onClick={fetchErrors}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">جاري التحميل...</div>
      ) : errors.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">لا توجد أخطاء مسجلة</h3>
          <p className="text-gray-500">كل شيء يعمل بشكل مثالي في المنيو</p>
        </div>
      ) : (
        <div className="space-y-4">
          {errors.map((error) => (
            <div key={error.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-red-600 mb-1">{error.message}</h3>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(error.createdAt).toLocaleString('ar-EG')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe size={14} />
                      {error.url}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Smartphone size={14} />
                  <span className="font-medium">المتصفح:</span>
                  <span className="truncate">{error.userAgent}</span>
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-gray-700 mb-1">Stack Trace:</p>
                    <pre className="text-[10px] text-gray-500 overflow-x-auto p-2 bg-gray-100 rounded border border-gray-200 font-mono leading-tight max-h-32 overflow-y-auto">
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
