import { useState, useEffect, useCallback } from 'react';
import { Truck, Package, Phone, MessageCircle, Loader2, CheckCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { fetchOrders, fetchOrdersForTransport, assignTransporter, updateDeliveryStatus } from '../../lib/api';

export default function TransporterDashboard() {
  const { user } = useAuth();
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [forTransport, allOrders] = await Promise.all([
        fetchOrdersForTransport(),
        fetchOrders(),
      ]);
      setAvailableJobs(forTransport || []);
      const mine = (allOrders || []).filter(
        (o: any) => (o.TransporterId || o.transporterId) === user.id
      );
      setMyJobs(mine);
    } catch (err) {
      console.error('Load transport data failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAcceptJob = async (order: any) => {
    const orderId = order.id || order.Id;
    if (!orderId || !user) return;
    setActioning(orderId);
    try {
      await assignTransporter(orderId, user.id, user.username || 'Transporter');
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to accept job');
    } finally {
      setActioning(null);
    }
  };

  const handleDeliveryStatus = async (orderId: string, status: 'picked_up' | 'in_transit' | 'delivered') => {
    if (!orderId) return;
    setActioning(orderId);
    try {
      await updateDeliveryStatus(orderId, status);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    } finally {
      setActioning(null);
    }
  };

  const formatOrder = (o: any) => ({
    id: o.id || o.Id,
    crop: o.CropName || o.crop || 'Crop',
    quantity: `${o.Quantity || 0} ${o.Unit || 'kg'}`,
    amount: o.Amount || 0,
    farmer: o.SellerName || o.Seller || 'Farmer',
    farmerPhone: o.SellerPhone || o.FarmerPhone || '',
    buyer: o.BuyerName || 'Buyer',
    buyerPhone: o.BuyerPhone || '',
    deliveryStatus: o.DeliveryStatus || o.deliveryStatus || 'assigned',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Kisan Mitra" showNotifications isOffline={false} />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 mb-6 text-white">
          <h2 className="text-2xl mb-1">Welcome, {user?.username || 'Transporter'}! 🚚</h2>
          <p className="text-amber-100">Pick up and deliver crops from farm to buyer</p>
          {user?.location && <p className="text-amber-200 text-sm mt-1">📍 {user.location}</p>}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
            <p className="text-gray-500">Loading jobs...</p>
          </div>
        ) : (
          <>
            {/* Available jobs */}
            <section className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                Available to transport
              </h3>
              {availableJobs.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-100">
                  No orders waiting for transport. Check back later.
                </div>
              ) : (
                <div className="space-y-4">
                  {availableJobs.map((order) => {
                    const item = formatOrder(order);
                    return (
                      <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="font-medium text-gray-900">{item.crop}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.quantity} · ₹{item.amount}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          From {item.farmer} → To {item.buyer}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => handleAcceptJob(order)}
                            disabled={actioning === item.id}
                            className="flex-1 min-w-[120px] bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Accept job
                          </button>
                          {item.farmerPhone && (
                            <>
                              <a href={`tel:${item.farmerPhone}`} className="p-2 rounded-lg bg-gray-100 text-gray-700" title="Call farmer">
                                <Phone className="w-4 h-4" />
                              </a>
                              <a
                                href={`https://wa.me/${String(item.farmerPhone).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-green-100 text-green-700"
                                title="WhatsApp farmer"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* My jobs */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                My delivery jobs
              </h3>
              {myJobs.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-100">
                  You haven’t accepted any jobs yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {myJobs.map((order) => {
                    const item = formatOrder(order);
                    const status = item.deliveryStatus;
                    return (
                      <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="font-medium text-gray-900">{item.crop}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.quantity} · ₹{item.amount}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          From {item.farmer} → To {item.buyer}
                        </div>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            status === 'delivered' ? 'bg-green-100 text-green-700' :
                            status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                            status === 'picked_up' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {status === 'delivered' ? 'Delivered' : status === 'in_transit' ? 'In transit' : status === 'picked_up' ? 'Picked up' : 'Assigned'}
                          </span>
                        </div>
                        {status !== 'delivered' && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {status === 'assigned' && (
                              <button
                                type="button"
                                onClick={() => handleDeliveryStatus(item.id, 'picked_up')}
                                disabled={actioning === item.id}
                                className="bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                              >
                                {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Picked up'}
                              </button>
                            )}
                            {status === 'picked_up' && (
                              <button
                                type="button"
                                onClick={() => handleDeliveryStatus(item.id, 'in_transit')}
                                disabled={actioning === item.id}
                                className="bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                              >
                                {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'In transit'}
                              </button>
                            )}
                            {(status === 'assigned' || status === 'picked_up' || status === 'in_transit') && (
                              <button
                                type="button"
                                onClick={() => handleDeliveryStatus(item.id, 'delivered')}
                                disabled={actioning === item.id}
                                className="bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {actioning === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Mark delivered
                              </button>
                            )}
                            {item.buyerPhone && (
                              <>
                                <a href={`tel:${item.buyerPhone}`} className="p-2 rounded-lg bg-gray-100 text-gray-700" title="Call buyer">
                                  <Phone className="w-4 h-4" />
                                </a>
                                <a
                                  href={`https://wa.me/${String(item.buyerPhone).replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg bg-green-100 text-green-700"
                                  title="WhatsApp buyer"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <BottomNav userType="transporter" />
    </div>
  );
}
