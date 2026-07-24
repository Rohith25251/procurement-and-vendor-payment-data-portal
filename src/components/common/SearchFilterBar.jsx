import React from 'react';
import { Search, Filter, X } from 'lucide-react';

export const SearchFilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder = "Search records...", 
  statusFilter, 
  onStatusChange, 
  statusOptions = [],
  categoryFilter,
  onCategoryChange,
  categoryOptions = []
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-soft mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-smooth"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Select Dropdowns */}
      <div className="flex flex-wrap gap-3 items-center">
        {categoryOptions.length > 0 && (
          <select
            value={categoryFilter || ''}
            onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-smooth"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {statusOptions.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <select
              value={statusFilter || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent border-0 text-xs font-semibold text-slate-700 focus:outline-none pr-2"
            >
              <option value="">All Statuses</option>
              {statusOptions.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
