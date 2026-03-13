import { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, ShoppingBag, TrendingUp, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { DashboardCard } from '../components/DashboardCard';
import { fetchOrders } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeOrders: 0, spendingThisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const orders = await fetchOrders();
        const mine = (orders || []).filter((o: any) => o.BuyerName === user?.username);
        setStats({
          activeOrders: mine.filter((o: any) => o.Status !== 'completed' && o.Status !== 'cancelled').length,
          spendingThisMonth: mine.reduce((acc: number, o: any) => acc + (parseInt(o.Amount) || 0), 0),
        });
      } catch (err) {
        console.error('Load failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user) load();
    else setIsLoading(false);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Kisan Mitra" showNotifications isOffline={false} />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl mb-1">Welcome, {user?.username || 'Retailer'}! 🛒</h2>
          <p className="text-blue-100">{user?.businessName || 'Find fresh crops nearby'}</p>
          {user?.location && <p className="text-blue-200 text-sm mt-1">📍 {user.location}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-600 text-sm mb-1">Active Orders</div>
            <div className="text-2xl text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.activeOrders}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-600 text-sm mb-1">This Month</div>
            <div className="text-2xl text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `₹${stats.spendingThisMonth}`}
            </div>
          </div>
        </div>

        <h3 className="text-lg text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DashboardCard icon={Search} title="Browse Crops" subtitle="All products" onClick={() => navigate('/marketplace')} color="green" />
          <DashboardCard icon={MapPin} title="Search Area" subtitle="Find nearby" onClick={() => navigate('/area-search')} color="blue" />
          <DashboardCard icon={Calendar} title="Deliveries" subtitle="By date" onClick={() => navigate('/delivery')} color="purple" />
          <DashboardCard icon={ShoppingBag} title="My Orders" subtitle="Track all" onClick={() => navigate('/orders')} color="orange" />
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-800">Delivering Today</h3>
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">0 Farmers</span>
          </div>
          <p className="text-center text-gray-500 py-4">No deliveries scheduled for today</p>
        </div>

        <h3 className="text-lg text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" /> Trending Crops
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {['Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Carrot'].map((crop) => (
            <div key={crop} className="bg-white rounded-xl p-4 text-center shadow-sm">
              <div className="text-3xl mb-2">🌾</div>
              <div className="text-sm text-gray-700">{crop}</div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav userType="retailer" />
    </div>
  );
}
