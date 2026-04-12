import React, { useState } from "react";
import "./App.css";
import PagesRoutes from "./Router";
import Sidebar from "./components/Sidebar";
import LoadingScreen from "./components/LoadingScreen";
import { HomeProvider } from "./Contexts/HomeContext";
import useHomeContext from "./hooks/UseHomeContext";
import handleFileUpload from "./utils/fileUploader";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AppContent = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const { setFile1, setData1, setFile2, setData2, data2, combinedData, combinedData_download } = useHomeContext();

  const handleUpload = (e, setFileFunction, setDataFunction, isAppend = false) => {
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
