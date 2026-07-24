import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ title, value, subtext, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-primary-50 text-primary-600 border-primary-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-md transition-smooth flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        {trendValue && (
          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trendValue}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>
      )}
    </div>
  );
};
