import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Smartphone, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [value, setValue] = useState('');
  const [step, setStep] = useState<'request' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock API call to send reset link/OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center">
        {step === 'request' ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-500 mb-8">
              No worries! Enter your credentials and we'll send you a reset link.
            </p>

            {/* Method Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  method === 'email' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  method === 'phone' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'
                }`}
              >
                Phone
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {method === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <div className="relative">
                  {method === 'email' ? (
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  ) : (
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                  <input
                    type={method === 'email' ? 'email' : 'tel'}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder={method === 'email' ? 'john@example.com' : '+91 98765 43210'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!value || isLoading}
                className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center bg-white rounded-3xl p-10 shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your {method}</h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              We've sent a password reset link to <br />
              <span className="font-bold text-gray-900">{value}</span>. <br />
              Please check your inbox.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 text-white font-bold py-4 rounded-full shadow-lg hover:bg-green-700 transition-all"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
