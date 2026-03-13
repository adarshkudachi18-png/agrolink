import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { fetchOrders, updateOrderStatus, updateDeliveryStatus } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  'in-progress': { icon: Package, label: 'In Progress', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  completed: { icon: CheckCircle, label: 'Accepted', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
  delivered: { icon: CheckCircle, label: 'Delivered', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  cancelled: { icon: XCircle, label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchOrders()
      .then((data) => {
        // Filter orders for the current user
        const myOrders = (data || []).filter((o: any) => 
          user?.role === 'farmer' ? o.SellerName === user?.username : o.BuyerName === user?.username
        );
        setOrders(myOrders);
      })
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleStatusChange = async (orderId: string, status: 'completed' | 'cancelled') => {
    try {
      setIsLoading(true);
      await updateOrderStatus(orderId, status);
      const data = await fetchOrders();
      const myOrders = (data || []).filter((o: any) =>
        user?.role === 'farmer' ? o.SellerName === user?.username : o.BuyerName === user?.username
      );
      setOrders(myOrders);
    } catch (err) {
      console.error('Failed to update order status', err);
      alert('Could not update order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatted = orders.map((o: any) => ({
    id: o.Id || o.id || 'N/A',
    crop: o.CropName || o.crop || 'Unknown',
    quantity: `${o.Quantity || '0'} ${o.Unit || 'kg'}`,
    amount: `₹${o.Amount || '0'}`,
    buyer: o.BuyerName || 'Unknown',
    seller: o.SellerName || o.Seller || 'Unknown Farmer',
    status: (o.Status || 'pending').toLowerCase(),
    deliveryDate: o.DeliveryDate || 'TBD',
    deliveryStatus: (o.DeliveryStatus || '').toLowerCase() as 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | '',
  }));

  const filteredOrders = formatted.filter((o) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Pending') return o.status === 'pending';
    if (activeFilter === 'In Progress') return o.status === 'in-progress';
    if (activeFilter === 'Completed') return o.status === 'completed' || o.status === 'delivered';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Orders" showBack />
      <div className="max-w-md mx-auto p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${f === activeFilter ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border-2 border-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
              <p className="text-gray-500">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p>No orders found.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isFarmer = user?.role === 'farmer';
              const isDelivered = order.deliveryStatus === 'delivered';
              const canConsumerMarkDelivered =
                !isFarmer &&
                !isDelivered &&
                (order.deliveryStatus === 'in_transit' || order.deliveryStatus === 'picked_up');
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Order #{order.id.slice(0, 8)}</div>
                      <h3 className="text-xl text-gray-900">{order.crop}</h3>
                    </div>
                    <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-sm border-2 ${status.bgColor} ${status.textColor} ${status.borderColor}`}>
                      <StatusIcon className="w-4 h-4" />
                      {status.label}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4 text-sm">
                    {isFarmer ? (
                      <div className="flex justify-between"><span className="text-gray-600">Buyer:</span><span>{order.buyer}</span></div>
                    ) : (
                      <div className="flex justify-between"><span className="text-gray-600">Seller:</span><span>{order.seller}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-600">Quantity:</span><span>{order.quantity}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Amount:</span><span className="text-green-600">{order.amount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Delivery:</span><span>{order.deliveryDate}</span></div>
                  </div>
                  {order.status === 'pending' && isFarmer && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {/* Consumer: mark as delivered when in transit / picked up */}
                  {canConsumerMarkDelivered && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            await updateDeliveryStatus(order.id, 'delivered');
                            const data = await fetchOrders();
                            const myOrders = (data || []).filter((o: any) =>
                              user?.role === 'farmer'
                                ? o.SellerName === user?.username
                                : o.BuyerName === user?.username
                            );
                            setOrders(myOrders);
                          } catch (err) {
                            console.error('Failed to mark delivered', err);
                            alert('Could not mark as delivered. Please try again.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="w-full py-3 bg-green-600 text-white rounded-xl text-sm flex items-center justify-center gap-2"
                      >
                        Mark as delivered
                      </button>
                    </div>
                  )}
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
