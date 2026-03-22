import React, { useRef } from 'react';
import {
  LayoutDashboard, BarChart3, Search, CalendarDays,
  Table2, ChevronLeft, ChevronRight, Presentation,
  Upload, Download, FileSpreadsheet
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', tab: 0 },
  { id: 'analysis', label: 'Análise', icon: Search, path: '/', tab: 1 },
  { id: 'charts', label: 'Gráficos', icon: BarChart3, path: '/', tab: 2 },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays, path: '/', tab: 3 },
  { id: 'tables', label: 'Tabelas', icon: Table2, path: '/beta' },
];

const Sidebar = ({ collapsed, onToggle, onTabChange, onPresentationMode, onUploadPending, onUploadCities, onDownload }) => {
  const [activeId, setActiveId] = React.useState('dashboard');
  const pendingInputRef = useRef(null);
  const citiesInputRef = useRef(null);

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40
        bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50
        flex flex-col
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-56'}
      `}
    >
      {/* Brand */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} h-16 border-b border-slate-800/50`}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
          <span className="text-white font-black text-sm">TO</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm tracking-tight leading-none">Tracking</p>
            <p className="text-blue-400 text-[10px] font-semibold tracking-widest uppercase">Online</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveId(item.id);
                if (item.tab !== undefined && onTabChange) {
                  onTabChange(item.tab);
                }
              }}
              className={`
                w-full flex items-center gap-3 rounded-lg 
                transition-all duration-200 group
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
                ${activeId === item.id
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={18}
                className={`shrink-0 transition-colors ${activeId === item.id ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}
              />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Upload / Download Section */}
      <div className="px-2 pb-2 space-y-1 border-t border-slate-800/50 pt-3">
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Dados</p>
        )}

        {/* Hidden file inputs */}
        <input
          ref={pendingInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { onUploadPending && onUploadPending(e); e.target.value = ''; }}
        />
        <input
          ref={citiesInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { onUploadCities && onUploadCities(e); e.target.value = ''; }}
        />

        <button
          onClick={() => pendingInputRef.current?.click()}
          className={`
            w-full flex items-center gap-3 rounded-lg 
            transition-all duration-200 group
            text-slate-400 hover:text-amber-400 hover:bg-amber-500/10
            ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
          `}
          title="Carregar A. Pending"
        >
          <Upload size={16} className="shrink-0" />
          {!collapsed && <span className="text-xs font-medium">A. Pending</span>}
        </button>

        <button
          onClick={() => citiesInputRef.current?.click()}
          className={`
            w-full flex items-center gap-3 rounded-lg 
            transition-all duration-200 group
            text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10
            ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
          `}
          title="Carregar Cidades"
        >
          <FileSpreadsheet size={16} className="shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Cidades</span>}
        </button>

        <button
          onClick={() => onDownload && onDownload()}
          className={`
            w-full flex items-center gap-3 rounded-lg 
            transition-all duration-200 group
            text-slate-400 hover:text-green-400 hover:bg-green-500/10
            ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
          `}
          title="Download Planilha"
        >
          <Download size={16} className="shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Download</span>}
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="px-2 pb-4 space-y-1 border-t border-slate-800/50 pt-3">
        {onPresentationMode && (
          <button
            onClick={onPresentationMode}
            className={`
              w-full flex items-center gap-3 rounded-lg 
              transition-all duration-200 group
              text-emerald-400 hover:bg-emerald-500/10
              ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
            `}
            title="Modo Apresentação"
          >
            <Presentation size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Apresentação</span>}
          </button>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={`
            w-full flex items-center gap-3 rounded-lg 
            transition-all duration-200
            text-slate-500 hover:text-slate-300 hover:bg-white/5
            ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
          `}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-sm font-medium">Recolher</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
