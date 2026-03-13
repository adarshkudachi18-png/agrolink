import { useState, useEffect, useMemo } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../../lib/api';

const baseRadiusOptions = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
];

export default function AreaSearch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts().then(setProducts).catch(console.error);
  }, []);

  const formattedProducts = useMemo(() => {
    return products.map((item, index) => {
      let numericDistance = 0;
      const dbDistance = item.Distance || item.distance;
      if (dbDistance) {
        const parsed = parseFloat(String(dbDistance).replace(/[^0-9.]/g, ''));
        numericDistance = isNaN(parsed) ? ((index * 7) % 55) + 1 : parsed;
      } else {
        numericDistance = ((index * 7) % 55) + 1; 
      }
      return {
        ...item,
        crop: (item.Name || item.crop || item.ItemName || 'Unknown Crop').toLowerCase(),
        farmer: item.FarmerName || item.farmer || item.Seller || 'Local Farmer',
        numericDistance
      };
    });
  }, [products]);

  const radiusOptions = useMemo(() => {
    return baseRadiusOptions.map(opt => {
      const inRadius = formattedProducts.filter(p => p.numericDistance <= opt.value);
      const uniqueFarmers = new Set(inRadius.map(p => p.farmer)).size;
      return { ...opt, farmers: uniqueFarmers };
    });
  }, [formattedProducts]);

  const summary = useMemo(() => {
    const inRadius = formattedProducts.filter(p => p.numericDistance <= selectedRadius);
    return {
      tomatoes: inRadius.filter(p => p.crop.includes('tomato')).length,
      onions: inRadius.filter(p => p.crop.includes('onion')).length,
      potatoes: inRadius.filter(p => p.crop.includes('potato')).length,
    };
  }, [formattedProducts, selectedRadius]);

  const handleSearch = () => {
    navigate('/marketplace', { state: { radius: selectedRadius } });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Search by Area" showBack />
      
      <div className="max-w-md mx-auto p-4">
        {/* Current Location */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Your Location</div>
              <div className="text-lg text-gray-900">{user?.location || 'Location not set'}</div>
            </div>
          </div>
          <button className="text-green-600 text-sm">Change Location</button>
        </div>

        {/* Search Radius */}
        <h3 className="text-lg text-gray-800 mb-4">Select Search Radius</h3>
        
        <div className="space-y-3 mb-6">
          {radiusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedRadius(option.value)}
              className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                selectedRadius === option.value
                  ? 'bg-green-50 border-green-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedRadius === option.value
                      ? 'border-green-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedRadius === option.value && (
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  )}
                </div>
                <div className="text-left">
                  <div className="text-lg text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">
                    {option.farmers} farmers nearby
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map Preview (Placeholder) */}
        <div className="bg-gray-200 rounded-2xl h-64 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Map View</p>
              <p className="text-sm text-gray-500">Showing {selectedRadius}km radius</p>
            </div>
          </div>
          {/* Decorative circles to simulate map */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-32 h-32 border-4 border-green-400 rounded-full opacity-30"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-48 h-48 border-4 border-green-300 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* Available Crops Summary */}
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <h4 className="text-gray-800 mb-3">Available in {selectedRadius}km</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg mb-1">🍅</div>
              <div className="text-gray-700">Tomatoes</div>
              <div className="text-gray-500 text-xs">{summary.tomatoes} listings</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg mb-1">🧅</div>
              <div className="text-gray-700">Onions</div>
              <div className="text-gray-500 text-xs">{summary.onions} listings</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="text-lg mb-1">🥔</div>
              <div className="text-gray-700">Potatoes</div>
              <div className="text-gray-500 text-xs">{summary.potatoes} listings</div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="w-full bg-green-600 text-white py-5 rounded-xl text-xl flex items-center justify-center gap-2 active:bg-green-700 transition-colors"
        >
          <Search className="w-6 h-6" />
          Search Crops
        </button>
      </div>

      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
