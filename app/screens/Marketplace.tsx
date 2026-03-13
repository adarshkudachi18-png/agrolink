import { useState, useEffect } from 'react';
import { Video, Phone, MessageCircle, MapPin, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { fetchProducts, fetchOrders, placeOrder, createPaymentOrder, verifyPayment } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>({});
  const [soldProductIds, setSoldProductIds] = useState<string[]>([]);
  const [soldCropSellerPairs, setSoldCropSellerPairs] = useState<string[]>([]);
  
  // Extract maxRadius from navigation state (set by AreaSearch)
  const maxRadius = location.state?.radius || null;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [productsData, ordersData] = await Promise.all([
          fetchProducts(),
          fetchOrders(),
        ]);

        setProducts(productsData);

        const soldStatusSet = new Set(['sold', 'sold_out', 'completed', 'closed']);
        const soldIds = new Set<string>();
        const soldPairs = new Set<string>();

        (ordersData || []).forEach((o: any) => {
          const status = (o.Status || o.status || '').toString().toLowerCase();
          if (!soldStatusSet.has(status)) return;

          const pid =
            o.ProductId ||
            o.productId ||
            o.ProductID ||
            o.productID ||
            null;

          if (pid != null) {
            soldIds.add(String(pid));
          }

          const cropName = (o.CropName || o.crop || '').toString().toLowerCase().trim();
          const sellerName = (o.SellerName || o.Seller || '').toString().toLowerCase().trim();
          if (cropName && sellerName) {
            soldPairs.add(`${cropName}::${sellerName}`);
          }
        });

        setSoldProductIds(Array.from(soldIds));
        setSoldCropSellerPairs(Array.from(soldPairs));
      } catch (err) {
        console.error("Error loading products", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handlePlaceOrder = async (product: any) => {
    if (!user) {
      alert('Please login to place an order');
      navigate('/login');
      return;
    }

    const baseUnit = (product.quantity || '').toLowerCase().includes('ton') ? 'ton' : 'kg';
    const minQty = baseUnit === 'kg' ? 30 : 0.03; // 30 kg or 0.03 ton
    const current = selectedQty[product.id] ?? minQty;
    if (current < minQty) {
      alert(`Minimum order is 30 kg.`);
      return;
    }

    const numericPricePerUnit = parseInt(String(product.price).replace(/[^0-9]/g, '')) || 0;
    const totalAmount = numericPricePerUnit * current;

    setIsOrdering(product.id);
    try {
      await placeOrder({
        CropName: product.crop,
        Quantity: String(current),
        Unit: baseUnit,
        Amount: totalAmount.toString(),
        BuyerName: user.username,
        BuyerId: user.id || (user as any).Id,
        BuyerPhone: user.phone,
        ProductId: product.id,
        SellerName: product.farmer,
        SellerId: product.farmerId,
        SellerPhone: product.phone,
        Status: 'pending',
        PaymentMode: 'demo',
      });

      alert('Demo order placed successfully!');
      navigate('/orders');
    } catch (err: any) {
      console.error('Order failed', err);
      alert(err.message || 'Order failed. Please try again.');
    } finally {
      setIsOrdering(null);
    }
  };

  const handleCallFarmer = (product: any) => {
    // Try common phone fields from Dynamo item
    const phone =
      product.phone ||
      product.Phone ||
      product.FarmerPhone ||
      product.farmerPhone ||
      '';

    if (!phone) {
      alert('Contact number not available for this listing.');
      return;
    }

    window.location.href = `tel:${phone}`;
  };

  const handleWhatsAppChat = (product: any) => {
    const phone =
      product.phone ||
      product.Phone ||
      product.FarmerPhone ||
      product.farmerPhone ||
      '';

    if (!phone) {
      alert('WhatsApp number not available for this listing.');
      return;
    }

    const message = encodeURIComponent(
      `Hi, I am interested in your crop "${product.crop}" listed on FarmBridge.`
    );
    const normalized = phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${normalized}?text=${message}`;
    window.open(url, '_blank');
  };

  // Format dynamoDB items to match what the UI needs, handling missing fields gracefully
  // Also compute a flag for items that are already sold / completed so we can show them as "Sold".
  const formattedProducts = products.map((item, index) => {
    // Generate a pseudo-random deterministic distance based on index (between 1 and 60 km)
    // If distance is explicitly provided in the DB, parse it.
    let numericDistance = 0;
    const dbDistance = item.Distance || item.distance;
    
    if (dbDistance) {
      const parsed = parseFloat(String(dbDistance).replace(/[^0-9.]/g, ''));
      numericDistance = isNaN(parsed) ? ((index * 7) % 55) + 1 : parsed;
    } else {
      numericDistance = ((index * 7) % 55) + 1; 
    }

    const rawStatus = (item.Status || item.status || '').toString().toLowerCase();
    const isExplicitlySold =
      rawStatus === 'sold' ||
      rawStatus === 'sold_out' ||
      rawStatus === 'completed' ||
      rawStatus === 'closed';

    const soldFlag =
      item.IsSold ??
      item.isSold ??
      item.Sold ??
      item.sold ??
      null;

    const isSoldFlagTrue =
      typeof soldFlag === 'string'
        ? soldFlag.toLowerCase() === 'true' || soldFlag.toLowerCase() === 'yes'
        : Boolean(soldFlag);

    const id = item.Id || item.id || Object.keys(item).join('-') || index;
    const isSoldByOrders = soldProductIds.includes(String(id));

    const cropKey = (item.Name || item.crop || item.ItemName || '').toString().toLowerCase().trim();
    const sellerKey = (item.FarmerName || item.farmer || item.Seller || '').toString().toLowerCase().trim();
    const isSoldByCropSeller =
      cropKey && sellerKey ? soldCropSellerPairs.includes(`${cropKey}::${sellerKey}`) : false;

    return {
      id,
      crop: item.Name || item.crop || item.ItemName || 'Unknown Crop',
      farmer: item.FarmerName || item.farmer || item.Seller || 'Local Farmer',
      farmerId: item.FarmerId || item.farmerId || item.SellerId || '',
      phone: item.FarmerPhone || item.farmerPhone || item.phone || item.Phone || '',
      quantity: item.Quantity ? `${item.Quantity} ${item.Unit || 'kg'}` : (item.quantity || 'Available'),
      price: item.Price ? `₹${item.Price}` : (item.price || 'Contact for price'),
      deliveryDate: item.DeliveryDate || item.deliveryDate || 'Within 2 days',
      numericDistance: numericDistance,
      distance: `${numericDistance} km`,
      hasVideo: item.HasVideo || item.hasVideo || false,
      image: item.ImageUrl || item.image || 'https://images.unsplash.com/photo-1595858602621-0498305c14d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXN8ZW58MXx8fHwxNzczMjE2ODgyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      category: item.Category || item.category || 'Vegetables', // Fallback to vegetables
      isSold: isExplicitlySold || isSoldFlagTrue || isSoldByOrders || isSoldByCropSeller,
      rawStatus: rawStatus || 'available',
    };
  });

  // Apply filters (and hide already sold items from the list)
  const filteredProducts = formattedProducts.filter(product => {
    if (product.isSold) return false;

    const matchesSearch = product.crop.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.farmer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || product.category.toLowerCase() === activeFilter.toLowerCase();
    
    // Check if product is within the allowed radius
    const matchesRadius = maxRadius === null || product.numericDistance <= maxRadius;
    
    return matchesSearch && matchesFilter && matchesRadius;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Browse Crops" showBack />
      
      <div className="max-w-md mx-auto p-4">
        {/* Search & Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for crops or farmers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg mb-3"
          />
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['All', 'Vegetables', 'Fruits', 'Grains'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Loading fresh crops...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No crops match your search criteria.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Product Cards */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Product Image */}
                <div className="relative h-48">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.crop}
                    className="w-full h-full object-cover"
                  />
                  {product.hasVideo && (
                    <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg">
                      <Video className="w-5 h-5 text-green-600" />
                    </button>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl text-gray-900 mb-1">{product.crop}</h3>
                      <p className="text-sm text-gray-600">by {product.farmer}</p>
                      {product.isSold && (
                        <span className="inline-flex mt-2 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600 border border-red-200">
                          Sold
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-xl ${product.isSold ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                        {product.price}
                      </div>
                      <div className="text-sm text-gray-600">{product.quantity}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.distance}
                    </div>
                    <div>Delivery: {product.deliveryDate}</div>
                  </div>

                  {/* Quantity selector & total */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 mb-1">
                      Quantity (min 30 kg)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={30}
                        step={1}
                        value={selectedQty[product.id] ?? 30}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || '0', 10);
                          setSelectedQty((prev) => ({ ...prev, [product.id]: v }));
                        }}
                        className="w-24 px-2 py-2 border-2 border-gray-200 rounded-lg text-right"
                        disabled={product.isSold}
                      />
                      <span className="text-sm text-gray-600">kg</span>
                      {product.price && String(product.price).includes('₹') && (
                        <span className={`ml-auto text-sm font-medium ${product.isSold ? 'text-gray-400' : 'text-gray-800'}`}>
                          Total:{' '}
                          {(() => {
                            const unit = parseInt(String(product.price).replace(/[^0-9]/g, ''), 10) || 0;
                            const q = selectedQty[product.id] ?? 30;
                            return `₹${unit * q}`;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {product.hasVideo && (
                      <button className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm flex items-center justify-center gap-1">
                        <Video className="w-4 h-4" />
                        Video
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCallFarmer(product)}
                      className="px-4 py-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center justify-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppChat(product)}
                      className="px-4 py-3 bg-purple-50 text-purple-600 rounded-xl text-sm flex items-center justify-center gap-1"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                  </div>

                  {/* Place Order Button */}
                  <button
                    onClick={() => !product.isSold && handlePlaceOrder(product)}
                    disabled={product.isSold || isOrdering === product.id}
                    className={`w-full mt-3 py-3 rounded-xl active:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 ${
                      product.isSold ? 'bg-gray-300 text-gray-600' : 'bg-green-600 text-white'
                    }`}
                  >
                    {isOrdering === product.id && !product.isSold && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    {product.isSold
                      ? 'Sold'
                      : isOrdering === product.id
                      ? 'Placing Order...'
                      : 'Place Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
