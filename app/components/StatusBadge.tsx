import { Clock, Package, CheckCircle, XCircle, Truck } from 'lucide-react';

type Status = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'delivering';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  'in-progress': {
    icon: Package,
    label: 'In Progress',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  delivering: {
    icon: Truck,
    label: 'Delivering',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`rounded-full flex items-center gap-1 border-2 ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} inline-flex`}
    >
      <StatusIcon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );
}
