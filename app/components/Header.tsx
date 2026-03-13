import { ArrowLeft, Bell, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  isOffline?: boolean;
}

export function Header({ title, showBack = false, showNotifications = false, isOffline = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-green-600 text-white px-4 py-4 safe-area-top">
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl">{title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1 bg-yellow-500 px-2 py-1 rounded-full text-xs">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
          <LanguageSwitcher />
          {showNotifications && (
            <button 
              onClick={() => navigate('/notifications')}
              className="p-1 relative"
            >
              <Bell className="w-6 h-6" />
              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
