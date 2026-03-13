import { useState } from 'react';
import { Video, Upload, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';

export default function UploadVideo() {
  const navigate = useNavigate();
  const [cropName, setCropName] = useState('');
  const [description, setDescription] = useState('');
  const [videoUploaded, setVideoUploaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Video uploaded successfully!');
    navigate('/farmer');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Upload Quality Video" showBack />
      
      <div className="max-w-md mx-auto p-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-blue-800">
            📹 Upload a video showing product quality to help retailers make better decisions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crop Name */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Crop Name</label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder="e.g., Fresh Tomatoes"
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg"
              required
            />
          </div>

          {/* Video Upload */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Product Video</label>
            {!videoUploaded ? (
              <button
                type="button"
                onClick={() => setVideoUploaded(true)}
                className="w-full p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center gap-3"
              >
                <Video className="w-16 h-16 text-gray-400" />
                <div className="text-center">
                  <div className="text-gray-700 text-lg mb-1">Record or Upload Video</div>
                  <div className="text-sm text-gray-500">Max 2 minutes</div>
                </div>
              </button>
            ) : (
              <div className="relative bg-gray-200 rounded-xl overflow-hidden aspect-video">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUploaded(false)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 mb-2 text-lg">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the quality, freshness, size..."
              rows={4}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-lg resize-none"
              required
            />
          </div>

          {/* Tips */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h4 className="text-green-800 mb-2">Tips for a good video:</h4>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Show product clearly in good lighting</li>
              <li>• Display size and quality</li>
              <li>• Keep video under 2 minutes</li>
              <li>• Show packaging if available</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-xl text-xl active:bg-blue-700 transition-colors"
          >
            <Upload className="w-6 h-6 inline mr-2" />
            Submit Video
          </button>
        </form>
      </div>

      <BottomNav userType="farmer" />
    </div>
  );
}
