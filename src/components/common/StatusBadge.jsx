import React from 'react';
import { 
  Clock, CheckCircle, Send, CheckCheck, Truck, FileText, 
  ShieldCheck, IndianRupee, XCircle, HelpCircle, AlertCircle
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const configs = {
    'Invoice Requested': { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Clock },
    'Invoice Generated': { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: FileText },
    'Paid': { bg: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold', icon: IndianRupee },
    'Out for Delivery': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', icon: Truck },
    'Delivered': { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', icon: CheckCircle },
    'Pending': { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Clock },
    'Rejected': { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: XCircle },
    'Submitted': { bg: 'bg-sky-50 text-sky-700 border-sky-200/80', icon: FileText }
  };

  const config = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5 gap-1' 
    : size === 'lg' 
    ? 'text-sm px-3.5 py-1.5 gap-2 font-semibold' 
    : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} transition-smooth shrink-0`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{status}</span>
    </span>
  );
};
