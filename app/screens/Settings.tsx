import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Settings() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const isTransporter = user?.role === 'transporter';
  const [language] = useState('auto');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Settings" showBack />
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Account</h2>
          <p className="text-sm text-gray-600">
            Logged in as <span className="font-medium">{user?.username}</span> ({isFarmer ? 'Farmer' : isTransporter ? 'Transporter' : 'Retailer'})
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-gray-900 mb-1">App Preferences</h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Language</span>
            <span className="text-gray-500 capitalize">{language === 'auto' ? 'Auto (Google Translate)' : language}</span>
          </div>
          <p className="text-xs text-gray-400">
            You can change the display language anytime from the top bar language icon.
          </p>
        </div>
      </div>
      <BottomNav userType={isTransporter ? 'transporter' : isFarmer ? 'farmer' : 'retailer'} />
    </div>
  );
}

