import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { User, Smartphone, Mail, Lock, Check, X, ArrowLeft, Loader2 } from 'lucide-react';
import { signupUser, verifyOTP as confirmOTP } from '../../lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '',
    password: '',
    role: 'retailer',
  });
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length > 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }, [formData.password]);

  const strengthColor = ['bg-gray-200', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][passwordStrength];
  const strengthText = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await signupUser(formData);
      setUserId(response.userId);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await confirmOTP(userId, otp);
      // Go to complete profile to collect location + extra details
      navigate('/complete-profile', { state: { userId, role: formData.role } });
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Create Account</h1>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm flex items-center gap-2">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}
        {step === 'details' ? (
          <form onSubmit={handleDetailsSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              
              {/* Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">Security Strength</span>
                    <span className={`text-xs font-bold ${strengthText === 'Strong' ? 'text-green-600' : 'text-gray-600'}`}>
                      {strengthText}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          i <= passwordStrength ? strengthColor : 'bg-gray-100'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">I want to...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'retailer' })}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    formData.role === 'retailer'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-100 bg-white text-gray-600'
                  }`}
                >
                  <div className="font-bold">Buy Crops</div>
                  <div className="text-xs mt-1">As Retailer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'farmer' })}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    formData.role === 'farmer'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-100 bg-white text-gray-600'
                  }`}
                >
                  <div className="font-bold">Sell Crops</div>
                  <div className="text-xs mt-1">As Farmer</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'transporter' })}
                  className={`col-span-2 p-4 rounded-2xl border-2 transition-all text-center ${
                    formData.role === 'transporter'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-gray-100 bg-white text-gray-600'
                  }`}
                >
                  <div className="font-bold">Transport Crops</div>
                  <div className="text-xs mt-1">As Transporter</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || passwordStrength < 2}
              className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-6 pt-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Verify Phone</h2>
              <p className="text-gray-500 mt-2">
                We've sent a 6-digit code to <br />
                <span className="font-bold text-gray-900">{formData.phone}</span>
              </p>
            </div>

            <input
              type="text"
              required
              maxLength={6}
              className="w-full px-4 py-5 bg-white border border-gray-200 rounded-2xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
            />

            <button
              type="submit"
              disabled={otp.length !== 6 || isLoading}
              className="w-full bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
            </button>

            <button
              type="button"
              onClick={() => setStep('details')}
              className="w-full text-green-600 font-medium py-2"
            >
              Edit Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
