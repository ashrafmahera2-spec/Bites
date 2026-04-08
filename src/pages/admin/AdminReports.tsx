import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const AdminReports: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching orders for reports:", error);
        toast.error(t('admin.reports_fetch_error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    return orderDate >= dateRange.start && orderDate <= dateRange.end;
  });

  // Calculate Stats
  const totalSales = filteredOrders.reduce((sum, order) => sum + (order.status === 'completed' ? order.total : 0), 0);
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

  // Daily Sales Data
  const dailyData = filteredOrders.reduce((acc: any, order) => {
    const date = new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { date, sales: 0, orders: 0 };
    if (order.status === 'completed') acc[date].sales += order.total;
    acc[date].orders += 1;
    return acc;
  }, {});
  const dailyChartData = Object.values(dailyData);

  // Category/Product Performance
  const productData = filteredOrders.reduce((acc: any, order) => {
    if (order.status !== 'completed') return acc;
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    items.forEach((item: any) => {
      if (!acc[item.name]) acc[item.name] = { name: item.name, value: 0, quantity: 0 };
      acc[item.name].value += item.price * item.quantity;
      acc[item.name].quantity += item.quantity;
    });
    return acc;
  }, {});
  const topProductsData = Object.values(productData)
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  // Order Status Data
  const statusData = filteredOrders.reduce((acc: any, order) => {
    const status = order.status;
    if (!acc[status]) acc[status] = { name: t(`admin.status_${status}`), value: 0 };
    acc[status].value += 1;
    return acc;
  }, {});
  const statusChartData = Object.values(statusData);

  if (loading) return <div className="flex items-center justify-center h-64">{t('common.loading')}</div>;

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.reports_title')}</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
            <Calendar size={18} className="text-gray-400" />
            <input 
              type="date" 
              className="text-sm outline-none bg-transparent"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            />
            <span className="text-gray-300">-</span>
            <input 
              type="date" 
              className="text-sm outline-none bg-transparent"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            />
          </div>
          <button className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all">
            <Download size={18} />
            {t('admin.reports_export')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('admin.reports_total_sales'), value: `${totalSales.toLocaleString()} ${t('common.currency')}`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: t('admin.reports_total_orders'), value: totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: t('admin.reports_completed_orders'), value: completedOrders, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: t('admin.reports_avg_order'), value: `${Math.round(averageOrderValue).toLocaleString()} ${t('common.currency')}`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Trend */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">{t('admin.reports_sales_trend')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">{t('admin.reports_top_products')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563' }} width={100} />
                <Tooltip 
                  cursor={{ fill: '#f97316', opacity: 0.05 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#f97316" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">{t('admin.reports_status_dist')}</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Count Trend */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">{t('admin.reports_orders_trend')}</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
