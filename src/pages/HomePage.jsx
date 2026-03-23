import { useState, useEffect } from "react";
import DashboardCharts from "../components/DashboardCharts";
import StatCard from "../components/StatCard";
import HeaderComponent from "../components/HeaderComponent";
import PresentationMode from "../components/PresentationMode";
import ExecutiveSummary from "../components/ExecutiveSummary";
import styled from "styled-components";
import ToggleableComponent from "../components/ToggleableComponent";
import * as XLSX from "xlsx";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Button from "@mui/material/Button";
import filters from "../utils/filters";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import handleFileUpload from "../utils/fileUploader";
import { UploadButton } from "../components/UploadButton";
import useHomeContext from "../hooks/UseHomeContext";
import BasicTabs from "../components/BasicTabs";

import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { saveAs } from "file-saver";
import DownloadIcon from "@mui/icons-material/Download";


const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => {
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(event.os);
    alert(`OS ${event.os} copiada com sucesso!`);
  };

  return (
    <div className="flex items-center justify-between text-xs overflow-hidden">
      <span className="truncate pr-1 font-semibold">{event.title}</span>
      <div
        onClick={handleCopy}
        className="cursor-pointer flex items-center p-0.5 rounded hover:bg-white/30 text-white/90 hover:text-white transition-colors"
        title="Copiar OS"
      >
        <ContentCopyIcon sx={{ fontSize: 13 }} />
      </div>
    </div>
  );
};

const HomePage = ({ activeTab, onTabChange }) => {
  const { setFile1 } = useHomeContext();
  const { setFile2 } = useHomeContext();
  const { data1, setData1 } = useHomeContext();
  const { data2, setData2 } = useHomeContext();
  const { combinedData, setCombinedData } = useHomeContext();
  const { visibleComponents, setVisibleComponents } = useHomeContext();
  const { combinedData_download, setCombinedData_download } = useHomeContext();

  const [presentationMode, setPresentationMode] = useState(false);

  const [events, setEvents] = useState([]);
  const [cityData] = useState({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [activeOrderIdsSet, setActiveOrderIdsSet] = useState(new Set());
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [inRouteOrders, setInRouteOrders] = useState([]);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const fetchActiveRoutes = async () => {
      try {
        const response = await fetch("https://smartos-olive.vercel.app/api/service-orders");
        const data = await response.json();
        setActiveRoutes(data);
      } catch (error) {
        console.error("Error fetching active routes:", error);
      }
    };
    fetchActiveRoutes();
  }, []);

  ///////////////////////////////
  const downloadExcel = (combinedData, fileName = "planilha.xlsx") => {
    // Cria uma nova planilha
    if (data2.length === 0) {
      alert("Não possui planilha Service Light na base!");
      return;
    }
    const worksheet = XLSX.utils.aoa_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    // Converte a planilha para um blob
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

    // Usa file-saver para baixar o arquivo
    saveAs(blob, fileName);
  };

  const selectSpecificColumns = (combinedData, columnsToShow) => {
    return combinedData.map((row) => {
      return columnsToShow.map((colIndex) => row[colIndex]);
    });
  };

  useEffect(() => {
    if (data1.length > 0) {
      const columnsToShow_complete_repair = [
        1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
        58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
        76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93,
        94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
        109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
        123, 124, 126, 133, 135, 142, 144, 150, 151, 152
      ];
      const columnsTo_Download = [
        1,2,9,12,14,15,16,24,25,34,37,44,45,46,55,59,61,63,66,70,72,75,79,81,84,88,90,93,97,99,102,106,108,111,115,117,120,124,126,133,135,142,144,150,151,152
      ];


      const data1SelectedCols = selectSpecificColumns(
        data1,
        columnsToShow_complete_repair
      );
      const data1SelectedCols_d = selectSpecificColumns(
        data1,
        columnsTo_Download
      );

      const headers = [
        data1[0][1],
        data1[0][2],  // Número da Ordem de Serviço
        "Nome do Cliente",
        "Cidade do Cliente",
        ...columnsTo_Download
          .slice(2)
          .map((index) => data1[0][index]),
      ];

      const headers_to_show = [
        data1[0][1], // Número da Ordem de Serviço
        "Nome do Cliente",
        "Cidade do Cliente",
        ...columnsToShow_complete_repair
          .slice(1)
          .map((index) => data1[0][index]),]

      const dataMapping = data2.slice(1).reduce((acc, row) => {
        acc[row[1]] = { nome: row[11], cidade: row[12] }; // Mapeando pelo número da ordem de serviço
        return acc;
      }, {});

      const combined = data1SelectedCols.slice(1).map((row, rowIndex) => {
        const orderId = data1[rowIndex + 1][1]; // Índice da coluna do número da ordem de serviço
        const additionalData = dataMapping[orderId] || { nome: "", cidade: "" };
        return [
          row[0], // Número da Ordem de Serviço
          additionalData.nome,
          additionalData.cidade,
          ...row.slice(1), // Outras colunas selecionadas
        ];
      });
      const combined_d = data1SelectedCols_d.slice(1).map((row, rowIndex) => {
        const orderId = data1[rowIndex + 1][1]; // Índice da coluna do número da ordem de serviço
        const additionalData = dataMapping[orderId] || { nome: "", cidade: "" };
        return [
          row[0], // Número da Ordem de Serviço
          row[1],
          additionalData.nome,
          additionalData.cidade,
          ...row.slice(2), // Outras colunas selecionadas
        ];
      });
      if (combinedData.length > 0) {
        const formattedEvents = combinedData
          .slice(1)
          .filter((row) => {
            const filterValueAI = row[34]; // Índice da coluna AI
            const filterValueN = row[13]; // Índice da coluna N
            const validValuesAI = ["II", "IH", "SH"];
            const invalidValuesN = [
              "HP035",
              "HP080",
              "HP081",
              "HPZ20",
              "HL005",
            ];

            return (
              validValuesAI.includes(filterValueAI) &&
              !invalidValuesN.includes(filterValueN)
            );
          })
          .map((row) => {
            const dateStr = row[24]; // Usando o índice da coluna para a data (Y)
            const date = moment(dateStr, "DD/MM/YYYY").toDate(); // Converter para data usando moment
            const isValidDate = !isNaN(date);
            const startDate = isValidDate
              ? date
              : moment.utc(dateStr, "YYYY-MM-DD").toDate();

            // Adicionar os valores das colunas L e M da segunda planilha se disponível


            return {
              title: `${row[0]} - ${row[2]} - ${row[14]} - ${row[37]}`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
              start: startDate,
              end: startDate,
              type: row[34], // Armazenar o tipo para usar no eventPropGetter
              os: row[0],
              allDay: true,
            };
          });

        setEvents(formattedEvents);
      } else {
        const formattedEvents = data1
          .slice(1)
          .filter((row) => {
            const filterValueAI = row[34]; // Índice da coluna AI
            const filterValueN = row[13]; // Índice da coluna N
            const validValuesAI = ["II", "IH", "SH"];
            const invalidValuesN = [
              "HP035",
              "HP080",
              "HP081",
              "HPZ20",
              "HL005",
            ];

            return (
              validValuesAI.includes(filterValueAI) &&
              !invalidValuesN.includes(filterValueN)
            );
          })
          .map((row) => {
            const dateStr = row[24]; // Usando o índice da coluna para a data (Y)
            const date = moment(dateStr, "DD/MM/YYYY").toDate(); // Converter para data usando moment

            const isValidDate = !isNaN(date);
            const startDate = isValidDate
              ? date
              : moment.utc(dateStr, "YYYY-MM-DD").toDate();

            // Adicionar os valores das colunas L e M da segunda planilha se disponível
            const cityInfo = cityData[row[2]] || {
              city: "",
              additionalInfo: "",
            };

            return {
              title: `${row[1]}  ${cityInfo.city ? ` - ${cityInfo.city}` : ""}${cityInfo.additionalInfo ? ` - ${cityInfo.additionalInfo}` : ""
                }`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
              start: startDate,
              end: startDate,
              type: row[34], // Armazenar o tipo para usar no eventPropGetter
              os: row[1],
              allDay: true,
            };
          });
        setEvents(formattedEvents);
      }
      setCombinedData_download([headers, ...combined_d]);
      setCombinedData([headers_to_show, ...combined]);

      const activeOrderIds = new Set();
      activeRoutes.forEach(route => {
        route.stops?.forEach(stop => {
          if (stop.serviceOrder) activeOrderIds.add(String(stop.serviceOrder).trim());
          if (stop.ascJobNumber) activeOrderIds.add(String(stop.ascJobNumber).trim());
        });
        route.serviceOrders?.forEach(order => {
          if (order.serviceOrderNumber) activeOrderIds.add(String(order.serviceOrderNumber).trim());
        });
      });

      const inRoute = data1.slice(1).filter((row) => {
        const orderId1 = String(row[1] || "").trim();
        const orderId2 = String(row[2] || "").trim();
        return activeOrderIds.has(orderId1) || activeOrderIds.has(orderId2);
      });
      setInRouteOrders(inRoute);
      setActiveOrderIdsSet(activeOrderIds);

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data1, data2, cityData, events, activeRoutes]);

  /////////////////////////////////

  const handleFileUpload_beta = (e, setFileFunction, setDataFunction) => {
    handleFileUpload(
      e,
      setFileFunction,
      setDataFunction,
      setLoading,
      setMessage
    );
  };

  const toggleVisibility = (id) => {
    setVisibleComponents((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const eventPropGetter = (event) => {
    let className = "";
    switch (event.type) {
      case "II":
        className = "ii-event";
        break;
      case "IH":
        className = "ih-event";
        break;
      case "SH":
        className = "sh-event";
        break;
      default:
        break;
    }
    return { className };
  };

  const columnsToShow = [0, 1, 2, 9, 14, 15, 24, 61, 37];
  const columnsToShow_FTF = [0, 1, 2, 9, 14, 15, 24, 34, 61, 37];

  const columnsToShow_RC = [0, 3, 1, 2, 9, 14, 15, 16, 61, 130, 131, 132];


  const columnsToShow_intoogle = [0, 1, 2, 9, 14, 15, 37, 22, 24, 61];
  const columnsToShow_complete_repair = [
    0, 1, 2, 9, 14, 15, 37, 22, 34, 24, 27,
  ];
  const columnsToShow_type_service = [0, 1, 2, 9, 14, 15, 37, 22, 34];

  // Função para ordenar as linhas com base na coluna 15 (índice 14)
  const sortData = (filteredData) => {
    return filteredData.sort((a, b) => {
      const valA = a[15]; //15 ->16
      const valB = b[15];
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });
  };

  const planilha_LTP_IH_VD_LP = sortData(
    combinedData.slice(1).filter(filters.filter_VD_LTP_LP)
  );
  const planilha_EX_LTP_IH_VD_LP = sortData(
    combinedData.slice(1).filter(filters.filter_VD_EX_LTP_LP)
  );
  const planilha_LTP_IH_RAC_REF_LP = sortData(
    combinedData.slice(1).filter(filters.filter_REF_RAC_LTP_LP)
  );
  const planilha_EX_LTP_IH_RAC_REF_LP = sortData(
    combinedData.slice(1).filter(filters.filter_REF_RAC_EX_LTP_LP)
  );
  const planilha_LTP_IH_WSM_LP = sortData(
    combinedData.slice(1).filter(filters.filter_WSM_LP_LTP)
  );
  const filteredAndSortedData4 = sortData(
    combinedData.slice(1).filter(filters.filter_DA_noParts)
  );
  const filteredAndSortedData5 = sortData(
    combinedData.slice(1).filter(filters.filter_allNext_LTP)
  );
  const filteredAndSortedData6 = sortData(
    combinedData.slice(1).filter(filters.filter_isEffect_LP)
  );
  const filteredAndSortedData9 = sortData(
    combinedData.slice(1).filter(filters.filter_CI_VD_LTP_LP)
  );
  const filteredAndSortedData10 = sortData(
    combinedData.slice(1).filter(filters.filter_CI_MX_LTP_LP)
  );
  const filteredAndSortedData11 = sortData(
    combinedData.slice(1).filter(filters.filter_Customer_outdated)
  );
  const filteredAndSortedData12 = sortData(
    combinedData.slice(1).filter(filters.filter_repair_complete_outdated)
  );
  const filteredAndSortedData13 = sortData(
    combinedData.slice(1).filter(filters.filter_near_isEffect_LP)
  );
  const filteredAndSortedData14 = sortData(
    combinedData.slice(1).filter(filters.filter_next_isEffect_LP)
  );
  const filteredAndSortedData15 = sortData(
    combinedData.slice(1).filter(filters.filter_potential_first_visit)
  );
  const filteredAndSortedData16 = sortData(
    combinedData.slice(1).filter(filters.filter_agenda_today)
  );
  const filteredAndSortedData17 = sortData(
    combinedData.slice(1).filter(filters.filter_agenda_tomorrow)
  );
  const filteredAndSortedData7 = sortData(
    combinedData.slice(1).filter(filters.all_lp_vd)
  );
  const filteredAndSortedData8 = sortData(
    combinedData.slice(1).filter(filters.all_lp_DA)
  );

  const planilha_CI_Complete_LP = sortData(
    combinedData.slice(1).filter(filters.filter_CI_COMPLETE_LP)
  );

  const planilha_CI_Complete_OW_X09 = sortData(
    combinedData.slice(1).filter(filters.filter_CI_COMPLETE_OW_X09)
  );

  const planilha_CI_Complete_OW_NOT_X09 = sortData(
    combinedData.slice(1).filter(filters.filter_CI_COMPLETE_OW_NOT_X09)
  );

  const planilha_ALL_DA_OW = sortData(
    combinedData.slice(1).filter(filters.all_DA_OW)
  );

  const planilha_FTF = sortData(
    combinedData.slice(1).filter(filters.filter_FTF)
  );

  const planilha_FTF_Backlog_IH = combinedData.slice(1).filter(filters.filter_FTF_Backlog_IH);
  const ftfBacklogReasonCounts = planilha_FTF_Backlog_IH.reduce((acc, row) => {
    const reason = row[14] || "N/A";
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  const ftfBacklogReasonEntries = Object.entries(ftfBacklogReasonCounts).sort((a, b) => b[1] - a[1]);
  const ftfBacklogMax = ftfBacklogReasonEntries.length > 0 ? ftfBacklogReasonEntries[0][1] : 1;


  const quantity_ALL_DA_OW = planilha_ALL_DA_OW.length;
  const quantity_FTF = planilha_FTF.length;
  const quantity_DA_noParts = filteredAndSortedData4.length;
  const quantity_LTP_VD = planilha_LTP_IH_VD_LP.length;
  const quantity_EX_LTP_VD = planilha_EX_LTP_IH_VD_LP.length;

  const quantity_LTP_RAC_REF = planilha_LTP_IH_RAC_REF_LP.length;
  const quantity_EX_LTP_RAC_REF = planilha_EX_LTP_IH_RAC_REF_LP.length;

  const quantity_LTP_WSM = planilha_LTP_IH_WSM_LP.length;
  const quantity_LTP_VD_CI = filteredAndSortedData9.length;
  const quantity_LTP_MX_CI = filteredAndSortedData10.length;
  const quantity_Oudated_IH = filteredAndSortedData11.length;
  const quantity_Oudated_Repair_complete_IH = filteredAndSortedData12.length;
  const quantity_POTENTIAL_first_visit = filteredAndSortedData15.length;
  const quantity_agenda_today = filteredAndSortedData16.length;
  const quantity_agenda_tomorrow = filteredAndSortedData17.length;
  const quantityDa = filteredAndSortedData8.length;
  const midVar = combinedData.slice(1).filter(filters.all_lp_vd);
  const midVar2 = combinedData.slice(1).filter(filters.all_lp_DA);

  const matches = filteredAndSortedData7.length;
  const sum = midVar.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average = matches > 0 ? sum / matches : 0;

  const matches2 = filteredAndSortedData8.length;
  const sum2 = midVar2.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average2 = matches2 > 0 ? sum2 / matches2 : 0;

  // Base totals for percentage calculations (IH + LP only)
  const baseVD = combinedData.slice(1).filter(filters.all_lp_AV).length;
  const baseDA = matches2; // all_lp_DA already computed
  const pctLtpVd = baseVD > 0 ? ((quantity_LTP_VD / baseVD) * 100).toFixed(1) : null;
  const pctExLtpVd = baseVD > 0 ? ((quantity_EX_LTP_VD / baseVD) * 100).toFixed(1) : null;
  const pctLtpRacRef = baseDA > 0 ? ((quantity_LTP_RAC_REF / baseDA) * 100).toFixed(1) : null;
  const pctExLtpRacRef = baseDA > 0 ? ((quantity_EX_LTP_RAC_REF / baseDA) * 100).toFixed(1) : null;
  const pctLtpWsm = baseDA > 0 ? ((quantity_LTP_WSM / baseDA) * 100).toFixed(1) : null;

  const quantity_complete_CI_LP = planilha_CI_Complete_LP.length;
  const quantity_complete_CI_OW_X09 = planilha_CI_Complete_OW_X09.length;
  const quantity_complete_CI_OW_NOT_X09 = planilha_CI_Complete_OW_NOT_X09.length;

  const eventCounts = React.useMemo(() => {
    const counts = {};
    events.forEach((event) => {
      const dateKey = moment(event.start).format("YYYY-MM-DD");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [events]);

  const components = React.useMemo(
    () => ({
      event: CustomEvent,
      month: {
        dateHeader: ({ date, label, onDrillDown }) => {
          const dateKey = moment(date).format("YYYY-MM-DD");
          const count = eventCounts[dateKey] || 0;
          return (
            <div className="flex items-center justify-between mx-2 mt-1 pb-1">
              {count > 0 ? (
                <div
                  className="flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-md shadow-sm"
                  title="Quantidade de eventos"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-blue-400">Qtd:</span>
                  <span className="text-xs font-bold">{count}</span>
                </div>
              ) : (
                <span></span>
              )}
              <button
                onClick={onDrillDown}
                className="text-sm font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-2 py-0.5 rounded transition-all"
                title="Ver dia"
              >
                {label}
              </button>
            </div>
          );
        },
      },
    }),
    [eventCounts]
  );

  const renderBadge = (cellValue) => {
    if (typeof cellValue !== 'string') return cellValue;
    const val = cellValue.trim().toUpperCase();
    
    const badges = {
      'VD': 'bg-blue-100 text-blue-800',
      'LP': 'bg-fuchsia-100 text-fuchsia-800',
      'OW': 'bg-orange-100 text-orange-800',
      'LTP': 'bg-slate-800 text-white',
      'EX LTP': 'bg-yellow-100 text-yellow-800',
      'DA': 'bg-red-100 text-red-800',
      'CI': 'bg-indigo-100 text-indigo-800'
    };
    
    if (badges[val]) {
      return <span className={"px-2.5 py-1 rounded-full text-xs font-bold tracking-wide " + badges[val]}>{val}</span>;
    }
    return cellValue;
  };

  const renderRow = (row, rowIndex, columns) => {
    const os1 = String(row[0] || "").trim();
    const os2 = String(row[1] || "").trim();
    const os3 = String(row[2] || "").trim();
    const isEmRota = activeOrderIdsSet?.has(os1) || activeOrderIdsSet?.has(os2) || activeOrderIdsSet?.has(os3);
    
    return (
      <tr key={rowIndex} className={isEmRota ? 'bg-green-100 hover:bg-green-200 transition-colors border-l-4 border-green-500' : ''}>
        {columns.map((colIndex) => (
          <td key={colIndex}>{renderBadge(row[colIndex])}</td>
        ))}
      </tr>
    );
  };

  return (
    <MainContainer>
      {presentationMode && (
        <PresentationMode
          onExit={() => setPresentationMode(false)}
          metrics={{
            quantity_LTP_VD,
            quantity_EX_LTP_VD,
            quantity_LTP_RAC_REF,
            quantity_EX_LTP_RAC_REF,
            quantity_LTP_WSM,
            quantity_LTP_VD_CI,
            quantity_LTP_MX_CI,
            inRouteCount: inRouteOrders?.length || 0,
            rtatVd: average?.toFixed(2) || 0,
            rtatDa: average2?.toFixed(2) || 0,
            totalAllDaLp: quantityDa || 0,
            totalAllVdLp: matches || 0,
            quantity_DA_noParts,
            quantity_Oudated_IH,
            quantity_Oudated_Repair_complete_IH,
            quantity_agenda_today,
            quantity_agenda_tomorrow,
            quantity_POTENTIAL_first_visit,
            totalDa: quantityDa || 0,
          }}
        />
      )}
      <HeaderComponent
        presentationMode={presentationMode}
        onTogglePresentation={() => setPresentationMode(!presentationMode)}
        dataLoaded={combinedData.length > 1}
      />

      {/* Executive Summary */}
      {combinedData.length > 1 && (
        <div className="max-w-screen-2xl mx-auto px-4 pb-4">
          <ExecutiveSummary
            metrics={{
              totalLtpAll: (quantity_LTP_VD || 0) + (quantity_EX_LTP_VD || 0) + (quantity_LTP_RAC_REF || 0) + (quantity_EX_LTP_RAC_REF || 0) + (quantity_LTP_WSM || 0),
              totalBase: (matches || 0) + (quantityDa || 0),
              pctPenetration: ((matches || 0) + (quantityDa || 0)) > 0 ? (((quantity_LTP_VD || 0) + (quantity_EX_LTP_VD || 0) + (quantity_LTP_RAC_REF || 0) + (quantity_EX_LTP_RAC_REF || 0) + (quantity_LTP_WSM || 0)) / ((matches || 0) + (quantityDa || 0)) * 100).toFixed(1) : '0.0',
              inRouteCount: inRouteOrders?.length || 0,
              rtatVd: average?.toFixed(2) || 0,
              rtatDa: average2?.toFixed(2) || 0,
              overdueCount: quantity_Oudated_IH || 0,
              daNoParts: quantity_DA_noParts || 0,
              agendaToday: quantity_agenda_today || 0,
            }}
          />
        </div>
      )}
      {/* <UploadBoxMenu ... /> */}
      <IndicatorsWrapper>
        <StatCard type={average.toFixed(2) > 3.8 ? "high" : (average.toFixed(2) > 3 ? "mid" : "normal")} title="RTAT VD" value={average.toFixed(2)} />
        <StatCard type={average2.toFixed(2) > 4.5 ? "high" : (average2.toFixed(2) > 3.8 ? "mid" : "normal")} title="RTAT DA" value={average2.toFixed(2)} />
        {loading && <p className="text-xs text-slate-400">Carregando...</p>}
        {message && <p className="text-xs text-slate-400">{message}</p>}
      </IndicatorsWrapper>


      <BasicTabs activeTab={activeTab} onTabChange={onTabChange}>
        <Dashboard>
          <StatCard title="LTP VD IH" value={quantity_LTP_VD} percentage={pctLtpVd} onClick={() => toggleVisibility(1)} isActive={visibleComponents[1]} iconName="Activity" />
          <StatCard title="EX LTP VD IH" value={quantity_EX_LTP_VD} percentage={pctExLtpVd} onClick={() => toggleVisibility(21)} isActive={visibleComponents[21]} iconName="Activity" />
          <StatCard title="Ordens Em Rota" value={inRouteOrders.length || 0} onClick={() => toggleVisibility(40)} isActive={visibleComponents[40]} iconName="Truck" />
          <StatCard title="LTP REF/RAC IH" value={quantity_LTP_RAC_REF} percentage={pctLtpRacRef} onClick={() => toggleVisibility(2)} isActive={visibleComponents[2]} iconName="Activity" />
          <StatCard title="EX-LTP REF/RAC" value={quantity_EX_LTP_RAC_REF} percentage={pctExLtpRacRef} onClick={() => toggleVisibility(20)} isActive={visibleComponents[20]} iconName="Activity" />
          <StatCard title="LTP WSM/HKE" value={quantity_LTP_WSM} percentage={pctLtpWsm} onClick={() => toggleVisibility(3)} isActive={visibleComponents[3]} iconName="Activity" />
          <StatCard title="LTP VD CI" value={quantity_LTP_VD_CI} onClick={() => toggleVisibility(4)} isActive={visibleComponents[4]} type="CI" iconName="Activity" />
          <StatCard title="LTP MX CI" value={quantity_LTP_MX_CI} onClick={() => toggleVisibility(5)} isActive={visibleComponents[5]} type="CI" iconName="Activity" />
          <StatCard title="FTF (ST025)" value={quantity_FTF} onClick={() => toggleVisibility(60)} isActive={visibleComponents[60]} iconName="CheckCircle" />

        </Dashboard>
        <Dashboard>
          <StatCard title="TODOS DA LP" value={quantityDa} onClick={() => toggleVisibility(31)} isActive={visibleComponents[31]} />

          <StatCard title="TODOS DA OW" value={quantity_ALL_DA_OW} onClick={() => toggleVisibility(51)} isActive={visibleComponents[51]} />

          <StatCard title="DA Sem Peça (OW/LP)" value={quantity_DA_noParts} onClick={() => toggleVisibility(6)} isActive={visibleComponents[6]} />
          <StatCard title="Consumidor Fora do Prazo" value={quantity_Oudated_IH} onClick={() => toggleVisibility(8)} isActive={visibleComponents[8]} />
          <StatCard title="R. Completo Fora do Prazo" value={quantity_Oudated_Repair_complete_IH} onClick={() => toggleVisibility(9)} isActive={visibleComponents[9]} iconName="CheckCircle" />

          <StatCard title="CI R. Completo LP" value={quantity_complete_CI_LP} onClick={() => toggleVisibility(32)} isActive={visibleComponents[32]} type="CI" iconName="CheckCircle" />


          <StatCard title="CI R. Completo OW - X09" value={quantity_complete_CI_OW_X09} onClick={() => toggleVisibility(33)} isActive={visibleComponents[33]} type="CI" iconName="CheckCircle" />



          <StatCard title="CI R. Completo OW" value={quantity_complete_CI_OW_NOT_X09} onClick={() => toggleVisibility(34)} isActive={visibleComponents[34]} type="CI" iconName="CheckCircle" />

          <StatCard title="LTP IH Em até 4 dias" value={0} onClick={() => toggleVisibility(7)} isActive={visibleComponents[7]} type="normal" />
          <StatCard title="Effect Appointment" value={0} onClick={() => toggleVisibility(10)} isActive={visibleComponents[10]} type="normal" />
          <StatCard title="First Visit - Aguardando" value={quantity_POTENTIAL_first_visit} onClick={() => toggleVisibility(11)} isActive={visibleComponents[11]} type="normal" />
          <StatCard title="Agenda do Dia" value={quantity_agenda_today} onClick={() => toggleVisibility(12)} isActive={visibleComponents[12]} iconName="Calendar" />
          <StatCard title="Agenda de Amanhã" value={quantity_agenda_tomorrow} onClick={() => toggleVisibility(13)} isActive={visibleComponents[13]} iconName="Calendar" />
        </Dashboard>
        
      <DashboardCharts
        dataLtpVd={quantity_LTP_VD || 0}
        dataExLtpVd={quantity_EX_LTP_VD || 0}
        dataLtpRacRef={quantity_LTP_RAC_REF || 0}
        dataExLtpRacRef={quantity_EX_LTP_RAC_REF || 0}
        dataLtpWsm={quantity_LTP_WSM || 0}
        dataDaOudated={quantity_Oudated_IH || 0}
        dataDaCompleteOudated={quantity_Oudated_Repair_complete_IH || 0}
        dataAgendaToday={quantity_agenda_today || 0}
        dataAgendaTomorrow={quantity_agenda_tomorrow || 0}
        rtatVd={average?.toFixed(2) || 0}
        rtatDa={average2?.toFixed(2) || 0}
        totalDa={quantityDa || 0}
        daNoParts={quantity_DA_noParts || 0}
        inRoute={inRouteOrders?.length || 0}
        firstVisitWait={quantity_POTENTIAL_first_visit || 0}
        totalAllDaLp={quantityDa || 0}
        totalAllVdLp={matches || 0}
        backlogReasonData={ftfBacklogReasonEntries}
        backlogRawData={planilha_FTF_Backlog_IH}
        backlogHeaders={combinedData[0] || []}
      />
      <CalendarContainer>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 650 }}
            eventPropGetter={eventPropGetter}
            components={components}
            popup
          />
        </CalendarContainer>
      </BasicTabs>

      {
        combinedData.length > 0 && (
          <>
            <SubMenuSection>
              <h1>Planilhas</h1>
              <div className="divider"></div>
            </SubMenuSection>
            <ToggleableComponent isVisible={visibleComponents[1]}>
              <h2>EM LTP DTV </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_LTP_IH_VD_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[40]}>
              <h2>ORDENS EM ROTA</h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{data1[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inRouteOrders.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[31]}>
              <h2>Todos DA LP </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData8.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>

            <ToggleableComponent isVisible={visibleComponents[51]}>
              <h2>Todos DA OW</h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_ALL_DA_OW.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>

            <ToggleableComponent isVisible={visibleComponents[32]}>
              <h2>Todos LP EM REPARO COMPLETO </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow_RC.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_CI_Complete_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_RC))}
                </tbody>
              </table>
            </ToggleableComponent>


            <ToggleableComponent isVisible={visibleComponents[33]}>
              <h2>Todos OW EM REPARO COMPLETO X09 </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow_RC.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_CI_Complete_OW_X09.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_RC))}
                </tbody>
              </table>
            </ToggleableComponent>


            <ToggleableComponent isVisible={visibleComponents[34]}>
              <h2>Todos OW EM REPARO COMPLETO </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow_RC.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_CI_Complete_OW_NOT_X09.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_RC))}
                </tbody>
              </table>
            </ToggleableComponent>

            <ToggleableComponent isVisible={visibleComponents[21]}>
              <h2>EM EX LTP DTV </h2>
              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_EX_LTP_IH_VD_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>

            <ToggleableComponent isVisible={visibleComponents[2]}>
              <h2> EM LTP RAC/REF</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_LTP_IH_RAC_REF_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[20]}>
              <h2> EM EX-LTP RAC/REF</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_EX_LTP_IH_RAC_REF_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[3]}>
              <h2>EM LTP WSM</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_LTP_IH_WSM_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[4]}>
              <h2>EM LTP DTV CI</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData9.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[5]}>
              <h2>EM LTP MX CI</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData10.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[6]}>
              <h2>DA OW e LP sem peças</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData4.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_intoogle))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[7]}>
              <h2>Próximos casos a entrar em LTP - superior a 3 dias</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData5.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_intoogle))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[8]}>
              <h2>Consumidor fora do prazo de todos os serviços</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_type_service.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData11.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_type_service))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[9]}>
              <h2>Reparo completo fora do prazo de todos os serviços</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData12.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_complete_repair))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[11]}>
              <h2>Reparo completo do dia que deu entrada hoje mesmo</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData15.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_complete_repair))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[10]}>
              <h2>Effect Appointment</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData6.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_intoogle))}
                </tbody>
              </table>
              <h2>Effect Appointment - Corrija estas datas para bater</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData13.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_intoogle))}
                </tbody>
              </table>
              <h2>Effect Appointment - Corrija estas datas para bater</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData14.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_intoogle))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[12]}>
              <h2>Agenda do Dia</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData16.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_complete_repair))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[13]}>
              <h2>Agenda de amanhã</h2>
              <table>
                <thead>
                  <tr>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedData17.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_complete_repair))}
                </tbody>
              </table>
            </ToggleableComponent>
            <ToggleableComponent isVisible={visibleComponents[60]}>
              <h2>FTF — Status Code ST025</h2>

              <table className="toggleDiv">
                <thead>
                  <tr>
                    {columnsToShow_FTF.map((colIndex) => (
                      <th key={colIndex}>{combinedData[0][colIndex]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planilha_FTF.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_FTF))}
                </tbody>
              </table>
            </ToggleableComponent>
          </>
        )
      }
    </MainContainer >
  );
};

const CalendarContainer = styled.div`
  padding: 24px;
  width: 95%;
  max-width: 1600px;
  margin: 20px auto;
  background-color: #ffffff;
  border-radius: 16px;
  /* box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); */
`;
const UploadBox = styled.div`
  display: flex;
  margin: 10px 20px;
  align-items: center;
  justify-content: space-between;
  width: calc(100% - 40px);
  p {
    margin-left: 5px;
  }
`;

const IndicatorsWrapper = styled.div`
  display: flex !important;
  flex-direction: row !important;
  gap: 15px;
  margin-left: auto;
  align-items: center;
`;








const SubMenuSection = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: start;
  .divider {
    height: 2px;
    width: 100%;
    background-color: #5a5a5a;
    margin: 5px 0px;
  }
  margin: 0px 10px;
  font-weight: 500;
  font-size: 20px;
`;
const Dashboard = styled.div`
  /* width: 100vh; */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  /* justify-content: space-around; */
  margin: 10px;
  padding: 10px;
  gap: 20px;
  /* border: 2px; */
  /* border-style: solid; */
`;
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;

  h2 {
    font-weight: 900;
  }
`;


export default HomePage;
