import React from 'react';
import { 
  Clock, CheckCircle, Send, CheckCheck, Truck, FileText, 
  ShieldCheck, DollarSign, XCircle, HelpCircle, AlertCircle
} from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const configs = {
    'Requested': { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Clock },
    'Approved': { bg: 'bg-sky-50 text-sky-700 border-sky-200/80', icon: CheckCircle },
    'Sent to Vendor': { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', icon: Send },
    'Accepted': { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80', icon: CheckCheck },
    'Delivered': { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', icon: Truck },
    'Invoice Submitted': { bg: 'bg-teal-50 text-teal-700 border-teal-200/80', icon: FileText },
    'Invoice Verified': { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: ShieldCheck },
    'Paid': { bg: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold', icon: DollarSign },
    'Partially Paid': { bg: 'bg-lime-50 text-lime-800 border-lime-300', icon: DollarSign },
    'Pending': { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', icon: Clock },
    'Rejected': { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', icon: XCircle },
    'Query Raised': { bg: 'bg-orange-50 text-orange-700 border-orange-200/80', icon: HelpCircle },
    'Deactivated': { bg: 'bg-slate-100 text-slate-600 border-slate-300', icon: AlertCircle },
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
