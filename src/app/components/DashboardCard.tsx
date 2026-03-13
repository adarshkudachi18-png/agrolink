import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  color?: string;
}

export function DashboardCard({ icon: Icon, title, subtitle, onClick, color = 'green' }: DashboardCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 border-2 rounded-2xl flex flex-col items-center gap-3 shadow-sm active:scale-95 transition-transform ${colorClasses[color as keyof typeof colorClasses] || colorClasses.green}`}
    >
      <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full">
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-center">
        <div className="font-semibold text-lg">{title}</div>
        {subtitle && <div className="text-sm opacity-75">{subtitle}</div>}
      </div>
    </button>
  );
}
