import { useState, useEffect } from 'react';
import { Calendar, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../../lib/api';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeliveries = async () => {
      try {
        const data = await fetchOrders();
        const activeOrders = (data || []).filter((o: any) => {
          const isMine =
            (user?.role === 'farmer' ? o.SellerName === user?.username : o.BuyerName === user?.username);

          const deliveryStatus = (o.DeliveryStatus || o.deliveryStatus || '').toLowerCase();
          const status = (o.Status || o.status || '').toLowerCase();

          // Hide only fully cancelled or fully delivered orders
          const isFinished =
            status === 'cancelled' ||
            deliveryStatus === 'delivered';

          return isMine && !isFinished;
        });

        // Group by DeliveryDate
        const grouped = activeOrders.reduce((acc: any, order: any) => {
          const date = order.DeliveryDate || 'TBD';
          if (!acc[date]) acc[date] = [];
          acc[date].push({
            id: order.Id || order.id || Math.random().toString(),
            crop: order.CropName || order.crop,
            farmer: order.SellerName || order.Seller || 'Local Farmer',
            farmerPhone: order.SellerPhone || order.FarmerPhone || '',
            buyer: order.BuyerName || 'Unknown Buyer',
            buyerPhone: order.BuyerPhone || '',
            quantity: `${order.Quantity || '0'} ${order.Unit || 'kg'}`,
            status: (order.Status || order.status || '').toLowerCase(),
            deliveryStatus: (order.DeliveryStatus || order.deliveryStatus || '').toLowerCase(),
            time: '09:00 AM - 05:00 PM' // Placeholder
          });
          return acc;
        }, {});

        // Format into displayable array
        const formatted = Object.keys(grouped).map(dateStr => {
           const d = new Date(dateStr);
           const dayText = isNaN(d.getTime()) ? 'Soon' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
           
           return {
             id: dateStr,
             day: dayText,
             date: dateStr,
             items: grouped[dateStr]
           };
        });

        // Simple sorting
        formatted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDeliveries(formatted);
      } catch (err) {
        console.error('Failed to load deliveries', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) loadDeliveries();
  }, [user]);

  const handleCall = (item: any) => {
    const targetPhone = user?.role === 'farmer' ? item.buyerPhone : item.farmerPhone;
    if (!targetPhone) {
      alert('Contact number not available for this delivery.');
      return;
    }
    window.location.href = `tel:${targetPhone}`;
  };

  const handleWhatsApp = (item: any) => {
    const targetPhone = user?.role === 'farmer' ? item.buyerPhone : item.farmerPhone;
    if (!targetPhone) {
      alert('WhatsApp number not available for this delivery.');
      return;
    }
    const normalized = String(targetPhone).replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hi, regarding delivery of "${item.crop}" (${item.quantity}) scheduled on ${item.date || ''}.`
    );
    const url = `https://wa.me/${normalized}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Delivery Schedule" showBack />
      
      <div className="max-w-md mx-auto p-4">
        {/* Calendar Icon */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <div>
            <div className="text-gray-900">Upcoming Deliveries</div>
            <div className="text-sm text-gray-600">Track all scheduled deliveries</div>
          </div>
        </div>

        {/* Deliveries List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
            <p className="text-gray-500">Loading delivery schedule...</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="mt-8 text-center text-gray-500">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg mb-1">No deliveries scheduled</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery) => (
              <div key={delivery.id}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-full text-sm">
                    {delivery.day}
                  </div>
                  <div className="text-gray-600">{delivery.date}</div>
                </div>

                {/* Delivery Items */}
                <div className="space-y-3">
                  {delivery.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-lg text-gray-900 mb-1">{item.crop}</h4>
                          {user?.role === 'farmer' ? (
                            <p className="text-sm text-gray-600">Buyer: {item.buyer}</p>
                          ) : (
                            <p className="text-sm text-gray-600">Farmer: {item.farmer}</p>
                          )}
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">Status</div>
                          <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            {item.deliveryStatus === 'delivered'
                              ? 'Delivered'
                              : item.deliveryStatus === 'in_transit'
                              ? 'In transit'
                              : item.deliveryStatus === 'picked_up'
                              ? 'Picked up'
                              : item.status === 'completed'
                              ? 'Scheduled'
                              : 'Pending'}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Window</div>
                          <div className="text-green-600 text-sm">{item.time}</div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleCall({ ...item, date: delivery.date })}
                          className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center justify-center gap-1"
                        >
                          <Phone className="w-4 h-4" />
                          Call {user?.role === 'farmer' ? 'Buyer' : 'Farmer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWhatsApp({ ...item, date: delivery.date })}
                          className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Chat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="mt-8 text-center text-gray-500">
              <p className="text-sm">No more deliveries scheduled</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
