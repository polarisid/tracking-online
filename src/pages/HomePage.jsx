import { useState, useEffect } from "react";
import HeaderComponent from "../components/HeaderComponent";
import * as XLSX from "xlsx";
import styled, { keyframes } from "styled-components";
import ToggleableComponent from "../components/ToggleableComponent";
import WarningIcon from "@mui/icons-material/Warning";
import Button from "@mui/material/Button";
import filters from "../utils/filters";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import handleFileUpload from "../utils/fileUploader";
import { UploadButton } from "../components/UploadButton";
import useHomeContext from "../hooks/UseHomeContext";
import BasicTabs from "../components/BasicTabs";
import styles from "./styles.css";
import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { saveAs } from "file-saver";
import DownloadIcon from "@mui/icons-material/Download";
import UploadBoxMenu from "../components/UploadBox";

const localizer = momentLocalizer(moment);

const HomePage = () => {
  const { file1, setFile1 } = useHomeContext();
  const { file2, setFile2 } = useHomeContext();
  const { data1, setData1 } = useHomeContext();
  const { data2, setData2 } = useHomeContext();
  const { combinedData, setCombinedData } = useHomeContext();
  const { visibleComponents, setVisibleComponents } = useHomeContext();

  const [combinedData_download, setCombinedData_download] = useState([]);

  const [events, setEvents] = useState([]);
  const [cityData, setCityData] = useState({});

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  ///////////////////////////////
  const downloadExcel = (combinedData, fileName = "planilha.xlsx") => {
    // Cria uma nova planilha
    if (data2.length == 0) {
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
        123, 124,
      ];
      const columnsTo_Download = [
        1, 3, 4, 12, 14, 16, 17, 18, 24, 26, 36, 39, 45, 46, 47, 48, 49, 58, 59,
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
        78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
      ];
      const data1SelectedCols = selectSpecificColumns(
        data1,
        columnsToShow_complete_repair
      );
      const data1SelectedCols_d = selectSpecificColumns(
        data1,
        columnsToShow_complete_repair
      );

      const headers = [
        data1[0][1], // Número da Ordem de Serviço
        "Nome do Cliente",
        "Cidade do Cliente",
        ...columnsToShow_complete_repair
          .slice(1)
          .map((index) => data1[0][index]),
      ];

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
          additionalData.nome,
          additionalData.cidade,
          ...row.slice(1), // Outras colunas selecionadas
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
            const orderId = row[2]; // Índice da coluna B

            // Adicionar os valores das colunas L e M da segunda planilha se disponível
            const cityInfo = cityData[orderId] || {
              city: "",
              additionalInfo: "",
            };

            return {
              title: `${row[0]} - ${row[2]} - ${row[14]}`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
              start: startDate,
              end: startDate,
              type: row[34], // Armazenar o tipo para usar no eventPropGetter
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
            const orderId = row[2]; // Índice da coluna B

            // Adicionar os valores das colunas L e M da segunda planilha se disponível
            const cityInfo = cityData[orderId] || {
              city: "",
              additionalInfo: "",
            };

            return {
              title: `${row[1]}  ${cityInfo.city ? ` - ${cityInfo.city}` : ""}${
                cityInfo.additionalInfo ? ` - ${cityInfo.additionalInfo}` : ""
              }`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
              start: startDate,
              end: startDate,
              type: row[34], // Armazenar o tipo para usar no eventPropGetter
            };
          });
        setEvents(formattedEvents);
      }
      setCombinedData_download([headers, ...combined_d]);
      setCombinedData([headers, ...combined]);
    }
  }, [data1, data2, cityData, events]);

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

  const columnsToShow = [0, 1, 2, 9, 14, 15, 24, 61];

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
  const planilha_LTP_IH_RAC_REF_LP = sortData(
    combinedData.slice(1).filter(filters.filter_REF_RAC_LTP_LP)
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

  const quantity_DA_noParts = filteredAndSortedData4.length;
  const quantity_LTP_VD = planilha_LTP_IH_VD_LP.length;
  const quantity_LTP_RAC_REF = planilha_LTP_IH_RAC_REF_LP.length;
  const quantity_LTP_WSM = planilha_LTP_IH_WSM_LP.length;
  const quantity_LTP_VD_CI = filteredAndSortedData9.length;
  const quantity_LTP_MX_CI = filteredAndSortedData10.length;
  const quantity_Oudated_IH = filteredAndSortedData11.length;
  const quantity_Oudated_Repair_complete_IH = filteredAndSortedData12.length;
  const quantity_POTENTIAL_first_visit = filteredAndSortedData15.length;
  const quantity_agenda_today = filteredAndSortedData16.length;
  const quantity_agenda_tomorrow = filteredAndSortedData17.length;

  const midVar = combinedData.slice(1).filter(filters.all_lp_vd);
  const midVar2 = combinedData.slice(1).filter(filters.all_lp_DA);

  const matches = filteredAndSortedData7.length;
  const sum = midVar.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average = matches > 0 ? sum / matches : 0;

  const matches2 = filteredAndSortedData8.length;
  const sum2 = midVar2.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average2 = matches2 > 0 ? sum2 / matches2 : 0;

  return (
    <MainContainer>
      <HeaderComponent />
      {/* <UploadBoxMenu
        handleFileUpload_beta={handleFileUpload_beta}
        downloadExcel={downloadExcel}
      /> */}
      {/* <UploadBoxMenu
        handleFileUpload_beta={handleFileUpload_beta}
        downloadExcel={downloadExcel}
        setFile1={setFile1}
        setData1={setData1}
        setFile2={setFile2}
        setData2={setData2}
        loading={loading}
        message={message}
      /> */}
      <UploadBox>
        <Button
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
        >
          upload e Download
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          <MenuItem>
            <UploadButton
              onChange={(e) => handleFileUpload_beta(e, setFile1, setData1)}
              text={"Carregar A. Pending"}
            />
          </MenuItem>
          <MenuItem>
            <UploadButton
              onChange={(e) => handleFileUpload_beta(e, setFile2, setData2)}
              text={"Carregar Cidades "}
            />
          </MenuItem>
          <MenuItem onClick={(e) => downloadExcel(combinedData_download)}>
            <Button startIcon={<DownloadIcon />}>Download</Button>
          </MenuItem>
        </Menu>
        {loading && <p>Carregando...</p>} {message && <p>{message}</p>}
      </UploadBox>

      <BasicTabs>
        <Dashboard>
          <BlockLTP
            state={visibleComponents[1]}
            onClick={() => toggleVisibility(1)}
          >
            <div className="divider">
              <h1>LTP VD IH</h1>
            </div>
            <h2>{quantity_LTP_VD}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[2]}
            onClick={() => toggleVisibility(2)}
          >
            <div className="divider">
              <h1>LTP REF/RAC </h1>
            </div>

            <h2>{quantity_LTP_RAC_REF}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[3]}
            onClick={() => toggleVisibility(3)}
          >
            <div className="divider">
              <h1>LTP WSM</h1>
            </div>
            <h2>{quantity_LTP_WSM}</h2>
          </BlockLTP>
          <BlockLTP
            type={"CI"}
            state={visibleComponents[4]}
            onClick={() => toggleVisibility(4)}
          >
            <div className="divider">
              <h1>LTP VD CI</h1>
            </div>

            <h2>{quantity_LTP_VD_CI}</h2>
          </BlockLTP>
          <BlockLTP
            type={"CI"}
            state={visibleComponents[5]}
            onClick={() => toggleVisibility(5)}
          >
            <div className="divider">
              <h1>LTP MX CI</h1>
            </div>

            <h2>{quantity_LTP_MX_CI}</h2>
          </BlockLTP>
          <BlockLTP>
            {average.toFixed(2) > 3.8 ? <WarningIconX></WarningIconX> : <></>}
            {average.toFixed(2) < 3.8 && average.toFixed(2) > 3 ? (
              <WarningIconX type={"mid"}></WarningIconX>
            ) : (
              <></>
            )}

            <div className="divider">
              <h1>RTAT VD</h1>
            </div>

            <h2>{average.toFixed(2)}</h2>
          </BlockLTP>
          <BlockLTP>
            {average2.toFixed(2) > 4.5 ? <WarningIconX></WarningIconX> : <></>}
            {average2.toFixed(2) < 4.5 && average2.toFixed(2) > 3.8 ? (
              <WarningIconX type={"mid"}></WarningIconX>
            ) : (
              <></>
            )}

            <div className="divider">
              <h1>RTAT DA</h1>
            </div>

            <h2>{average2.toFixed(2)}</h2>
          </BlockLTP>
        </Dashboard>
        <Dashboard>
          <BlockLTP
            state={visibleComponents[6]}
            onClick={() => toggleVisibility(6)}
          >
            <div className="divider">
              <h1>DA Sem Peça (OW/LP)</h1>
            </div>
            <h2>{quantity_DA_noParts}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[8]}
            onClick={() => toggleVisibility(8)}
          >
            <div className="divider">
              <h1>Consumidor Fora do Prazo</h1>
            </div>

            <h2>{quantity_Oudated_IH}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[9]}
            onClick={() => toggleVisibility(9)}
          >
            <div className="divider">
              <h1>R. Completo Fora do Prazo</h1>
            </div>

            <h2>{quantity_Oudated_Repair_complete_IH}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[7]}
            onClick={() => toggleVisibility(7)}
          >
            <div className="divider"></div>
            <h1>LTP IH</h1>
            <h1> Em até 4 dias</h1>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[10]}
            onClick={() => toggleVisibility(10)}
          >
            <div className="divider"></div>

            <h1>Effect Appointment</h1>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[11]}
            onClick={() => toggleVisibility(11)}
          >
            <div className="divider">
              {" "}
              <h1>First Visit - Aguardando</h1>
            </div>

            <h2>{quantity_POTENTIAL_first_visit}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[12]}
            onClick={() => toggleVisibility(12)}
          >
            <div className="divider">
              <h1>Agenda do Dia</h1>
            </div>

            <h2>{quantity_agenda_today}</h2>
          </BlockLTP>
          <BlockLTP
            state={visibleComponents[13]}
            onClick={() => toggleVisibility(13)}
          >
            <div className="divider">
              <h1>Agenda de Amanhã</h1>
            </div>

            <h2>{quantity_agenda_tomorrow}</h2>
          </BlockLTP>
        </Dashboard>
        <CalendarContainer>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventPropGetter}
          />
        </CalendarContainer>
      </BasicTabs>

      {combinedData.length > 0 && (
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
                {planilha_LTP_IH_VD_LP.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {planilha_LTP_IH_RAC_REF_LP.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {planilha_LTP_IH_WSM_LP.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData9.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData10.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData4.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData5.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData11.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_type_service.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData12.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData15.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData6.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData13.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData14.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_intoogle.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData16.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
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
                {filteredAndSortedData17.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {columnsToShow_complete_repair.map((colIndex) => (
                      <td key={colIndex}>{row[colIndex]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ToggleableComponent>
        </>
      )}
    </MainContainer>
  );
};

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
  /* box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75);
  -webkit-box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 1px 6px 19px -12px rgba(0, 0, 0, 0.75); */
  border-radius: 47px;
  background: #e0e0e0;
  box-shadow: -5px 5px 6px #dcdcdc, 5px -5px 6px #e4e4e4;
  position: relative;
  width: 230px;
  height: 135px;
  /* padding: 10px; */
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
  justify-content: flex-start;

  border-radius: 10px;
  font-weight: 900;
  .divider {
    margin-bottom: 10px;
    /* background-color: #23323d; */
    background-color: ${(props) =>
      props.type === "CI" ? "#000264" : "#23323d"};
    /* width: 100%; */
    padding: 10px;
    border-radius: 10px;
    color: white;
    /* height: 2px; */
  }

  /* ${(state) =>
    state &&
    `  background-color: #80e200;
`} */

  animation: ${(props) => (props.state ? colorChange : colorChangeout)} 500ms
    forwards;

  background-color: ${(props) =>
    props.state === true ? "#6fb0ff" : "#000000e1"};
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
    background-color: #878E8D;
  }
`;
const colorChangeout = keyframes`
  from {
    background-color: #878E8D;
  }
  to {
    background-color: #ececece2;
  }
`;

export default HomePage;
