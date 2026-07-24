import React from 'react';

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-200/70 rounded-xl w-full"></div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3 border-b border-slate-100 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-5 bg-slate-200/50 rounded-md flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-32 bg-slate-200/60 rounded-2xl animate-pulse"></div>
      ))}
    </div>
  );
};
