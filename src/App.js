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
    isLocalMode
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
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = now.toLocaleDateString('pt-BR');
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
