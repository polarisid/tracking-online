import React, { useState, useEffect } from "react";
import DashboardCharts from "../components/DashboardCharts";
import StatCard from "../components/StatCard";
import HeaderComponent from "../components/HeaderComponent";
import PresentationMode from "../components/PresentationMode";
import * as XLSX from "xlsx";
import styled, { keyframes } from "styled-components";
import ToggleableComponent from "../components/ToggleableComponent";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import filters from "../utils/filters";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const HomePage = () => {
  const useToggle = (initialState) => {
    const [toggleValue, setToggleValue] = useState(initialState);

    const toggler = () => {
      setToggleValue(!toggleValue);
    };
    return [toggleValue, toggler];
  };

  const useToggle1 = (initialState) => {
    const [toggleValue1, setToggleValue1] = useState(initialState);

    const toggler1 = () => {
      setToggleValue1(!toggleValue1);
    };
    return [toggleValue1, toggler1];
  };

  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);

  const [events, setEvents] = useState([]);
  const [cityData, setCityData] = useState({});

  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [visibleComponents, setVisibleComponents] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
    13: false,
    14: false,
    20:false,
    21:false,
    31:false,
    32:false,
    33: false,
    34:false,
    16: false,
    17: false,
    40: false,

  });

  const [activeOrderIdsSet, setActiveOrderIdsSet] = useState(new Set());
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [inRouteOrders, setInRouteOrders] = useState([]);
  const [presentationMode, setPresentationMode] = useState(false);

  useEffect(() => {
    const fetchActiveRoutes = async () => {
      try {
        const response = await fetch("https://smartos-olive.vercel.app/api/service-orders");
        const json = await response.json();
        setActiveRoutes(json);
      } catch (error) {
        console.error("Error fetching active routes:", error);
      }
    };
    fetchActiveRoutes();
  }, []);

  const toggleVisibility = (id) => {
    setVisibleComponents((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    setLoading(true);
    setMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Função para verificar se um valor é uma data válida
      const isValidDate = (d) => {
        return d instanceof Date && !isNaN(d);
      };

      // Função para converter números em datas
      const convertToDate = (value) => {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
          return new Date(Date.UTC(date.y, date.m - 1, date.d));
        }
        return null;
      };

      // Colunas que sabemos que devem conter datas
      const dateColumns = [16, 22, 24, 27,130,150, 151];

      // Formatar as datas corretamente apenas nas colunas especificadas
      const formattedData = sheetData.map((row) =>
        row.map((cell, index) => {
          if (dateColumns.includes(index) && typeof cell === "number") {
            const date = convertToDate(cell);
            if (isValidDate(date)) {
              const day = String(date.getUTCDate()).padStart(2, "0");
              const month = String(date.getUTCMonth() + 1).padStart(2, "0");
              const year = date.getUTCFullYear();

              // console.log(`${month}/${day}/${year}`);
              // return `${day}/${month}/${year}`;
              return `${month}/${day}/${year}`;
            }
          }
          return cell;
        })
      );

      setData(formattedData);
      setLoading(false);
      setMessage("Carregamento completo!");
    };

    reader.onerror = () => {
      setLoading(false);
      setMessage("Error reading file!");
    };

    reader.readAsBinaryString(uploadedFile);
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

  useEffect(() => {
    if (data.length > 0) {
      const formattedEvents = data
        .slice(1)
        .filter((row) => {
          const filterValueAI = row[34]; // Índice da coluna AI
          const filterValueN = row[13]; // Índice da coluna N
          const validValuesAI = ["II", "IH", "SH"];
          const invalidValuesN = ["HP035", "HP080", "HP081", "HPZ20", "HL005"];

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
          const orderId = row[1]; // Índice da coluna B

          // Adicionar os valores das colunas L e M da segunda planilha se disponível
          const cityInfo = cityData[orderId] || {
            city: "",
            additionalInfo: "",
          };

          return {
            title: `${row[1]}${cityInfo.city ? ` - ${cityInfo.city}` : ""}${
              cityInfo.additionalInfo ? ` - ${cityInfo.additionalInfo}` : ""
            }`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
            start: startDate,
            end: startDate,
            type: row[34], // Armazenar o tipo para usar no eventPropGetter
          };
        });

      setEvents(formattedEvents);
    }
    
    // Process active routes mapping
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

    const inRoute = data.slice(1).filter((row) => {
      const orderId1 = String(row[1] || "").trim();
      const orderId2 = String(row[2] || "").trim();
      return activeOrderIds.has(orderId1) || activeOrderIds.has(orderId2);
    });
    setInRouteOrders(inRoute);
    setActiveOrderIdsSet(activeOrderIds);
    
  }, [data, cityData, activeRoutes]);

  // Índices das colunas que queremos exibir (baseado em zero)
  const columnsToShow = [1, 9, 14, 15, 24, 61];
  const columnsToShow_intoogle = [1, 9, 14, 15, 37, 22, 24, 61];
  const columnsToShow_complete_repair = [1, 9, 14, 15, 37, 22, 34, 24, 27];
  const columnsToShow_type_service = [1, 9, 14, 15, 37, 22, 34];

  // Função para ordenar as linhas com base na coluna 15 (índice 14)
  const sortData = (filteredData) => {
    return filteredData.sort((a, b) => {
      const valA = a[15];
      const valB = b[15];
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });
  };

  const planilha_LTP_IH_VD_LP = sortData(
    data.slice(1).filter(filters.filter_VD_LTP_LP)
  );
  const planilha_EX_LTP_IH_VD_LP = sortData(
    data.slice(1).filter(filters.filter_VD_EX_LTP_LP)
  );
  const planilha_LTP_IH_RAC_REF_LP = sortData(
    data.slice(1).filter(filters.filter_REF_RAC_LTP_LP)
  );
  const planilha_EX_LTP_IH_RAC_REF_LP = sortData(
    data.slice(1).filter(filters.filter_REF_RAC_EX_LTP_LP)
  );
  const planilha_LTP_IH_WSM_LP = sortData(
    data.slice(1).filter(filters.filter_WSM_LP_LTP)
  );
  const filteredAndSortedData4 = sortData(
    data.slice(1).filter(filters.filter_DA_noParts)
  );
  const filteredAndSortedData5 = sortData(
    data.slice(1).filter(filters.filter_allNext_LTP)
  );
  const filteredAndSortedData6 = sortData(
    data.slice(1).filter(filters.filter_isEffect_LP)
  );
  const filteredAndSortedData9 = sortData(
    data.slice(1).filter(filters.filter_CI_VD_LTP_LP)
  );
  const filteredAndSortedData10 = sortData(
    data.slice(1).filter(filters.filter_CI_MX_LTP_LP)
  );
  const filteredAndSortedData11 = sortData(
    data.slice(1).filter(filters.filter_Customer_outdated)
  );
  const filteredAndSortedData12 = sortData(
    data.slice(1).filter(filters.filter_repair_complete_outdated)
  );
  const filteredAndSortedData13 = sortData(
    data.slice(1).filter(filters.filter_near_isEffect_LP)
  );
  const filteredAndSortedData14 = sortData(
    data.slice(1).filter(filters.filter_next_isEffect_LP)
  );
  const filteredAndSortedData15 = sortData(
    data.slice(1).filter(filters.filter_potential_first_visit)
  );
  const filteredAndSortedData16 = sortData(
    data.slice(1).filter(filters.filter_agenda_today)
  );
  const filteredAndSortedData17 = sortData(
    data.slice(1).filter(filters.filter_agenda_tomorrow)
  );

  const planilha_CI_Complete_LP = sortData(
    data.slice(1).filter(filters.filter_CI_COMPLETE_LP)
  );

  const planilha_CI_Complete_OW_X09= sortData(
    data.slice(1).filter(filters.filter_CI_COMPLETE_OW_X09)
  );

  const planilha_CI_Complete_OW_NOT_X09= sortData(
    data.slice(1).filter(filters.filter_CI_COMPLETE_OW_NOT_X09)
  );


  const allLpDAPlanilha = sortData( data.slice(1).filter(filters.all_lp_DA));


  const quantity_DA_noParts = filteredAndSortedData4.length;
  const quantity_LTP_VD = planilha_LTP_IH_VD_LP.length;
  const quantity_LTP_RAC_REF = planilha_LTP_IH_RAC_REF_LP.length;
  const quantityDA = allLpDAPlanilha.length;

  const quantity_EX_LTP_RAC_REF = planilha_EX_LTP_IH_RAC_REF_LP.length;

  const quantity_LTP_WSM = planilha_LTP_IH_WSM_LP.length;
  const quantity_LTP_VD_CI = filteredAndSortedData9.length;
  const quantity_LTP_MX_CI = filteredAndSortedData10.length;
  const quantity_Oudated_IH = filteredAndSortedData11.length;
  const quantity_Oudated_Repair_complete_IH = filteredAndSortedData12.length;
  const quantity_POTENTIAL_first_visit = filteredAndSortedData15.length;
  const quantity_agenda_today = filteredAndSortedData16.length;
  const quantity_agenda_tomorrow = filteredAndSortedData17.length;

  const quantity_complete_CI_LP= planilha_CI_Complete_LP.length;
  const quantity_complete_CI_OW_X09= planilha_CI_Complete_OW_X09.length;
  const quantity_complete_CI_OW_NOT_X09= planilha_CI_Complete_OW_NOT_X09.length;


  const filteredAndSortedData7 = sortData(
    data.slice(1).filter(filters.all_lp_vd)
  );
  const filteredAndSortedData8 = sortData(
    data.slice(1).filter(filters.all_lp_DA)
  );

  const midVar = data.slice(1).filter(filters.all_lp_vd);
  const midVar2 = data.slice(1).filter(filters.all_lp_DA);

  const matches = filteredAndSortedData7.length;
  const sum = midVar.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average = matches > 0 ? sum / matches : 0;

  const matches2 = filteredAndSortedData8.length;
  const sum2 = midVar2.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average2 = matches2 > 0 ? sum2 / matches2 : 0;

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
            totalAllDaLp: quantityDA || 0,
            totalAllVdLp: matches || 0,
            quantity_DA_noParts,
            quantity_Oudated_IH,
            quantity_Oudated_Repair_complete_IH,
            quantity_agenda_today,
            quantity_agenda_tomorrow,
            quantity_POTENTIAL_first_visit,
            totalDa: quantityDA || 0,
          }}
        />
      )}
      <HeaderComponent
        presentationMode={presentationMode}
        onTogglePresentation={() => setPresentationMode(!presentationMode)}
      />

      <UploadBox>
        <CalendarBox>
          <Button
            onClick={() => toggleVisibility(14)}
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
          >
            Calendário
          </Button>
        </CalendarBox>
        <ButtonUpload
          component="label"
          loading={loading}
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
        >
          <p> Carregar Planilha</p>
          <VisuallyHiddenInput type="file" />
        </ButtonUpload>
        {/* <ButtonUpload
          component="label"
          loading={loading}
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          accept=".xlsx, .xls"
          onChange={handleFile2Upload}
        >
          <p> Carregar (Light)</p>
          <VisuallyHiddenInput type="file" />
        </ButtonUpload> */}
        {loading && <p>Carregando...</p>} {message && <p>{message}</p>}
      </UploadBox>

      <SubMenuSection>
        <h1>Indicadores</h1>
        <div className="divider"></div>
      </SubMenuSection>
      <Dashboard>
        <StatCard title="Casos LTP VD IH" value={quantity_LTP_VD} onClick={() => toggleVisibility(1)} isActive={visibleComponents[1]} iconName="Activity" />
        <StatCard title="Casos EX LTP VD IH" value={quantity_EX_LTP_VD} onClick={() => toggleVisibility(21)} isActive={visibleComponents[21]} iconName="Activity" />
        <StatCard title="Ordens Em Rota" value={inRouteOrders.length || 0} onClick={() => toggleVisibility(40)} isActive={visibleComponents[40]} iconName="Truck" />
        <StatCard title="LTP REF/RAC" value={quantity_LTP_RAC_REF} onClick={() => toggleVisibility(2)} isActive={visibleComponents[2]} iconName="Activity" />
        <StatCard title="EX-LTP REF/RAC" value={quantity_EX_LTP_RAC_REF} onClick={() => toggleVisibility(20)} isActive={visibleComponents[20]} iconName="Activity" />
        <StatCard title="LTP WSM" value={quantity_LTP_WSM} onClick={() => toggleVisibility(3)} isActive={visibleComponents[3]} iconName="Activity" />
        <StatCard title="LTP VD CI" value={quantity_LTP_VD_CI} onClick={() => toggleVisibility(4)} isActive={visibleComponents[4]} type="CI" iconName="Activity" />
        <StatCard title="LTP MX CI" value={quantity_LTP_MX_CI} onClick={() => toggleVisibility(5)} isActive={visibleComponents[5]} type="CI" iconName="Activity" />
        <StatCard type={average.toFixed(2) > 3.8 ? "high" : (average.toFixed(2) > 3 ? "mid" : "normal")} title="RTAT VD" value={average.toFixed(2)} />
        <StatCard type={average2.toFixed(2) > 4.5 ? "high" : (average2.toFixed(2) > 3.8 ? "mid" : "normal")} title="RTAT DA" value={average2.toFixed(2)} />
      </Dashboard>

      <SubMenuSection>
        <h1>Análise</h1>
        <div className="divider"></div>
      </SubMenuSection>
      <Dashboard>
      <StatCard title="quantidade de casos DA" value={quantityDA} onClick={() => toggleVisibility(31)} isActive={visibleComponents[31]} />
        <StatCard title="DA sem peça (OW/LP)" value={quantity_DA_noParts} onClick={() => toggleVisibility(6)} isActive={visibleComponents[6]} />
        <StatCard title="Consumidor fora do prazo" value={quantity_Oudated_IH} onClick={() => toggleVisibility(8)} isActive={visibleComponents[8]} />
        <StatCard title="R. completo fora do prazo" value={quantity_Oudated_Repair_complete_IH} onClick={() => toggleVisibility(9)} isActive={visibleComponents[9]} iconName="CheckCircle" />
        <StatCard title="LTP IH</h1> <h1> Em até 4 dias</h1> </BlockLTP> <BlockLTP state={visibleComponents[10]} onClick={() => toggleVisibility(10)} > <h1>Effect Appointment</h1> </BlockLTP> <BlockLTP state={visibleComponents[11]} onClick={() => toggleVisibility(11)} > <h1>First Visit - Aguardando" value={quantity_POTENTIAL_first_visit} onClick={() => toggleVisibility(7)} isActive={visibleComponents[7]} iconName="Activity" />
        <StatCard title="Agenda do dia" value={quantity_agenda_today} onClick={() => toggleVisibility(12)} isActive={visibleComponents[12]} iconName="Calendar" />
        <StatCard title="Agenda de amanhã" value={quantity_agenda_tomorrow} onClick={() => toggleVisibility(13)} isActive={visibleComponents[13]} iconName="Calendar" />
      </Dashboard>
      
      <SubMenuSection>
        <h1>Gráficos Visuais</h1>
        <div className="divider"></div>
      </SubMenuSection>
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
        totalDa={quantityDA || 0}
        daNoParts={quantity_DA_noParts || 0}
        inRoute={inRouteOrders?.length || 0}
        firstVisitWait={quantity_POTENTIAL_first_visit || 0}
        totalAllDaLp={quantityDA || 0}
        totalAllVdLp={matches || 0}
      />
      <SubMenuSection>
        <h1>Calendário</h1>
        <div className="divider"></div>
      </SubMenuSection>
      <CalendarContainer>
        <ToggleableComponent isVisible={visibleComponents[14]}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventPropGetter}
          />
        </ToggleableComponent>
      </CalendarContainer>

      {data.length > 0 && (
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planilha_LTP_IH_VD_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
              </tbody>
            </table>
          </ToggleableComponent>
          <ToggleableComponent isVisible={visibleComponents[21]}>
            <h2>EM EX LTP DTV </h2>
            <table className="toggleDiv">
              <thead>
                <tr>
                  {columnsToShow.map((colIndex) => (
                    <th key={colIndex}>{data[0][colIndex]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planilha_EX_LTP_IH_VD_LP.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
              </tbody>
            </table>
          </ToggleableComponent>
          <ToggleableComponent isVisible={visibleComponents[40]}>
            <h2>ORDENS EM ROTA</h2>
            <table className="toggleDiv">
              <thead>
                <tr>
                  {columnsToShow.map((colIndex) => (
                    <th key={colIndex}>{data[0][colIndex]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inRouteOrders.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow))}
              </tbody>
            </table>
          </ToggleableComponent>
          <ToggleableComponent isVisible={visibleComponents[2]}>
            <h2> EM LTP RAC/REF</h2>
            <table>
              <thead>
                <tr>
                  {columnsToShow.map((colIndex) => (
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData17.map((row, rowIndex) => renderRow(row, rowIndex, columnsToShow_complete_repair))}
              </tbody>
            </table>
          </ToggleableComponent>
        </>
      )}
    </MainContainer>
  );
};

const CalendarBox = styled.div`
  display: flex;
  padding-right: 10px;
`;

const CalendarContainer = styled.div`
  padding: 10px 0px;
  width: 60%;
  background-color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  margin-left: auto;
  margin-right: auto;
`;
const UploadBox = styled.div`
  display: flex;
  margin: 10px;
  align-items: center;
  p {
    margin-left: 5px;
  }
`;
const WarningIconX = styled(WarningIcon)`
  position: absolute;
  top: 10px;
  right: 10px;
  color: ${(props) => (props.type === "mid" ? "#818300" : "#ff0000e0")};
`;
const BlockLTP = styled.div`
  box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75);
  -webkit-box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75);

  position: relative;
  width: 250px;
  height: 150px;
  padding: 10px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  text-align: center;
  h1 {
    font-size: 18px;
    /* margin-bottom: 10px; */
  }
  h2 {
    font-size: 50px;
  }
  /* justify-content: center; */
  /* align-items: center; */
  justify-content: space-evenly;
  border-radius: 10px;
  font-weight: 900;
  .divider {
    background-color: #757575;
    width: 100%;
    height: 2px;
  }

  /* ${(state) =>
    state &&
    `  background-color: #80e200;
`} */

  color: ${(props) => (props.type === "CI" ? "#000264" : "#000000e1")};
  animation: ${(props) => (props.state ? colorChange : colorChangeout)} 500ms
    forwards;

  background-color: ${(props) =>
    props.state === true ? "#6fb0ff" : "#ececece2"};
`;
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});
const ButtonUpload = styled(Button)`
  margin: 10px 10px;

  width: 190px;
  p {
    font-size: 11px;
  }
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
  align-items: center;
  /* justify-content: space-around; */
  margin: 10px;
  padding: 10px;
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
const colorChange = keyframes`
  from {
    background-color: #ececece2;
  }
  to {
    background-color: #6fb0ff;
  }
`;
const colorChangeout = keyframes`
  from {
    background-color: #6fb0ff;
  }
  to {
    background-color: #ececece2;
  }
`;
export default HomePage;
