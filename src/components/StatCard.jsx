import React from 'react';
import * as LucideIcons from 'lucide-react';

const StatCard = ({ title, value, onClick, isActive, iconName, type = 'normal' }) => {
  // Dynamically resolve the lucide icon
  const Icon = iconName && LucideIcons[iconName] ? LucideIcons[iconName] : null;

  // Aesthetic colors depending on type / state
  const getThemeClasses = () => {
    if (isActive) return 'bg-slate-800 text-white border-transparent shadow-md ring-2 ring-slate-800 ring-offset-2';
    if (type === 'high') return 'bg-red-50 hover:bg-red-100 border-red-200 text-red-900';
    if (type === 'mid') return 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-900';
    if (type === 'CI') return 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900';
    return 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800';
  };

  const getHeaderColor = () => {
    if (isActive) return 'text-slate-300';
    if (type === 'high') return 'text-red-700';
    if (type === 'mid') return 'text-orange-700';
    if (type === 'CI') return 'text-indigo-700';
    return 'text-slate-500';
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col justify-between p-4 rounded-xl border
        transition-all duration-300 ease-in-out cursor-pointer group
        ${getThemeClasses()}
        hover:-translate-y-1 hover:shadow-md
        min-w-[140px] h-[110px] flex-1
      `}
    >
      <div className="flex justify-between items-start w-full gap-2">
        <span className={`text-[11px] md:text-xs font-bold leading-snug tracking-wider uppercase ${getHeaderColor()}`}>
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20' : 'bg-black/5'} transition-colors`}>
            <Icon size={16} strokeWidth={2.5} className={isActive ? 'text-white' : getHeaderColor()} />
          </div>
        )}
      </div>

      <div className="flex flex-col items-start justify-end w-full mt-auto gap-1.5">
        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight leading-none ${isActive ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h2>
        
        {/* Decorative subtle accent line replacing the old .divider */}
        <div className={`h-1 w-8 rounded-full ${isActive ? 'bg-white/40' : 'bg-slate-300 group-hover:bg-blue-400'} transition-colors opacity-80`} />
      </div>
    </div>
  );
};

export default StatCard;
