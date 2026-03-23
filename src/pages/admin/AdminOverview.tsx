import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { ShoppingBag, TrendingUp, Users, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, Package, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
}

const AdminOverview: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          api.getOrders(),
          api.getProducts()
        ]);
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const stats = {
    totalOrders: safeOrders.length,
    totalRevenue: safeOrders.filter(o => o.status === 'completed').reduce((acc, o) => acc + o.total, 0),
    pendingOrders: safeOrders.filter(o => o.status === 'pending').length,
    completedOrders: safeOrders.filter(o => o.status === 'completed').length,
    cancelledOrders: safeOrders.filter(o => o.status === 'cancelled').length,
  };

  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = safeOrders.filter(o => o.createdAt.startsWith(date) && o.status === 'completed');
      return {
        name: new Date(date).toLocaleDateString('ar-EG', { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
        orders: dayOrders.length
      };
    });
  }, [safeOrders]);

  const topProducts = useMemo(() => {
    const productSales: Record<string, number> = {};
    safeOrders.filter(o => o.status === 'completed').forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
      }
    });
    return Object.entries(productSales)
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [safeOrders]);

  const categoryData = useMemo(() => {
    const catCounts: Record<string, number> = {};
    safeProducts.forEach(p => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });
    return Object.entries(catCounts).map(([name, value]) => ({ name, value }));
  }, [safeProducts]);

  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

  const statCards = [
    { label: 'إجمالي الطلبات', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-blue-500' },
    { label: 'إجمالي المبيعات', value: `${stats.totalRevenue} ج.م`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'طلبات قيد الانتظار', value: stats.pendingOrders, icon: Clock, color: 'bg-orange-500' },
    { label: 'طلبات مكتملة', value: stats.completedOrders, icon: CheckCircle, color: 'bg-emerald-500' },
  ];

  if (loading) return <div className="flex items-center justify-center h-64">جاري التحميل...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">نظرة عامة</h2>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
          آخر تحديث: {new Date().toLocaleTimeString('ar-EG')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4"
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

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">إحصائيات المبيعات</h3>
              <p className="text-sm text-gray-500">آخر 7 أيام</p>
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
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">الأكثر مبيعاً</h3>
              <p className="text-sm text-gray-500">أفضل 5 منتجات</p>
            </div>
            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
              <BarChartIcon size={24} />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#ea580c" radius={[0, 8, 8, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">توزيع الأصناف</h3>
              <p className="text-sm text-gray-500">عدد المنتجات لكل صنف</p>
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold mb-6">توزيع الحالات</h3>
          <div className="space-y-6">
            {[
              { label: 'مكتملة', count: stats.completedOrders, total: stats.totalOrders, color: 'bg-green-500' },
              { label: 'قيد الانتظار', count: stats.pendingOrders, total: stats.totalOrders, color: 'bg-orange-500' },
              { label: 'ملغاة', count: stats.cancelledOrders, total: stats.totalOrders, color: 'bg-red-500' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="text-gray-500">{item.count} من {item.total}</span>
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
    </div>
  );
};

export default AdminOverview;
