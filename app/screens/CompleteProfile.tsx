import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { MapPin, Building, Loader2, ArrowRight, CheckCircle, Navigation } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  userId: string;
  role: string;
}

export default function CompleteProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { refreshUser } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    location: '',
    pincode: '',
    // Farmer-specific
    farmName: '',
    farmSizeAcres: '',
    // Retailer-specific
    businessName: '',
    gstNumber: '',
  });

  const isFarmer = state?.role === 'farmer';
  const isTransporter = state?.role === 'transporter';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocoding using OpenStreetMap (Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
            const stateName = data.address.state || '';
            const postcode = data.address.postcode || '';
            
            setFormData(prev => ({
              ...prev,
              location: `${city}${city && stateName ? ', ' : ''}${stateName}`,
              pincode: postcode.substring(0, 6)
            }));
          }
        } catch (err) {
          console.error('Location detection failed:', err);
          setError('Failed to detect precise address. Please enter manually.');
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        setIsDetecting(false);
        setError('Location access denied. Please allow location permissions or enter manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.pincode) {
      setError('Location and Pincode are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        userId: state.userId,
        location: formData.location,
        pincode: formData.pincode,
        ...(isFarmer
          ? { farmName: formData.farmName, farmSizeAcres: formData.farmSizeAcres }
          : isTransporter
            ? {}
            : { businessName: formData.businessName, gstNumber: formData.gstNumber }),
      };

      const res = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save profile');
      }

      // Backend set HTTP-only cookie. Refresh user from DB.
      await refreshUser();
      if (state?.role === 'farmer') navigate('/farmer');
      else if (state?.role === 'transporter') navigate('/transporter');
      else navigate('/retailer');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 text-center">Complete Your Profile</h1>
        <p className="text-sm text-gray-500 text-center mt-1">Just a few more details to get started</p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-green-700 font-medium">Account Created</span>
        </div>
        <div className="w-8 h-0.5 bg-green-300" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm text-green-700 font-medium">Verified</span>
        </div>
        <div className="w-8 h-0.5 bg-green-300" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            3
          </div>
          <span className="text-sm text-green-700 font-medium">Profile</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Banner */}
          <div className={`rounded-2xl p-4 text-center ${isFarmer ? 'bg-green-600' : isTransporter ? 'bg-amber-600' : 'bg-blue-600'} text-white`}>
            <div className="text-3xl mb-1">{isFarmer ? '👨‍🌾' : isTransporter ? '🚚' : '🛒'}</div>
            <div className="font-bold text-lg">{isFarmer ? 'Farmer Account' : isTransporter ? 'Transporter Account' : 'Retailer Account'}</div>
            <div className="text-sm opacity-80">
              {isFarmer ? 'Sell your crops to retailers' : isTransporter ? 'Transport crops from farm to buyer' : 'Buy fresh crops from farmers'}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700">
                Village / Town / City <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="text-xs font-bold text-green-600 flex items-center gap-1 hover:text-green-700"
              >
                {isDetecting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                Auto Detect
              </button>
            </div>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Pune, Maharashtra"
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pincode <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pincode"
              required
              maxLength={6}
              value={formData.pincode}
              onChange={handleChange}
              placeholder="e.g., 411001"
              className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Farmer-specific fields */}
          {isFarmer && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Farm Name (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="farmName"
                    value={formData.farmName}
                    onChange={handleChange}
                    placeholder="e.g., Green Acres Farm"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Farm Size (Acres) (Optional)
                </label>
                <input
                  type="number"
                  name="farmSizeAcres"
                  value={formData.farmSizeAcres}
                  onChange={handleChange}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          {/* Retailer-specific fields */}
          {!isFarmer && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Business Name (Optional)
                </label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="e.g., Fresh Mart"
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="e.g., 27AAAAA0000A1Z5"
                  className="w-full px-4 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
