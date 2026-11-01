import React from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { navItems } from './Sidebar';

// Abas que cabem na barra inferior; o resto (Inteligência, Indicadores,
// Usuários, ações de dados) fica na gaveta aberta por "Mais".
const BAR_TABS = [0, 1, 2, 3];
const barItems = navItems.filter((item) => BAR_TABS.includes(item.tab));

/**
 * Navegação do celular: barra fixa embaixo (padrão de app) com as 4 áreas
 * principais + "Mais". Só aparece abaixo de md; no desktop vale a sidebar.
 */
export default function MobileNav({ activeTab, onTabChange, onOpenMenu }) {
  const moreActive = !BAR_TABS.includes(activeTab);

  const itemClass = (active) =>
    `relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-semibold transition-colors ${
      active ? 'text-blue-300' : 'text-slate-400 active:text-white'
    }`;

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/70 pb-[env(safe-area-inset-bottom)]"
    >
      {barItems.map((item) => {
        const Icon = item.icon;
        const active = activeTab === item.tab;
        return (
          <button key={item.id} type="button" onClick={() => onTabChange(item.tab)} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
            {active && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="absolute top-0 inset-x-4 h-0.5 rounded-b-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button type="button" onClick={onOpenMenu} className={itemClass(moreActive)} aria-haspopup="dialog">
        {moreActive && <span className="absolute top-0 inset-x-4 h-0.5 rounded-b-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.7)]" />}
        <Menu size={20} />
        <span>Mais</span>
      </button>
    </nav>
  );
}
