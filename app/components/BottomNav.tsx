import { Home, Package, Truck, Wallet, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

interface BottomNavProps {
  userType: 'farmer' | 'retailer' | 'transporter';
}

export function BottomNav({ userType }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = userType === 'transporter'
    ? [
        { icon: Home, label: 'Home', path: '/transporter' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    : [
        { icon: Home, label: 'Home', path: userType === 'farmer' ? '/farmer' : '/retailer' },
        { icon: Package, label: 'Orders', path: '/orders' },
        { icon: Truck, label: 'Deliveries', path: '/delivery' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: User, label: 'Profile', path: '/profile' },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-md mx-auto flex justify-around items-center h-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1"
            >
              <Icon 
                className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-gray-500'}`}
              />
              <span className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
