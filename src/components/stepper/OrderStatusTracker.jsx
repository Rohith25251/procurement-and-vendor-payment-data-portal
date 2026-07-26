import React from 'react';
import { 
  FilePlus, CheckCircle, Send, CheckCheck, Truck, FileText, 
  ShieldCheck, IndianRupee, AlertCircle, HelpCircle, XCircle 
} from 'lucide-react';

const STEPS = [
  { id: 'Invoice Requested', label: 'Invoice Requested', icon: FilePlus },
  { id: 'Invoice Generated', label: 'Invoice Generated', icon: FileText },
  { id: 'Paid', label: 'Paid', icon: IndianRupee },
  { id: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'Delivered', label: 'Delivered', icon: CheckCircle }
];

export const OrderStatusTracker = ({ currentStatus, history = [], queryComment, rejectionReason }) => {
  const isRejected = currentStatus === 'Rejected';
  const isQuery = currentStatus === 'Query Raised';

  // Find index of current status in steps
  const getCurrentIndex = () => {
    if (isRejected) return 1; // Default to approval stage or historical
    if (isQuery) return 3; // Query raised at acceptance stage
    const idx = STEPS.findIndex(s => s.id === currentStatus);
    return idx !== -1 ? idx : 0;
  };

  const currentIndex = getCurrentIndex();

  const getStepTimestamp = (stepId) => {
    const entry = history.find(h => h.status === stepId);
    return entry ? entry.timestamp : null;
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Order Life Cycle Tracker</h4>
          <p className="text-xs text-slate-400 mt-0.5">Real-time status progression from request to settlement</p>
        </div>
        
        {isRejected && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600" />
            Order Rejected
          </span>
        )}

        {isQuery && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Vendor Query Pending
          </span>
        )}
      </div>

      {/* Stepper Grid */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-[720px] flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = !isRejected && (idx < currentIndex || currentStatus === 'Paid');
            const isCurrent = !isRejected && (idx === currentIndex && currentStatus !== 'Paid');
            const timestamp = getStepTimestamp(step.id);

            let circleStyle = "bg-slate-100 text-slate-400 border-slate-200";
            let lineStyle = "bg-slate-200";
            let labelStyle = "text-slate-400 font-medium";

            if (isCompleted) {
              circleStyle = "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20";
              lineStyle = "bg-emerald-600";
              labelStyle = "text-slate-800 font-bold";
            } else if (isCurrent) {
              if (isQuery && step.id === 'Accepted') {
                circleStyle = "bg-amber-500 text-white border-amber-500 ring-4 ring-amber-100 animate-pulse";
                labelStyle = "text-amber-700 font-bold";
              } else {
                circleStyle = "bg-primary-600 text-white border-primary-600 ring-4 ring-primary-100";
                labelStyle = "text-primary-700 font-extrabold";
              }
            } else if (isRejected && idx === currentIndex) {
              circleStyle = "bg-rose-600 text-white border-rose-600 ring-4 ring-rose-100";
              labelStyle = "text-rose-700 font-bold";
            }

            return (
              <div key={step.id} className="relative flex flex-col items-center flex-1 text-center">
                {/* Connecting Line */}
                {idx < STEPS.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-1 ${lineStyle} z-0 transition-colors duration-500`} />
                )}

                {/* Circle Icon */}
                <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${circleStyle}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label & Timestamp */}
                <div className="mt-2.5 px-1">
                  <p className={`text-xs ${labelStyle}`}>{step.label}</p>
                  {timestamp && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">{timestamp.split(' ')[0]}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Banner */}
      {isQuery && queryComment && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Vendor Query Note:</span>
            <p className="mt-0.5">{queryComment}</p>
          </div>
        </div>
      )}

      {/* Rejection Banner */}
      {isRejected && rejectionReason && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Rejection Reason:</span>
            <p className="mt-0.5">{rejectionReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
