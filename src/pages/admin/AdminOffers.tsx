import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, X, Search, Tag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';
import ConfirmModal from '../../components/ConfirmModal';

interface Offer {
  id: string | number;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

const AdminOffers: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('admin.product_image_large'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchData = async () => {
    try {
      const data = await api.getOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOffer) {
        await api.updateOffer(editingOffer.id, formData);
        toast.success(t('admin.offers_updated'));
      } else {
        await api.addOffer(formData);
        toast.success(t('admin.offers_added'));
      }
      setIsModalOpen(false);
      setEditingOffer(null);
      setFormData({ title: '', description: '', imageUrl: '', isActive: true });
      fetchData();
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;
    try {
      await api.deleteOffer(offerToDelete);
      toast.success(t('admin.offers_deleted'));
      fetchData();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error(t('common.error'));
    } finally {
      setOfferToDelete(null);
    }
  };

  const toggleStatus = async (offer: Offer) => {
    try {
      await api.updateOffer(offer.id, {
        ...offer,
        isActive: !offer.isActive
      });
      toast.success(offer.isActive ? t('admin.offers_disabled') : t('admin.offers_enabled'));
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(t('common.error'));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">{t('common.loading')}</div>;

  return (
    <div className="space-y-6">
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setOfferToDelete(null); }}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('admin.offers_delete_confirm')}
        type="danger"
      />
      <div className={`flex flex-wrap items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className={`text-2xl font-bold text-gray-900 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Tag className="text-orange-600" />
          {t('admin.offers_title')}
        </h2>
        <button
          onClick={() => { setEditingOffer(null); setFormData({ title: '', description: '', imageUrl: '', isActive: true }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <Plus size={20} />
          {t('admin.offers_add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-500 font-medium">{t('admin.offers_no_data')}</p>
          </div>
        ) : (
          offers.map(offer => (
            <div key={offer.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                <img src={offer.imageUrl || 'https://picsum.photos/seed/offer/400/300'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {!offer.isActive && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold">{t('admin.offers_inactive')}</span>
                  </div>
                )}
              </div>
              <h3 className={`font-bold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{offer.title}</h3>
              <p className={`text-sm text-gray-500 mb-4 line-clamp-2 ${isRTL ? 'text-right' : 'text-left'}`}>{offer.description}</p>
              <div className={`flex items-center justify-between pt-4 border-t border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => { setEditingOffer(offer); setFormData(offer); setIsModalOpen(true); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => { setOfferToDelete(offer.id); setIsConfirmOpen(true); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <button
                  onClick={() => toggleStatus(offer)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                    offer.isActive 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {offer.isActive ? t('admin.offers_active') : t('admin.offers_activate')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className={`p-6 border-b border-gray-100 flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-xl font-bold">{editingOffer ? t('admin.offers_edit_title') : t('admin.offers_add_title')}</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className={`p-6 space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.offers_label_title')}</label>
                  <input
                    required
                    type="text"
                    placeholder={t('admin.offers_placeholder_title')}
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.offers_label_desc')}</label>
                  <textarea
                    required
                    placeholder={t('admin.offers_placeholder_desc')}
                    className={`w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none min-h-[100px] ${isRTL ? 'text-right' : 'text-left'}`}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{t('admin.offers_label_image')}</label>
                  <div className="flex flex-col gap-3">
                    {formData.imageUrl && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-red-500 text-white p-1 rounded-full shadow-lg`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <div className={`flex flex-col sm:flex-row gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="offer-image-upload"
                      />
                      <label
                        htmlFor="offer-image-upload"
                        className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-600 hover:bg-orange-50 cursor-pointer transition-all text-gray-500 font-bold"
                      >
                        <ImageIcon size={20} />
                        {t('admin.offers_upload_local')}
                      </label>
                      <input
                        type="url"
                        placeholder={t('admin.offers_placeholder_url')}
                        className={`flex-1 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-600 outline-none ${isRTL ? 'text-right' : 'text-left'}`}
                        value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                        onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 accent-orange-600"
                  />
                  <label htmlFor="isActive" className="font-bold text-gray-700">{t('admin.offers_label_active')}</label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
                >
                  {editingOffer ? t('admin.offers_save') : t('admin.offers_add')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOffers;
