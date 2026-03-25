import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { ShoppingBag, TrendingUp, Users, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Package, PieChart as PieChartIcon, BarChart as BarChartIcon, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  customerName: string;
  type: 'delivery' | 'pickup';
  items: { name: string; quantity: number; price: number }[];
}

const AdminOverview: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [dbStatus, setDbStatus] = useState<'connected' | 'local-json'>('connected');
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, productsData, categoriesData, healthData] = await Promise.all([
          api.getOrders(),
          api.getProducts(),
          api.getCategories(),
          api.getHealth()
        ]);
        
        if (prevOrderCount > 0 && ordersData.length > prevOrderCount) {
          toast.success(t('cart.success_title'), {
            description: t('cart.success_subtitle'),
            action: {
              label: t('admin.nav_orders'),
              onClick: () => window.location.href = '/admin/orders'
            }
          });
          const audio = new Audio(NEW_ORDER_SOUND);
          audio.play().catch(e => console.log('Audio play blocked:', e));
        }

        setOrders(ordersData);
        setProducts(productsData);
        setCategories(categoriesData);
        setDbStatus(healthData.dbStatus);
        setPrevOrderCount(ordersData.length);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching overview data:", err);
        setError(err.message || "Failed to fetch overview data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [prevOrderCount, t]);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const stats = {
    totalOrders: safeOrders.length,
    totalRevenue: safeOrders.filter(o => o && o.status === 'completed').reduce((acc, o) => acc + (Number(o.total) || 0), 0),
    pendingOrders: safeOrders.filter(o => o && o.status === 'pending').length,
    completedOrders: safeOrders.filter(o => o && o.status === 'completed').length,
    cancelledOrders: safeOrders.filter(o => o && o.status === 'cancelled').length,
  };

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = safeOrders.filter(o => o && o.createdAt && o.createdAt.startsWith(date) && o.status === 'completed');
      return {
        name: new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0),
        orders: dayOrders.length
      };
    });
  }, [safeOrders, language]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    safeOrders.filter(o => o && o.status === 'completed').forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.name) {
            productSales[item.name] = (productSales[item.name] || 0) + (Number(item.quantity) || 0);
          }
        });
      }
    });
    return Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [safeOrders]);

  const categoryRevenueData = useMemo(() => {
    const catRevenue: Record<string, number> = {};
    safeOrders.filter(o => o && o.status === 'completed').forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item && item.name) {
            const product = safeProducts.find(p => p.name === item.name);
            const catId = product?.categoryId || t('categories.all');
            const category = safeCategories.find(c => c.id === catId);
            const catName = category ? category.name : catId;
            catRevenue[catName] = (catRevenue[catName] || 0) + (Number(item.price) * Number(item.quantity) || 0);
          }
        });
      }
    });
    return Object.entries(catRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [safeOrders, safeProducts, safeCategories, t]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    safeProducts.forEach(p => {
      const cat = safeCategories.find(c => c.id === p.categoryId);
      const name = cat ? cat.name : (p.categoryId || t('categories.all'));
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [safeProducts, safeCategories, t]);

  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#fff7ed'];

  const statCards = [
    { label: t('admin.stat_total_orders'), value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: t('admin.stat_total_revenue'), value: `${stats.totalRevenue} ${t('common.currency')}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: t('admin.stat_pending_orders'), value: stats.pendingOrders, icon: Clock, color: 'bg-orange-500' },
    { label: t('admin.stat_completed_orders'), value: stats.completedOrders, icon: CheckCircle, color: 'bg-emerald-500' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;

  return (
    <div className={`space-y-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.overview_title')}</h2>
          <Link 
            to="/" 
            className="text-sm font-bold text-orange-600 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-all"
          >
            {t('admin.view_menu')}
          </Link>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          {t('admin.last_update')}: {new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US')}
        </div>
      </div>

      {dbStatus === 'local-json' && (
        <div className={`bg-orange-50 border border-orange-200 text-orange-700 p-6 rounded-3xl flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="bg-orange-100 p-3 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">{t('admin.db_local_title')}</p>
              <p className="text-sm opacity-90">{t('admin.db_local_subtitle')}</p>
            </div>
          </div>
          <Link to="/admin/database" className="bg-orange-600 text-white px-6 py-2 rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
            {t('admin.db_setup')}
          </Link>
        </div>
      )}

      {error && (
        <div className={`bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <div className="bg-red-100 p-3 rounded-2xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">
                {error === 'DB not connected' 
                  ? t('admin.db_error_title') 
                  : t('admin.db_error_fetch')}
              </p>
              <p className="text-sm opacity-90">
                {error === 'DB not connected' 
                  ? t('admin.db_error_subtitle') 
                  : error}
              </p>
            </div>
          </div>
          {error === 'DB not connected' && (
            <Link to="/admin/database" className="bg-red-600 text-white px-6 py-2 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
              {t('admin.db_settings')}
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
          >
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/products" className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-all group ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
            <Package size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{t('admin.quick_add_product')}</p>
            <p className="text-xs text-gray-500">{t('admin.quick_add_product_subtitle')}</p>
          </div>
        </Link>
        <Link to="/admin/orders" className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-all group ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{t('admin.quick_manage_orders')}</p>
            <p className="text-xs text-gray-500">{t('admin.quick_manage_orders_subtitle')}</p>
          </div>
        </Link>
        <Link to="/admin/settings" className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-all group ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
          <div className="bg-purple-100 p-3 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
            <Settings size={24} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{t('admin.quick_settings')}</p>
            <p className="text-xs text-gray-500">{t('admin.quick_settings_subtitle')}</p>
          </div>
        </Link>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-bold">{t('admin.chart_sales')}</h3>
              <p className="text-sm text-gray-500">{t('admin.chart_last_7_days')}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                  reversed={isRTL}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ea580c" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-bold">{t('admin.chart_top_selling')}</h3>
              <p className="text-sm text-gray-500">{t('admin.chart_top_5')}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <BarChartIcon size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide reversed={isRTL} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  width={100}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: isRTL ? 'right' : 'left' }}
                />
                <Bar dataKey="sales" fill="#ea580c" radius={isRTL ? [8, 0, 0, 8] : [0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-bold">{t('admin.chart_categories')}</h3>
              <p className="text-sm text-gray-500">{t('admin.chart_categories_subtitle')}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <PieChartIcon size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: isRTL ? 'right' : 'left' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-bold">{t('admin.chart_revenue_by_category')}</h3>
              <p className="text-sm text-gray-500">{t('admin.chart_revenue_by_category_subtitle')}</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  reversed={isRTL}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textAlign: isRTL ? 'right' : 'left' }}
                />
                <Bar dataKey="value" fill="#ea580c" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className={`text-xl font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>{t('admin.chart_status_distribution')}</h3>
          <div className="space-y-6">
            {[
              { label: t('admin.status_completed'), count: stats.completedOrders, total: stats.totalOrders, color: 'bg-green-500' },
              { label: t('admin.status_pending'), count: stats.pendingOrders, total: stats.totalOrders, color: 'bg-orange-500' },
              { label: t('admin.status_cancelled'), count: stats.cancelledOrders, total: stats.totalOrders, color: 'bg-red-500' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">{item.count} {t('common.items')} {t('cart.total')} {item.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / (item.total || 1)) * 100}%` }}
                    className={`h-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h3 className="text-xl font-bold">{t('admin.recent_orders')}</h3>
            <p className="text-sm text-gray-500">{t('admin.recent_orders_subtitle')}</p>
          </div>
          <Link 
            to="/admin/orders" 
            className="text-orange-600 text-sm font-bold hover:underline"
          >
            {t('admin.view_all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className={`text-xs text-gray-400 uppercase tracking-wider border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <th className="px-4 py-4 font-bold">{t('admin.order_customer')}</th>
                <th className="px-4 py-4 font-bold">{t('admin.order_type')}</th>
                <th className="px-4 py-4 font-bold">{t('admin.order_total')}</th>
                <th className="px-4 py-4 font-bold">{t('admin.order_status')}</th>
                <th className="px-4 py-4 font-bold">{t('admin.order_date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {safeOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <p className="font-bold text-gray-900">{order.customerName}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600">
                      {order.type === 'delivery' ? t('admin.type_delivery') : t('admin.type_pickup')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-orange-600">{order.total} {t('common.currency')}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                      order.status === 'completed' ? 'bg-green-100 text-green-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {order.status === 'pending' ? t('admin.status_pending') :
                       order.status === 'completed' ? t('admin.status_completed') : t('admin.status_cancelled')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </p>
                  </td>
                </tr>
              ))}
              {safeOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    {t('admin.no_orders')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
