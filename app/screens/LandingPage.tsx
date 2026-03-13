import { useNavigate } from 'react-router';
import { ArrowRight, Sprout, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-green-800 text-white pb-12 pt-16">
        <div className="max-w-md mx-auto px-6 relative z-10">
          <div className="flex items-center gap-2 mb-6 animate-fade-in">
            <Sprout className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold">Kisan Mitra</span>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight mb-6 animate-slide-up">
            Directly Connect <br />
            <span className="text-green-300">Farmer to Market</span>
          </h1>
          
          <p className="text-green-100 text-lg mb-10 leading-relaxed animate-slide-up delay-100">
            Cut the middleman. Get fresh produce straight from farms at the best prices, or list your crops and reach thousands of buyers instantly.
          </p>

          <div className="flex flex-col gap-4 animate-slide-up delay-200">
            <button
              onClick={() => navigate('/signup')}
              className="w-full bg-white text-green-700 font-bold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-green-50 transition-all active:scale-95"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-700/50 backdrop-blur-md border border-green-400/30 text-white font-semibold py-5 rounded-2xl hover:bg-green-700/70 transition-all"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-green-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-green-900/40 rounded-full blur-3xl"></div>
      </div>

      {/* Features Section */}
      <div className="max-w-md mx-auto px-6 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Why choose Kisan Mitra?</h2>
        
        <div className="space-y-8 pb-12">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Secure Payments</h3>
              <p className="text-gray-600">Integrated Razorpay payments for safe and instant transactions.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Direct Market Access</h3>
              <p className="text-gray-600">Farmers set their own prices and get 100% of the profit.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Fast Delivery</h3>
              <p className="text-gray-600">Coordinated logistics for fresh produce delivery within hours.</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
}
