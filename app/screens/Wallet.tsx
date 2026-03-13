import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowDownToLine, History, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { fetchOrders, fetchWalletBalance, demoWalletTopup, demoWalletWithdraw } from '../../lib/api';

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    const loadWalletData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const uid = user.id ?? (user as any).Id ?? (user as any).user_id;
        if (!uid) {
          setIsLoading(false);
          return;
        }
        const wb = await fetchWalletBalance(uid);
        setBalance(wb.balance ?? (wb as any).wallet_balance ?? 0);

        const orders = await fetchOrders();
        
        // Filter orders involving this user
        const myOrders = (orders || []).filter((o: any) => 
          user.role === 'farmer' ? o.SellerName === user.username : o.BuyerName === user.username
        );

        // Format transactions history
        setTransactions(myOrders.map((o: any) => ({
          id: o.id || o.Id,
          title: o.CropName || 'Crop Purchase',
          amount: parseFloat(o.Amount) || 0,
          date: new Date(o.CreatedAt).toLocaleDateString(),
          type: user.role === 'farmer' ? 'credit' : 'debit',
          status: o.Status
        })));

      } catch (err) {
        console.error('Wallet load failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadWalletData();
  }, [user]);

  const runDemoTopup = async (amount: number) => {
    if (!user) return;
    const userId = user.id ?? (user as any).Id ?? (user as any).user_id;
    if (!userId) {
      alert('Session error: user id missing. Please log in again.');
      return;
    }
    await demoWalletTopup(userId, amount);
    const wb = await fetchWalletBalance(userId);
    setBalance(wb.balance ?? wb.wallet_balance ?? 0);
  };

  const handleAddMoney = async () => {
    if (!user) return;

    const raw = prompt('Enter amount to add to wallet (₹)');
    const amount = raw ? parseFloat(raw) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setIsToppingUp(true);
    try {
      await runDemoTopup(Number(amount));
      alert('Wallet updated (demo top-up).');
    } catch (e: any) {
      console.error('Top-up failed', e);
      alert(e.message || 'Top-up failed');
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    const userId = user.id ?? (user as any).Id ?? (user as any).user_id;
    if (!userId) {
      alert('Session error: user id missing. Please log in again.');
      return;
    }

    const upiId = prompt('Enter UPI ID to withdraw money (e.g. user@okhdfcbank)');
    if (!upiId || upiId.trim() === '') return;

    const raw = prompt(`Enter amount to withdraw to ${upiId} (₹). Current balance is ₹${balance}`);
    const amount = raw ? parseFloat(raw) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    if (amount > balance) {
      alert('Insufficient wallet balance.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await demoWalletWithdraw(userId, Number(amount), upiId);
      alert(`Withdrawal of ₹${amount} initiated successfully to ${upiId}.`);
      const wb = await fetchWalletBalance(userId);
      setBalance(wb.balance ?? wb.wallet_balance ?? 0);
    } catch (e: any) {
      console.error('Withdrawal failed', e);
      alert(e.message || 'Withdrawal failed');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Wallet" showBack />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <WalletIcon className="w-6 h-6" />
            <span className="text-green-100">Wallet Balance</span>
          </div>
          <div className="text-5xl font-bold mb-6">
            {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : `₹${balance}`}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAddMoney}
              disabled={isToppingUp || isWithdrawing}
              className="bg-white/20 backdrop-blur-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <span>{isToppingUp ? 'Adding...' : 'Add Money'}</span>
            </button>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isToppingUp || isWithdrawing}
              className="bg-white/20 backdrop-blur-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <ArrowDownToLine className="w-5 h-5" /><span>{isWithdrawing ? 'Withdrawing...' : 'Withdraw'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
          <h3 className="text-gray-800 mb-4 font-semibold">Withdraw To</h3>
          <div className="space-y-2">
            <button className="w-full p-4 border-2 border-gray-200 rounded-xl flex items-center gap-3 active:bg-gray-50 opacity-50 cursor-not-allowed">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">🏦</div>
              <div className="text-left flex-1">
                <div className="text-gray-900 font-medium">Bank Account</div>
                <div className="text-sm text-gray-500">Feature coming soon</div>
              </div>
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="w-full p-4 border-2 border-gray-200 rounded-xl flex items-center gap-3 active:bg-gray-50 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">💳</div>
              <div className="text-left flex-1">
                <div className="text-gray-900 font-medium">UPI</div>
                <div className="text-sm text-gray-500">Withdraw directly to UPI</div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg text-gray-800 flex items-center gap-2 font-semibold">
            <History className="w-5 h-5" /> Payment History
          </h3>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}
                  </div>
                  <div>
                    <div className="text-gray-900 font-medium">{tx.title}</div>
                    <div className="text-xs text-gray-500">{tx.date} • <span className="capitalize">{tx.status}</span></div>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <BottomNav userType={user?.role === 'transporter' ? 'transporter' : user?.role === 'retailer' ? 'retailer' : 'farmer'} />
    </div>
  );
}
