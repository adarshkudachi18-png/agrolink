import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Package, Truck, DollarSign, Loader2, BarChart3, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../../lib/api';

export default function Analytics() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await fetchOrders();
        const myOrders = (data || []).filter((o: any) => o.SellerName === user.username);
        setOrders(myOrders);
      } catch (err) {
        console.error('Analytics load failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    const completed = orders.filter(o => o.Status === 'completed');
    const earnings = completed.reduce((acc, o) => acc + (parseFloat(o.Amount) || 0), 0);
    const inProgress = orders.filter(o => o.Status === 'in-progress').length;
    
    // Monthly chart data logic
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map((m, i) => {
      const monthOrders = completed.filter(o => {
        const d = new Date(o.CreatedAt);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      });
      return {
        month: m,
        sales: monthOrders.reduce((acc, o) => acc + (parseFloat(o.Amount) || 0), 0)
      };
    });

    // Top crops
    const cropSales: any = {};
    completed.forEach(o => {
      cropSales[o.CropName] = (cropSales[o.CropName] || 0) + (parseFloat(o.Amount) || 0);
    });
    const topCrops = Object.entries(cropSales)
      .map(([name, sales]) => ({ name, sales: sales as number }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 3);

    return {
      earnings,
      completedCount: completed.length,
      upcomingDeliveries: inProgress,
      monthlyData,
      topCrops
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Analytics" showBack />
      <div className="max-w-md mx-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-5 text-white shadow-sm">
            <DollarSign className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `₹${stats.earnings}`}
            </div>
            <div className="text-green-100 text-sm">Total Earnings</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-sm">
            <Package className="w-8 h-8 mb-2 opacity-80" />
            <div className="text-3xl font-bold mb-1">
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats.completedCount}
            </div>
            <div className="text-blue-100 text-sm">Orders Completed</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-200">
            <Truck className="w-8 h-8 mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.upcomingDeliveries}
            </div>
            <div className="text-gray-600 text-sm">Upcoming Deliveries</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-orange-200">
            <TrendingUp className="w-8 h-8 mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.completedCount > 0 ? '+12%' : '0%'}
            </div>
            <div className="text-gray-600 text-sm">Growth This Month</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="text-lg text-gray-800 mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="w-5 h-5 text-green-600" /> Monthly Sales Trend
          </h3>
          <div className="h-64 mt-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
            ) : stats.completedCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-12 h-12 mb-2" />
                <p>No sales data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#F3F4F6'}} />
                  <Bar dataKey="sales" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          <h3 className="text-lg text-gray-800 mb-4 font-semibold">Top Selling Crops</h3>
          {stats.topCrops.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Start selling to see your top crops</p>
          ) : (
            <div className="space-y-4">
              {stats.topCrops.map((crop, i) => (
                <div key={crop.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                    {i+1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{crop.name}</div>
                    <div className="text-xs text-gray-500">Highest selling</div>
                  </div>
                  <div className="font-bold text-gray-900">₹{crop.sales}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5">
          <h4 className="text-amber-900 mb-2 flex items-center gap-2 font-semibold">💡 Insights</h4>
          <ul className="text-amber-800 text-sm space-y-2">
            <li>• No sales data available yet</li>
            <li>• Start listing products to see insights</li>
            <li>• Complete orders to track your growth</li>
          </ul>
        </div>
      </div>
      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
