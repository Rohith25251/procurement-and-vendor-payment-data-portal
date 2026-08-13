import React from 'react';
import { 
  FilePlus, CheckCircle, Send, CheckCheck, Truck, FileText, 
  IndianRupee, AlertCircle, XCircle 
} from 'lucide-react';

const STEPS = [
  { id: 'Invoice Requested', label: 'Invoice Requested', icon: FilePlus },
  { id: 'Invoice Submitted', label: 'Invoice Submitted', icon: FileText },
  { id: 'Invoice Accepted', label: 'Invoice Accepted', icon: CheckCheck },
  { id: 'Shipped', label: 'Shipped', icon: Send },
  { id: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { id: 'Delivered', label: 'Delivered', icon: CheckCircle },
  { id: 'Paid', label: 'Paid', icon: IndianRupee },
];

export const OrderStatusTracker = ({ currentStatus, history = [], queryComment, rejectionReason }) => {
  const isDeclined = currentStatus === 'Invoice Declined';
  const isRejected = currentStatus === 'Rejected';
  const isTerminal = isDeclined || isRejected;

  // Helper: check if a status exists in history
  const hasHistory = (statusNames) => {
    if (isTerminal) return false;
    const names = Array.isArray(statusNames) ? statusNames : [statusNames];
    return history.some(h => names.includes(h.status));
  };

  // Determine individual step completion
  const isRequestedDone = !isTerminal;
  const isSubmittedDone = hasHistory(['Invoice Submitted', 'Invoice Generated']) || ['Invoice Submitted', 'Invoice Accepted', 'Shipped', 'Out for Delivery', 'Delivered', 'Paid'].includes(currentStatus);
  const isAcceptedDone  = hasHistory(['Invoice Accepted', 'Accepted']) || ['Invoice Accepted', 'Shipped', 'Out for Delivery', 'Delivered', 'Paid'].includes(currentStatus);
  const isShippedDone   = hasHistory(['Shipped']) || ['Shipped', 'Out for Delivery', 'Delivered'].includes(currentStatus) || (currentStatus === 'Paid' && hasHistory(['Shipped']));
  const isOutDone       = hasHistory(['Out for Delivery']) || ['Out for Delivery', 'Delivered'].includes(currentStatus) || (currentStatus === 'Paid' && hasHistory(['Out for Delivery']));
  const isDeliveredDone = hasHistory(['Delivered']) || currentStatus === 'Delivered' || (currentStatus === 'Paid' && hasHistory(['Delivered']));
  const isPaidDone      = hasHistory(['Paid']) || currentStatus === 'Paid';

  const stepCompletionMap = {
    'Invoice Requested': isRequestedDone,
    'Invoice Submitted': isSubmittedDone,
    'Invoice Accepted':  isAcceptedDone,
    'Shipped':           isShippedDone,
    'Out for Delivery':  isOutDone,
    'Delivered':         isDeliveredDone,
    'Paid':              isPaidDone,
  };

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
        
        {isDeclined && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600" />
            Invoice Declined
          </span>
        )}

        {isRejected && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600" />
            Order Rejected
          </span>
        )}
      </div>

      {/* Stepper Grid */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-[760px] flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = !isTerminal && stepCompletionMap[step.id];
            const nextStep = STEPS[idx + 1];
            const nextIsCompleted = nextStep && !isTerminal && stepCompletionMap[nextStep.id];
            
            // Connecting line is green ONLY IF both current step and next step are completed
            const isLineGreen = isCompleted && nextIsCompleted;
            const timestamp = getStepTimestamp(step.id);

            let circleStyle = "bg-slate-100 text-slate-400 border-slate-200";
            let labelStyle = "text-slate-400 font-medium";

            if (isCompleted) {
              circleStyle = "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20";
              labelStyle = "text-slate-800 font-bold";
            } else if (isTerminal && idx === 0) {
              circleStyle = "bg-rose-600 text-white border-rose-600 ring-4 ring-rose-100";
              labelStyle = "text-rose-700 font-bold";
            }

            return (
              <div key={step.id} className="relative flex flex-col items-center flex-1 text-center">
                {/* Connecting Line */}
                {idx < STEPS.length - 1 && (
                  <div className={`absolute top-5 left-1/2 w-full h-1 ${isLineGreen ? 'bg-emerald-600' : 'bg-slate-200'} z-0 transition-colors duration-500`} />
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

      {/* Declined Banner */}
      {isDeclined && rejectionReason && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Invoice Declined Reason:</span>
            <p className="mt-0.5">{rejectionReason}</p>
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
