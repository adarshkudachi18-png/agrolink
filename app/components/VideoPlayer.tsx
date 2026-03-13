import { Play, X } from 'lucide-react';
import { useState } from 'react';

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  onClose?: () => void;
}

export function VideoPlayer({ videoUrl, thumbnailUrl, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md">
        {!isPlaying ? (
          <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
            )}
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-green-600 ml-1" />
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            <p className="text-white text-center">
              Video Player
              <br />
              <span className="text-sm text-gray-400">Playing quality video...</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
