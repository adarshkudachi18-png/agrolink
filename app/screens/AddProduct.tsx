import { useState, useEffect } from 'react';
import { Camera, Upload, MapPin, Loader2, Mic, Crosshair } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { publishProduct } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cropName: '',
    quantity: '',
    unit: 'kg',
    pricePerKg: '',
    harvestDate: '',
    deliveryDate: '',
    location: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const safeSetFormData = (updater: (prev: typeof formData) => typeof formData) => {
    setFormData((prev) => updater(prev));
  };

  const handleVoiceFill = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => {
      setIsListening(false);
      alert('Could not capture voice. Please try again.');
    };
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      const lower = transcript.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);

      const numbers = words
        .map((w) => parseFloat(w))
        .filter((n) => !Number.isNaN(n));

      const quantity = numbers[0]?.toString() || '';
      const pricePerKg = numbers[1]?.toString() || '';

      // Try to pick crop name as first non-number word
      const cropWord = words.find((w) => Number.isNaN(parseFloat(w))) || '';
      const cropName =
        cropWord.charAt(0).toUpperCase() + cropWord.slice(1);

      // Try to detect location after "in" or "at"
      let location = '';
      const inIndex = words.findIndex((w) => w === 'in' || w === 'at');
      if (inIndex >= 0 && inIndex < words.length - 1) {
        location = words.slice(inIndex + 1).join(' ');
      }

      safeSetFormData((prev) => ({
        ...prev,
        cropName: prev.cropName || cropName,
        quantity: prev.quantity || quantity,
        pricePerKg: prev.pricePerKg || pricePerKg,
        location: prev.location || location,
      }));
    };

    recognition.start();
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Location is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        safeSetFormData((prev) => ({
          ...prev,
          location: value,
        }));
      },
      () => {
        alert('Unable to detect location. Please enter it manually.');
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Limit resolution for DynamoDB
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress quality to 0.7 to keep it small
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImagePreview(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setVideoName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await publishProduct({
        Name: formData.cropName,
        Quantity: formData.quantity,
        Unit: formData.unit,
        Price: formData.pricePerKg,
        HarvestDate: formData.harvestDate,
        DeliveryDate: formData.deliveryDate,
        Location: formData.location || (user?.location || 'Unknown'),
        FarmerName: user?.username || 'Local Farmer',
        FarmerId: user?.id,
        FarmerPhone: user?.phone,
        HasVideo: !!video,
        ImageUrl: imagePreview || undefined,
      });
      alert('Product listing published successfully!');
      navigate('/farmer');
    } catch (err) {
      console.error("Failed to publish product", err);
      alert('Failed to publish product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Add Product" showBack />
      
      <div className="max-w-md mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Voice assistant + auto-detect row */}
          <div className="flex gap-3 mb-2">
            <button
              type="button"
              onClick={handleVoiceFill}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-green-600 text-green-700 bg-green-50 text-sm"
            >
              <Mic className="w-4 h-4" />
              {isListening ? 'Listening...' : 'Fill by Voice'}
            </button>
            <button
              type="button"
              onClick={handleAutoDetectLocation}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl border border-blue-600 text-blue-700 bg-blue-50 text-sm"
            >
              <Crosshair className="w-4 h-4" />
              Auto Detect Location
            </button>
          </div>
          {/* Hidden File Input */}
          <input
            type="file"
            id="product-image"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
          <input
            type="file"
            id="product-video"
            accept="video/*"
            className="hidden"
            onChange={handleVideoChange}
          />
          {/* Crop Name */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Crop Name</label>
            <input
              type="text"
              name="cropName"
              value={formData.cropName}
              onChange={handleChange}
              placeholder="e.g., Tomato, Onion, Rice"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Quantity</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter quantity"
                className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
                required
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="px-4 py-4 border-2 border-gray-200 rounded-xl text-lg bg-white"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="ton">ton</option>
              </select>
            </div>
          </div>

          {/* Price per kg */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Price per kg</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-lg">₹</span>
              <input
                type="number"
                name="pricePerKg"
                value={formData.pricePerKg}
                onChange={handleChange}
                placeholder="Enter price"
                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
                required
              />
            </div>
          </div>

          {/* Harvest Date */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Harvest Date</label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
              required
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Delivery Date</label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Location</label>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-gray-400 ml-2" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Village/Town name"
                className="flex-1 px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
                required
              />
            </div>
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Product Image</label>
            {imagePreview ? (
              <div className="relative w-full h-48 mb-2 rounded-xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => document.getElementById('product-image')?.click()}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-white">Change Photo</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => document.getElementById('product-image')?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center gap-2"
              >
                <Camera className="w-12 h-12 text-gray-400" />
                <span className="text-gray-600">Take Photo</span>
              </button>
            )}
          </div>

          {/* Upload Video */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Quality Video (Optional)</label>
            <button
              type="button"
              onClick={() => document.getElementById('product-video')?.click()}
              className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 transition-colors ${
                videoName ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Upload className={`w-12 h-12 ${videoName ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className={videoName ? 'text-blue-700' : 'text-gray-600'}>
                {videoName || 'Upload Video'}
              </span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-600 text-white py-5 rounded-xl text-xl mt-6 active:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting && <Loader2 className="w-6 h-6 animate-spin" />}
            {isSubmitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>

      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
