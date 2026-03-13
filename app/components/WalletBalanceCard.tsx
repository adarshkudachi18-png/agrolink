import { Wallet, ArrowDownToLine, Send } from 'lucide-react';

interface WalletBalanceCardProps {
  balance: number;
  onWithdraw?: () => void;
  onTransfer?: () => void;
}

export function WalletBalanceCard({ balance, onWithdraw, onTransfer }: WalletBalanceCardProps) {
  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-6 h-6" />
        <span className="text-green-100">Wallet Balance</span>
      </div>
      
      <div className="text-5xl mb-6">
        ₹{balance.toLocaleString('en-IN')}
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onWithdraw}
          className="bg-white/20 backdrop-blur-sm py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <ArrowDownToLine className="w-5 h-5" />
          <span>Withdraw</span>
        </button>
        <button 
          onClick={onTransfer}
          className="bg-white/20 backdrop-blur-sm py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          <span>UPI Transfer</span>
        </button>
      </div>
    </div>
  );
}
