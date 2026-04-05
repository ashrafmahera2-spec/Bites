import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Database, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminDatabase: React.FC = () => {
  const { t, isRTL } = useLanguage();
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
        setStatus({ type: 'success', message: t('admin.db_success') });
      } else {
        setStatus({ type: 'error', message: result.message || t('admin.db_error') });
      }
    } catch (error) {
      setStatus({ type: 'error', message: t('admin.db_unexpected_error') });
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
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Database className="text-orange-600" />
          {t('admin.db_title')}
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl ${isRTL ? 'mr-0 ml-auto' : ''}`}
      >
        <div className="mb-8">
          <p className="text-gray-500 leading-relaxed">
            {t('admin.db_desc')}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('admin.db_host')}</label>
              <input
                type="text"
                required
                placeholder="localhost"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={config.host}
                onChange={e => setConfig({ ...config, host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('admin.db_name')}</label>
              <input
                type="text"
                required
                placeholder="bites_db"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={config.database}
                onChange={e => setConfig({ ...config, database: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('admin.db_user')}</label>
              <input
                type="text"
                required
                placeholder="root"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                value={config.user}
                onChange={e => setConfig({ ...config, user: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">{t('admin.db_pass')}</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
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
              } ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-all disabled:bg-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {t('admin.db_connecting')}
              </>
            ) : (
              <>
                <Save size={20} />
                {t('admin.db_save_test')}
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminDatabase;
