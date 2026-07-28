import React, { useState, useEffect } from "react";
import "./App.css";
import PagesRoutes from "./Router";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";
import LoginPage from "./components/LoginPage";
import { HomeProvider } from "./Contexts/HomeContext";
import useHomeContext from "./hooks/UseHomeContext";
import handleFileUpload from "./utils/fileUploader";
import useSupabaseData from "./hooks/useSupabaseData";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AppContent = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [manualDataLoaded, setManualDataLoaded] = useState(false);

  const {
    setFile1,
    setData1,
    setFile2,
    setData2,
    data2,
    combinedData,
    combinedData_download,
    setDataSource,
    setLastUpdated,
    selectedTable,
    setSelectedTable,
    tablesList,
    setTablesList,
    user,
    isLocalMode,
    isPendingApproval,
    signOut
  } = useHomeContext();

  // Carregamento automático da nuvem (Supabase)
  const { data: cloudData, loading: cloudLoading, error: cloudError, refetch: cloudRefetch } = useSupabaseData(user ? selectedTable : null);

  // Limpar dados ao deslogar
  useEffect(() => {
    if (!user) {
      setData1([]);
      setDataSource("Sem dados");
      setLastUpdated(null);
      setManualDataLoaded(false);
    }
  }, [user, setData1, setDataSource, setLastUpdated]);

  // Alimenta data1 com os dados da nuvem, desde que o usuário não tenha feito upload manual
  useEffect(() => {
    if (user && !manualDataLoaded && cloudData && cloudData.length > 0) {
      setData1(cloudData);
      setDataSource(`Supabase (${selectedTable})`);
      const syncDate = cloudData.latestSync ? new Date(cloudData.latestSync) : new Date();
      const timeStr = syncDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = syncDate.toLocaleDateString('pt-BR');
      setLastUpdated(`${dateStr} ${timeStr}`);
    }
  }, [cloudData, manualDataLoaded, setData1, setDataSource, setLastUpdated, selectedTable, user]);

  const handleUpload = (e, setFileFunction, setDataFunction, isAppend = false) => {
    if (setDataFunction === setData1) {
      setManualDataLoaded(true); // prioriza upload manual
      const fileName = e.target.files[0]?.name || "Planilha Local";
      setDataSource(`Planilha Local (${fileName})`);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('pt-BR');
      setLastUpdated(`${dateStr} ${timeStr}`);
    }
    handleFileUpload(e, setFileFunction, setDataFunction, setLoading, setMessage, isAppend);
  };

  const downloadExcel = () => {
    if (data2.length === 0) {
      alert("Não possui planilha Service Light na base!");
      return;
    }
    const dataToExport = combinedData_download && combinedData_download.length > 0 ? combinedData_download : combinedData;
    if (dataToExport.length === 0) return;
    const worksheet = XLSX.utils.aoa_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "planilha.xlsx");
  };

  if (!user && !isLocalMode) {
    return <LoginPage />;
  }

  if (user && isPendingApproval) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md mx-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h1 className="text-white font-extrabold text-lg tracking-tight mb-1">Acesso Pendente</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-6">Tracking Online</p>
          
          <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl mb-6 text-left space-y-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Usuário Logado</p>
            <p className="text-xs text-blue-400 font-bold font-mono break-all">{user.email}</p>
          </div>

          <p className="text-slate-300 text-xs md:text-sm leading-relaxed mb-6 font-medium">
            Seu cadastro foi efetuado no sistema, mas você ainda não possui permissão para visualizar nenhuma operação.
            <br />
            <span className="text-slate-400 text-xs mt-2 block font-semibold">Entre em contato com o administrador para liberar seu acesso.</span>
          </p>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-200 font-bold py-2.5 px-4 rounded-lg text-xs border border-slate-700 transition-all duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            <span>Desconectar Conta</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App flex min-h-screen">
      <LoadingScreen />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onTabChange={setActiveTab}
        onUploadPending={(e) => handleUpload(e, setFile1, setData1)}
        onUploadCities={(e) => handleUpload(e, setFile2, setData2, true)}
        onDownload={downloadExcel}
        cloudLoading={cloudLoading}
        cloudError={cloudError}
        onCloudRefetch={() => { setManualDataLoaded(false); cloudRefetch(); }}
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        tablesList={tablesList}
        setTablesList={setTablesList}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <main className="flex-1">
          <PagesRoutes activeTab={activeTab} onTabChange={setActiveTab} />
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
  );
};

const App = () => {
  return (
    <HomeProvider>
      <AppContent />
    </HomeProvider>
  );
};

export default App;
