import React, { useState, useEffect } from "react";
import HeaderComponent from "../components/HeaderComponent";
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
import handleFileUpload from "../utils/fileUploader";
import { UploadButton } from "../components/UploadButton";

import { saveAs } from "file-saver";
import DownloadIcon from "@mui/icons-material/Download";

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
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [combinedData_download, setCombinedData_download] = useState([]);

  const [events, setEvents] = useState([]);
  const [cityData, setCityData] = useState({});

  const [file, setFile] = useState(null);
  // const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const data = combinedData;

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
  });

  ///////////////////////////////
  const downloadExcel = (data, fileName = "planilha.xlsx") => {
    // Cria uma nova planilha
    if (data2.length == 0) {
      alert("Não possui planilha Service Light na base!");
      return;
    }
    const worksheet = XLSX.utils.aoa_to_sheet(data);
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

  const selectSpecificColumns = (data, columnsToShow) => {
    return data.map((row) => {
      return columnsToShow.map((colIndex) => row[colIndex]);
    });
  };

  useEffect(() => {
    if (data1.length > 0) {
      const columnsToShow_complete_repair = [
        1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
        22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
        58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
        76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
      ];
      const columnsTo_Download = [
        1, 3, 4, 11, 14, 16, 17, 18, 24, 26, 36, 39, 45, 46, 47, 48, 49, 58, 59,
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77,
        78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
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
              title: `${row[0]} - ${row[2]}`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
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
              title: `${row[1]} ${cityInfo.city ? ` - ${cityInfo.city}` : ""}${
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
  }, [data1, data2, cityData]);

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

  // const handleFileUpload_beta = (
  // e,
  // setFileFunction,
  // setDataFunction,
  // ) => {
  //   const uploadedFile = e.target.files[0];
  //   setFileFunction(uploadedFile);
  //   setLoading(true);
  //   setMessage("");

  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     const binaryStr = event.target.result;
  //     const workbook = XLSX.read(binaryStr, { type: "binary" });

  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  //     const convertToDate = (value) => {
  //       const date = XLSX.SSF.parse_date_code(value);
  //       if (date) {
  //         return new Date(Date.UTC(date.y, date.m - 1, date.d));
  //       }
  //       return null;
  //     };

  //     // Colunas que sabemos que devem conter datas
  //     const dateColumns = [16, 22, 24, 27];
  //     const isValidDate = (d) => {
  //       return d instanceof Date && !isNaN(d);
  //     };

  //     // Formatar as datas corretamente apenas nas colunas especificadas
  //     const formattedData = sheetData.map((row) =>
  //       row.map((cell, index) => {
  //         if (dateColumns.includes(index) && typeof cell === "number") {
  //           const date = convertToDate(cell);
  //           if (isValidDate(date)) {
  //             const day = String(date.getUTCDate()).padStart(2, "0");
  //             const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  //             const year = date.getUTCFullYear();

  //             // console.log(`${month}/${day}/${year}`);
  //             // return `${day}/${month}/${year}`;
  //             return `${month}/${day}/${year}`;
  //           }
  //         }
  //         return cell;
  //       })
  //     );

  //     // setDataFunction(sheetData);
  //     setDataFunction(formattedData);
  //     setLoading(false);
  //     setMessage("Carregamento completo!");
  //   };

  //   reader.onerror = () => {
  //     setLoading(false);
  //     setMessage("Error reading file!");
  //   };

  //   reader.readAsBinaryString(uploadedFile);
  // };

  const toggleVisibility = (id) => {
    setVisibleComponents((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  // const handleFileUpload = (e) => {
  //   const uploadedFile = e.target.files[0];
  //   setFile(uploadedFile);
  //   setLoading(true);
  //   setMessage("");

  //   const reader = new FileReader();
  //   reader.onload = (event) => {
  //     const binaryStr = event.target.result;
  //     const workbook = XLSX.read(binaryStr, { type: "binary" });

  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  //     // Função para verificar se um valor é uma data válida
  //     const isValidDate = (d) => {
  //       return d instanceof Date && !isNaN(d);
  //     };

  //     // Função para converter números em datas
  //     const convertToDate = (value) => {
  //       const date = XLSX.SSF.parse_date_code(value);
  //       if (date) {
  //         return new Date(Date.UTC(date.y, date.m - 1, date.d));
  //       }
  //       return null;
  //     };

  //     // Colunas que sabemos que devem conter datas
  //     const dateColumns = [16, 22, 24, 27];

  //     // Formatar as datas corretamente apenas nas colunas especificadas
  //     const formattedData = sheetData.map((row) =>
  //       row.map((cell, index) => {
  //         if (dateColumns.includes(index) && typeof cell === "number") {
  //           const date = convertToDate(cell);
  //           if (isValidDate(date)) {
  //             const day = String(date.getUTCDate()).padStart(2, "0");
  //             const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  //             const year = date.getUTCFullYear();

  //             // console.log(`${month}/${day}/${year}`);
  //             // return `${day}/${month}/${year}`;
  //             return `${month}/${day}/${year}`;
  //           }
  //         }
  //         return cell;
  //       })
  //     );

  //     setData(formattedData);
  //     setLoading(false);
  //     setMessage("Carregamento completo!");
  //   };

  //   reader.onerror = () => {
  //     setLoading(false);
  //     setMessage("Error reading file!");
  //   };

  //   reader.readAsBinaryString(uploadedFile);
  // };

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

  // useEffect(() => {
  //   if (data.length > 0) {
  //     const formattedEvents = data
  //       .slice(1)
  //       .filter((row) => {
  //         const filterValueAI = row[34]; // Índice da coluna AI
  //         const filterValueN = row[13]; // Índice da coluna N
  //         const validValuesAI = ["II", "IH", "SH"];
  //         const invalidValuesN = ["HP035", "HP080", "HP081", "HPZ20", "HL005"];

  //         return (
  //           validValuesAI.includes(filterValueAI) &&
  //           !invalidValuesN.includes(filterValueN)
  //         );
  //       })
  //       .map((row) => {
  //         const dateStr = row[24]; // Usando o índice da coluna para a data (Y)
  //         const date = moment(dateStr, "DD/MM/YYYY").toDate(); // Converter para data usando moment
  //         const isValidDate = !isNaN(date);
  //         const startDate = isValidDate
  //           ? date
  //           : moment.utc(dateStr, "YYYY-MM-DD").toDate();
  //         const orderId = row[1]; // Índice da coluna B

  //         // Adicionar os valores das colunas L e M da segunda planilha se disponível
  //         const cityInfo = cityData[orderId] || {
  //           city: "",
  //           additionalInfo: "",
  //         };

  //         return {
  //           title: `${row[1]}${cityInfo.city ? ` - ${cityInfo.city}` : ""}${
  //             cityInfo.additionalInfo ? ` - ${cityInfo.additionalInfo}` : ""
  //           }`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
  //           start: startDate,
  //           end: startDate,
  //           type: row[34], // Armazenar o tipo para usar no eventPropGetter
  //         };
  //       });

  //     setEvents(formattedEvents);
  //   }
  // }, [data, cityData]);

  // Índices das colunas que queremos exibir (baseado em zero)
  // const columnsToShow = [1, 2, 3, 11, 16, 17, 36, 39];
  const columnsToShow = [0, 1, 2, 9, 14, 15, 24, 61];

  const columnsToShow_intoogle = [0, 1, 2, 9, 14, 15, 37, 22, 24, 61];
  const columnsToShow_complete_repair = [
    0, 1, 2, 9, 14, 15, 37, 22, 34, 24, 27,
  ];
  const columnsToShow_type_service = [0, 1, 2, 9, 14, 15, 37, 22, 34];

  // Função para ordenar as linhas com base na coluna 15 (índice 14)
  const sortData = (filteredData) => {
    return filteredData.sort((a, b) => {
      const valA = a[17]; //15 ->16
      const valB = b[17];
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });
  };

  const planilha_LTP_IH_VD_LP = sortData(
    combinedData.slice(1).filter(filters.filter_VD_LTP_LP)
  );
  // const planilha_LTP_IH_VD_LP = sortData(combinedData.slice(1));
  const planilha_LTP_IH_RAC_REF_LP = sortData(
    data.slice(1).filter(filters.filter_REF_RAC_LTP_LP)
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
      <HeaderComponent />

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
        <UploadButton
          onChange={(e) => handleFileUpload_beta(e, setFile1, setData1)}
          text={"Carregar A. Pending"}
        />
        <UploadButton
          onChange={(e) => handleFileUpload_beta(e, setFile2, setData2)}
          text={"Carregar Light"}
        />
        <DownloadIcon onClick={(e) => downloadExcel(combinedData)} />
        {/* <ButtonUpload
          component="label"
          loading={loading}
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          accept=".xlsx, .xls"
          onChange={(e) => downloadExcel(combinedData)}
        >
          <p> Baixar</p>
          <VisuallyHiddenInput type="file" />
        </ButtonUpload> */}
        {loading && <p>Carregando...</p>} {message && <p>{message}</p>}
      </UploadBox>

      <SubMenuSection>
        <h1>Indicadores</h1>
        <div className="divider"></div>
      </SubMenuSection>
      <Dashboard>
        <BlockLTP
          state={visibleComponents[1]}
          onClick={() => toggleVisibility(1)}
        >
          <h1>Casos LTP VD IH</h1>
          <div className="divider"></div>
          <h2>{quantity_LTP_VD}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[2]}
          onClick={() => toggleVisibility(2)}
        >
          <h1>LTP REF/RAC </h1>
          <div className="divider"></div>

          <h2>{quantity_LTP_RAC_REF}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[3]}
          onClick={() => toggleVisibility(3)}
        >
          <h1>LTP WSM</h1>
          <div className="divider"></div>
          <h2>{quantity_LTP_WSM}</h2>
        </BlockLTP>
        <BlockLTP
          type={"CI"}
          state={visibleComponents[4]}
          onClick={() => toggleVisibility(4)}
        >
          <h1>LTP VD CI</h1>
          <div className="divider"></div>

          <h2>{quantity_LTP_VD_CI}</h2>
        </BlockLTP>
        <BlockLTP
          type={"CI"}
          state={visibleComponents[5]}
          onClick={() => toggleVisibility(5)}
        >
          <h1>LTP MX CI</h1>
          <div className="divider"></div>

          <h2>{quantity_LTP_MX_CI}</h2>
        </BlockLTP>
        <BlockLTP>
          {average.toFixed(2) > 3.8 ? <WarningIconX></WarningIconX> : <></>}
          {average.toFixed(2) < 3.8 && average.toFixed(2) > 3 ? (
            <WarningIconX type={"mid"}></WarningIconX>
          ) : (
            <></>
          )}

          <h1>RTAT VD</h1>
          <div className="divider"></div>

          <h2>{average.toFixed(2)}</h2>
        </BlockLTP>
        <BlockLTP>
          {average2.toFixed(2) > 4.5 ? <WarningIconX></WarningIconX> : <></>}
          {average2.toFixed(2) < 4.5 && average2.toFixed(2) > 3.8 ? (
            <WarningIconX type={"mid"}></WarningIconX>
          ) : (
            <></>
          )}

          <h1>RTAT DA</h1>
          <div className="divider"></div>

          <h2>{average2.toFixed(2)}</h2>
        </BlockLTP>
      </Dashboard>

      <SubMenuSection>
        <h1>Análise</h1>
        <div className="divider"></div>
      </SubMenuSection>
      <Dashboard>
        <BlockLTP
          state={visibleComponents[6]}
          onClick={() => toggleVisibility(6)}
        >
          <h1>DA sem peça (OW/LP)</h1>
          <div className="divider"></div>
          <h2>{quantity_DA_noParts}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[8]}
          onClick={() => toggleVisibility(8)}
        >
          <h1>Consumidor fora do prazo</h1>
          <div className="divider"></div>

          <h2>{quantity_Oudated_IH}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[9]}
          onClick={() => toggleVisibility(9)}
        >
          <h1>R. completo fora do prazo</h1>
          <div className="divider"></div>

          <h2>{quantity_Oudated_Repair_complete_IH}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[7]}
          onClick={() => toggleVisibility(7)}
        >
          <h1>LTP IH</h1>
          <h1> Em até 4 dias</h1>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[10]}
          onClick={() => toggleVisibility(10)}
        >
          <h1>Effect Appointment</h1>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[11]}
          onClick={() => toggleVisibility(11)}
        >
          <h1>First Visit - Aguardando</h1>
          <div className="divider"></div>

          <h2>{quantity_POTENTIAL_first_visit}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[12]}
          onClick={() => toggleVisibility(12)}
        >
          <h1>Agenda do dia</h1>
          <div className="divider"></div>

          <h2>{quantity_agenda_today}</h2>
        </BlockLTP>
        <BlockLTP
          state={visibleComponents[13]}
          onClick={() => toggleVisibility(13)}
        >
          <h1>Agenda de amanhã</h1>
          <div className="divider"></div>

          <h2>{quantity_agenda_tomorrow}</h2>
        </BlockLTP>
      </Dashboard>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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
                    <th key={colIndex}>{data[0][colIndex]}</th>
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

  width: 200px;
  p {
    font-size: 12px;
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
