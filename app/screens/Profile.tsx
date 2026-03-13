import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Edit, Settings, HelpCircle, LogOut, BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { fetchOrders } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchOrders().then((orders) => {
      const mine = orders.filter((o: any) =>
        o.BuyerName === user.username || o.FarmerName === user.username
      );
      setOrderCount(mine.length);
    }).catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/landing');
  };

  const isFarmer = user?.role === 'farmer';
  const isTransporter = user?.role === 'transporter';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '—';

  const memberDays = user?.createdAt
    ? Math.ceil(Math.abs(new Date().getTime() - new Date(user.createdAt).getTime()) / 86400000)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Profile" showBack />
      <div className="max-w-md mx-auto p-4">

        {/* Profile Card */}
        <div className={`bg-gradient-to-br ${isFarmer ? 'from-green-600 to-green-700' : isTransporter ? 'from-amber-600 to-amber-700' : 'from-blue-600 to-blue-700'} rounded-3xl p-6 mb-6 text-white shadow-lg`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow">
              {isFarmer ? '👨‍🌾' : isTransporter ? '🚚' : '🛒'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-0.5">{user?.username || '—'}</h2>
              <p className="text-sm capitalize font-medium opacity-80">
                {isFarmer ? '🌾 Farmer' : isTransporter ? '🚚 Transporter' : '🛒 Retailer'}
              </p>
              {isFarmer && user?.farmName && <p className="text-xs opacity-60 mt-0.5">{user.farmName}</p>}
              {isTransporter && user?.location && <p className="text-xs opacity-60 mt-0.5">{user.location}</p>}
              {!isFarmer && !isTransporter && user?.businessName && <p className="text-xs opacity-60 mt-0.5">{user.businessName}</p>}
            </div>
            <button
              onClick={() => navigate('/complete-profile', { state: { userId: user?.id, role: user?.role } })}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-white/20 text-sm opacity-90">
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" />{user?.phone || '—'}</div>
            <div className="flex items-center gap-2"><span>✉️</span>{user?.email || '—'}</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {user?.location ? `${user.location}${user.pincode ? ` - ${user.pincode}` : ''}` : 'Location not set'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">{orderCount}</div>
            <div className="text-xs text-gray-500">Orders</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">⭐</div>
            <div className="text-xs text-gray-500">New</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-gray-900 mb-1">{memberDays}</div>
            <div className="text-xs text-gray-500">Days</div>
          </div>
        </div>

        {/* Farmer / Retailer extra info */}
        {isFarmer && user?.farmSizeAcres && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🌾</span>
            <div>
              <div className="text-sm font-semibold text-green-800">Farm Size</div>
              <div className="text-green-700">{user.farmSizeAcres} Acres</div>
            </div>
          </div>
        )}
        {!isFarmer && !isTransporter && user?.gstNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🏢</span>
            <div>
              <div className="text-sm font-semibold text-blue-800">GST</div>
              <div className="text-blue-700 text-sm">{user.gstNumber}</div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="space-y-2 mb-6">
          <button
            onClick={() => navigate('/complete-profile', { state: { userId: user?.id, role: user?.role } })}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Edit Profile</div>
              <div className="text-sm text-gray-500">Update your information</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Settings</div>
              <div className="text-sm text-gray-500">App preferences</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/help')}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:bg-gray-50"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Help & Support</div>
              <div className="text-sm text-gray-500">Get assistance</div>
            </div>
          </button>
        </div>

        {/* Account info */}
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-green-600" /> Account Information
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since</span>
              <span className="font-medium text-gray-800">{memberSince}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Verified</span>
              <span className="text-green-600 font-medium">✓ Verified</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Type</span>
              <span className="font-medium text-gray-800 capitalize">{user?.role || '—'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 py-4 rounded-xl flex items-center justify-center gap-2 border-2 border-red-200 active:bg-red-100 font-semibold"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>

        <div className="text-center text-gray-400 text-sm mt-6">Kisan Mitra v1.0.0</div>
      </div>
      <BottomNav userType={isTransporter ? 'transporter' : isFarmer ? 'farmer' : 'retailer'} />
    </div>
  );
}
