import React from 'react';
import * as LucideIcons from 'lucide-react';

const StatCard = ({ title, value, onClick, isActive, iconName, type = 'normal', size = 'default', percentage }) => {
  const Icon = iconName && LucideIcons[iconName] ? LucideIcons[iconName] : null;

  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const getThemeClasses = () => {
    if (isActive) return 'bg-slate-900 text-white shadow-xl ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 border-transparent';
    if (type === 'high') return 'bg-white/80 backdrop-blur-sm bg-gradient-to-br from-white to-red-50/30 hover:to-red-50/70 border-red-200/70 text-red-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-red-300';
    if (type === 'mid') return 'bg-white/80 backdrop-blur-sm bg-gradient-to-br from-white to-orange-50/30 hover:to-orange-50/70 border-orange-200/70 text-orange-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-orange-300';
    if (type === 'CI') return 'bg-white/80 backdrop-blur-sm bg-gradient-to-br from-white to-indigo-50/30 hover:to-indigo-50/70 border-indigo-200/70 text-indigo-900 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-indigo-300';
    return 'bg-white/80 backdrop-blur-sm bg-gradient-to-br from-white to-slate-50/50 hover:to-slate-50 border-slate-200/70 text-slate-800 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-slate-300';
  };

  const getHeaderColor = () => {
    if (isActive) return 'text-slate-300';
    if (type === 'high') return 'text-red-600';
    if (type === 'mid') return 'text-orange-600';
    if (type === 'CI') return 'text-indigo-600';
    return 'text-slate-500';
  };

  const getAccentColor = () => {
    if (isActive) return 'bg-white/40';
    if (type === 'high') return 'bg-red-400 group-hover:bg-red-500';
    if (type === 'mid') return 'bg-orange-400 group-hover:bg-orange-500';
    if (type === 'CI') return 'bg-indigo-400 group-hover:bg-indigo-500';
    return 'bg-slate-300 group-hover:bg-blue-400';
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col justify-between rounded-xl border
        transition-all duration-300 ease-in-out cursor-pointer group
        ${getThemeClasses()}
        hover:-translate-y-1 hover:shadow-lg
        ${isLg ? 'p-6 h-[140px]' : isSm ? 'p-3 h-[75px]' : 'p-4 min-w-[140px] h-[110px]'}
        flex-1 w-full
      `}
    >
      {/* Header Row */}
      <div className="flex justify-between items-start w-full gap-2">
        <span className={`${isLg ? 'text-xs md:text-sm' : isSm ? 'text-[9px]' : 'text-[11px] md:text-xs'} font-bold leading-snug tracking-wider uppercase ${getHeaderColor()}`}>
          {title}
        </span>
        {Icon && !isSm && (
          <div className={`${isLg ? 'p-2' : 'p-1.5'} rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-black/5'} transition-colors`}>
            <Icon size={isLg ? 20 : 16} strokeWidth={2.5} className={isActive ? 'text-white' : getHeaderColor()} />
          </div>
        )}
      </div>

      {/* Value + Percentage + Accent */}
      <div className={`flex flex-col items-start justify-end w-full mt-auto ${isSm ? 'gap-1' : 'gap-1.5'}`}>
        <div className="flex items-end gap-2">
          <h2 className={`${isLg ? 'text-4xl md:text-5xl' : isSm ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </h2>
          {percentage != null && (
            <span className={`text-[11px] font-semibold leading-none mb-0.5 ${isActive ? 'text-blue-300' : 'text-blue-500'}`}>
              {percentage}%
            </span>
          )}
        </div>
        <div className={`h-1 ${isLg ? 'w-12' : isSm ? 'w-6' : 'w-8'} rounded-full ${getAccentColor()} transition-colors duration-300 opacity-80`} />
      </div>
    </div>
  );
};

export default StatCard;
