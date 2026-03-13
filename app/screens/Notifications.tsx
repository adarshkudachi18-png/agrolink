import { useState, useEffect } from 'react';
import { Package, DollarSign, Truck, Bell, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { fetchNotifications } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const typeConfig: any = {
  order: { icon: Package, color: 'bg-blue-100 text-blue-600' },
  payment: { icon: DollarSign, color: 'bg-green-100 text-green-600' },
  delivery: { icon: Truck, color: 'bg-orange-100 text-orange-600' },
  logistics: { icon: Truck, color: 'bg-purple-100 text-purple-600' },
};

function formatTime(timeStr: string) {
  try {
    const diff = Math.floor((Date.now() - new Date(timeStr).getTime()) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  } catch { return timeStr; }
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications()
      .then((data) => setNotifications(data))
      .catch((err) => console.error('Load failed', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Notifications" showBack />
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl text-gray-800">Recent Updates</h2>
          <button className="text-green-600 text-sm">Mark all as read</button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet</p>
            </div>
          ) : (
            [...notifications]
              .sort((a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime())
              .map((n) => {
                const type = (n.Type || 'order').toLowerCase();
                const config = typeConfig[type] || typeConfig.order;
                const Icon = config.icon;
                return (
                  <div
                    key={n.Id || n.id}
                    className={`rounded-2xl p-4 shadow-sm border-2 ${n.Read ? 'bg-white border-gray-100' : 'bg-green-50 border-green-200'}`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-gray-900 font-medium">{n.Title}</h4>
                          {!n.Read && <div className="w-2 h-2 bg-green-600 rounded-full flex-shrink-0 mt-1" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{n.Message}</p>
                        <p className="text-xs text-gray-500">{formatTime(n.Time)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
