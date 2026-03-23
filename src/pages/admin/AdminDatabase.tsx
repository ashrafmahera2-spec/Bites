import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Database, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDatabase: React.FC = () => {
  const [config, setConfig] = useState({
    host: '',
    user: '',
    password: '',
    database: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getDbConfig();
        setConfig(data);
      } catch (error) {
        console.error("Error fetching db config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const result = await api.updateDbConfig(config);
      if (result.success) {
        setStatus({ type: 'success', message: 'تم الاتصال بقاعدة البيانات وتثبيت الجداول بنجاح!' });
      } else {
        setStatus({ type: 'error', message: result.message || 'فشل الاتصال بقاعدة البيانات. تأكد من البيانات المدخلة.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'حدث خطأ غير متوقع أثناء محاولة الاتصال.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-orange-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="text-orange-600" />
          إعدادات قاعدة البيانات (MySQL)
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl"
      >
        <div className="mb-8">
          <p className="text-gray-500 leading-relaxed">
            قم بإدخال بيانات الاتصال بقاعدة بيانات MySQL الخاصة بك. سيقوم النظام تلقائياً بإنشاء الجداول اللازمة وتثبيت البيانات الأساسية فور نجاح الاتصال.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">عنوان السيرفر (Host)</label>
              <input
                type="text"
                required
                placeholder="localhost"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={config.host}
                onChange={e => setConfig({ ...config, host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم قاعدة البيانات</label>
              <input
                type="text"
                required
                placeholder="bites_db"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={config.database}
                onChange={e => setConfig({ ...config, database: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">اسم المستخدم</label>
              <input
                type="text"
                required
                placeholder="root"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={config.user}
                onChange={e => setConfig({ ...config, user: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">كلمة المرور</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none"
                value={config.password}
                onChange={e => setConfig({ ...config, password: e.target.value })}
              />
            </div>
          </div>

          {status && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-all disabled:bg-gray-300"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                جاري محاولة الاتصال...
              </>
            ) : (
              <>
                <Save size={20} />
                حفظ البيانات واختبار الاتصال
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminDatabase;
