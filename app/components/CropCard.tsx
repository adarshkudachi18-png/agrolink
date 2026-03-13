import { Video, Phone, MessageCircle, MapPin } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CropCardProps {
  crop: string;
  farmer: string;
  quantity: string;
  price: string;
  deliveryDate: string;
  distance: string;
  hasVideo: boolean;
  image: string;
  onVideoClick?: () => void;
  onCallClick?: () => void;
  onChatClick?: () => void;
  onOrderClick?: () => void;
}

export function CropCard({
  crop,
  farmer,
  quantity,
  price,
  deliveryDate,
  distance,
  hasVideo,
  image,
  onVideoClick,
  onCallClick,
  onChatClick,
  onOrderClick,
}: CropCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48">
        <ImageWithFallback
          src={image}
          alt={crop}
          className="w-full h-full object-cover"
        />
        {hasVideo && (
          <button 
            onClick={onVideoClick}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg"
          >
            <Video className="w-5 h-5 text-green-600" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl text-gray-900 mb-1">{crop}</h3>
            <p className="text-sm text-gray-600">by {farmer}</p>
          </div>
          <div className="text-right">
            <div className="text-xl text-green-600">{price}</div>
            <div className="text-sm text-gray-600">{quantity}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {distance}
          </div>
          <div>Delivery: {deliveryDate}</div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {hasVideo && (
            <button 
              onClick={onVideoClick}
              className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-sm flex items-center justify-center gap-1"
            >
              <Video className="w-4 h-4" />
              Video
            </button>
          )}
          <button 
            onClick={onCallClick}
            className="px-4 py-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center justify-center gap-1"
          >
            <Phone className="w-4 h-4" />
            Call
          </button>
          <button 
            onClick={onChatClick}
            className="px-4 py-3 bg-purple-50 text-purple-600 rounded-xl text-sm flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        </div>

        {/* Place Order Button */}
        <button 
          onClick={onOrderClick}
          className="w-full mt-3 bg-green-600 text-white py-3 rounded-xl active:bg-green-700 transition-colors"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
