import React, { useState } from "react";
import "./App.css";
import PagesRoutes from "./Router";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";
import { HomeProvider } from "./Contexts/HomeContext";

const App = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <HomeProvider>
      <div className="App flex min-h-screen">
        <LoadingScreen />
        
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Area */}
        <div
          className="flex-1 flex flex-col min-h-screen transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
        >
          <main className="flex-1">
            <PagesRoutes />
          </main>

          {/* Footer */}
          <footer className="w-full py-4 px-6 text-center bg-slate-900 border-t border-slate-800">
            <p className="text-slate-500 text-xs font-medium">
              2026 — Desenvolvido por Daniel Carvalho
            </p>
            <p className="text-slate-600 text-[10px] mt-0.5">Versão 3.0.0 — System Design Edition</p>
          </footer>
        </div>
      </div>
    </HomeProvider>
  );
};

export default App;
