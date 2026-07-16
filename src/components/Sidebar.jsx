import React, { useRef } from 'react';
import {
  LayoutDashboard, BarChart3, Search, CalendarDays,
  Table2, ChevronLeft, ChevronRight, Presentation,
  Upload, Download, FileSpreadsheet, Cloud, RefreshCw, CloudOff,
  LogIn, LogOut, Sparkles
} from 'lucide-react';
import useHomeContext from '../hooks/UseHomeContext';
import { exportStyledCloudReport } from '../utils/cloudReportExporter';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', tab: 0 },
  { id: 'analysis', label: 'Análise', icon: Search, path: '/', tab: 1 },
  { id: 'charts', label: 'Gráficos', icon: BarChart3, path: '/', tab: 2 },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays, path: '/', tab: 3 },
  { id: 'optimization', label: 'Inteligência', icon: Sparkles, path: '/', tab: 4 },
  { id: 'tables', label: 'Tabelas', icon: Table2, path: '/beta' },
];

const Sidebar = ({
  collapsed,
  onToggle,
  onTabChange,
  onPresentationMode,
  onUploadPending,
  onUploadCities,
  onDownload,
  cloudLoading,
  cloudError,
  onCloudRefetch,
  selectedTable,
  setSelectedTable,
  tablesList,
  setTablesList
}) => {
  const { user, signOut, setIsLocalMode, data1, activeRoutes } = useHomeContext();
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

        {/* Bloco Nuvem condicionado ao login */}
        {user ? (
          <>
            {/* Separador nuvem */}
            {!collapsed && (
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Nuvem</p>
            )}

            {/* Status do Supabase */}
            {!collapsed && (
              <div className="mx-3 mb-1 flex items-center gap-2">
                {cloudLoading ? (
                  <>
                    <RefreshCw size={12} className="text-blue-400 animate-spin shrink-0" />
                    <span className="text-[10px] text-blue-400">Sincronizando...</span>
                  </>
                ) : cloudError ? (
                  <>
                    <CloudOff size={12} className="text-red-400 shrink-0" />
                    <span className="text-[10px] text-red-400 truncate" title={cloudError}>Erro na conexão</span>
                  </>
                ) : (
                  <>
                    <Cloud size={12} className="text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-400">Dados carregados</span>
                  </>
                )}
              </div>
            )}

            {/* Seletor de Tabela */}
            {!collapsed && (
              <div className="mx-3 my-2 space-y-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Unidade/Tabela</label>
                <select
                  value={selectedTable}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__add_new__') {
                      const newTableName = prompt("Digite o nome da nova tabela do Supabase:");
                      if (newTableName && newTableName.trim() !== "") {
                        const cleaned = newTableName.trim();
                        if (!tablesList.includes(cleaned)) {
                          setTablesList([...tablesList, cleaned]);
                        }
                        setSelectedTable(cleaned);
                      }
                    } else {
                      setSelectedTable(val);
                    }
                  }}
                  className="w-full bg-slate-800 text-slate-200 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium transition-all"
                >
                  {tablesList.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__add_new__" className="text-blue-400 font-bold bg-slate-850">
                    + Adicionar Tabela...
                  </option>
                </select>
              </div>
            )}

            {/* Botão sincronizar */}
            <button
              onClick={() => onCloudRefetch && onCloudRefetch()}
              disabled={cloudLoading}
              className={`
                w-full flex items-center gap-3 rounded-lg 
                transition-all duration-200 group
                text-slate-400 hover:text-blue-400 hover:bg-blue-500/10
                disabled:opacity-40 disabled:cursor-not-allowed
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
              `}
              title="Sincronizar da Nuvem"
            >
              <RefreshCw size={16} className={`shrink-0 ${cloudLoading ? 'animate-spin' : ''}`} />
              {!collapsed && <span className="text-xs font-medium">Sincronizar</span>}
            </button>

            {/* Botão Baixar Relatório Completo da Nuvem */}
            <button
              onClick={() => exportStyledCloudReport(data1, activeRoutes, selectedTable)}
              disabled={cloudLoading || !data1 || data1.length <= 1}
              className={`
                w-full flex items-center gap-3 rounded-lg 
                transition-all duration-200 group
                text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10
                disabled:opacity-40 disabled:cursor-not-allowed
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
              `}
              title="Baixar Relatório Completo"
            >
              <Download size={16} className="shrink-0" />
              {!collapsed && <span className="text-xs font-medium">Relatório Nuvem</span>}
            </button>
          </>
        ) : (
          /* Botão para conectar à nuvem se estiver offline */
          <button
            onClick={() => setIsLocalMode(false)}
            className={`
              w-full flex items-center gap-3 rounded-lg 
              transition-all duration-200 group
              text-slate-400 hover:text-blue-450 hover:bg-blue-500/10
              ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
            `}
            title="Conectar à Nuvem"
          >
            <LogIn size={16} className="shrink-0 text-slate-500 group-hover:text-blue-400" />
            {!collapsed && <span className="text-xs font-medium">Conectar à Nuvem</span>}
          </button>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-2 pb-4 space-y-1 border-t border-slate-800/50 pt-3">
        {user && (
          <button
            onClick={signOut}
            className={`
              w-full flex items-center gap-3 rounded-lg 
              transition-all duration-200 group
              text-rose-400 hover:bg-rose-500/10
              ${collapsed ? 'justify-center p-3' : 'px-3 py-2.5'}
            `}
            title="Desconectar da Nuvem"
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Desconectar</span>}
          </button>
        )}

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
