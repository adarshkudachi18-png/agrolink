import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

export default function HelpSupport() {
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const isTransporter = user?.role === 'transporter';

  const handleWhatsAppSupport = () => {
    const number = '918000000000'; // demo support number
    const message = encodeURIComponent('Hi, I need help with the FarmBridge app.');
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('FarmBridge Support Request');
    const body = encodeURIComponent(
      `Hi team,\n\nI need help with the app.\n\nUser: ${user?.username || 'Guest'}\nRole: ${
        user?.role || 'N/A'
      }\n\nDescribe your issue here:\n`
    );
    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Help & Support" showBack />
      <div className="max-w-md mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Need assistance?</h2>
          <p className="text-sm text-gray-600">
            We are here to help farmers and retailers use FarmBridge smoothly.
          </p>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppSupport}
          className="w-full bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm active:bg-green-100"
        >
          <div>
            <div className="font-medium text-gray-900">WhatsApp Support</div>
            <div className="text-sm text-gray-500">Chat with our team</div>
          </div>
          <span className="text-2xl">💬</span>
        </button>

        <button
          type="button"
          onClick={handleEmailSupport}
          className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm active:bg-gray-50"
        >
          <div>
            <div className="font-medium text-gray-900">Email Support</div>
            <div className="text-sm text-gray-500">Send us details</div>
          </div>
          <span className="text-2xl">✉️</span>
        </button>
      </div>
      <BottomNav userType={isTransporter ? 'transporter' : isFarmer ? 'farmer' : 'retailer'} />
    </div>
  );
}

