import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({ title = "No records found", description = "Try adjusting your filters or search query.", action, icon: Icon = Inbox }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200/80 my-4">
      <div className="p-4 bg-slate-100/80 text-slate-400 rounded-full mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">{description}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};
