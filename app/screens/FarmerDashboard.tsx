import { useState, useEffect } from 'react';
import { Plus, Video, Package, Truck, Wallet, BarChart3, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { DashboardCard } from '../components/DashboardCard';
import { fetchProducts, fetchOrders } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeListings: 0, pendingOrders: 0, walletBalance: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [products, orders] = await Promise.all([fetchProducts(), fetchOrders()]);
        
        // Filter products and orders for THIS farmer
        const myProducts = (products || []).filter((p: any) => p.FarmerName === user.username);
        const myOrders = (orders || []).filter((o: any) => o.SellerName === user.username);
        
        // Calculate earnings from completed orders
        const earnings = myOrders
          .filter((o: any) => o.Status === 'completed')
          .reduce((acc: number, o: any) => acc + (parseFloat(o.Amount) || 0), 0);

        setStats({
          activeListings: myProducts.length,
          pendingOrders: myOrders.filter((o: any) => o.Status === 'pending').length,
          walletBalance: earnings
        });

        // Filter activity for this farmer
        setRecentActivity(myOrders.slice(0, 5).map((o: any) => ({
          title: o.Status === 'pending' ? 'New Order Received' : 'Order Updated',
          message: `${o.Quantity}${o.Unit || 'kg'} ${o.CropName} • ₹${o.Amount}`,
          time: new Date(o.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Kisan Mitra" showNotifications isOffline={false} />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl mb-1">Welcome, {user?.username || 'Farmer'}! 👨‍🌾</h2>
          <p className="text-green-100">{user?.farmName || 'Manage your farm business'}</p>
          {user?.location && <p className="text-green-200 text-sm mt-1">📍 {user.location}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-600 text-sm mb-1">Active Listings</div>
            <div className="text-2xl text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : stats.activeListings}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-600 text-sm mb-1">Pending Orders</div>
            <div className="text-2xl text-gray-900">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : stats.pendingOrders}
            </div>
          </div>
        </div>

        <h3 className="text-lg text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <DashboardCard icon={Plus} title="Add Product" subtitle="List new crop" onClick={() => navigate('/add-product')} color="green" />
          <DashboardCard icon={Package} title="My Listings" subtitle="Edit / Delete" onClick={() => navigate('/my-listings')} color="orange" />
          <DashboardCard icon={Video} title="Upload Video" subtitle="Show quality" onClick={() => navigate('/upload-video')} color="blue" />
          <DashboardCard icon={Package} title="My Orders" subtitle="View all" onClick={() => navigate('/orders')} color="orange" />
          <DashboardCard icon={Truck} title="Deliveries" subtitle="Schedule" onClick={() => navigate('/delivery')} color="purple" />
          <DashboardCard icon={Wallet} title="Wallet" subtitle={`₹${stats.walletBalance}`} onClick={() => navigate('/wallet')} color="amber" />
          <DashboardCard icon={BarChart3} title="Analytics" subtitle="Track sales" onClick={() => navigate('/analytics')} color="green" />
        </div>

        <h3 className="text-lg text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
          ) : recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          ) : (
            recentActivity.map((a, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-gray-900">{a.title}</div>
                  <div className="text-sm text-gray-600">{a.message}</div>
                </div>
                <div className="text-xs text-gray-500">{a.time}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav userType="farmer" />
    </div>
  );
}
