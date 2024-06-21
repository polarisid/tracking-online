import React, { useState } from "react";
import HeaderComponent from "../components/HeaderComponent";
import * as XLSX from "xlsx";
import styled, { keyframes } from "styled-components";
import ToggleableComponent from "../components/ToggleableComponent";
import WarningIcon from "@mui/icons-material/Warning";

const HomePage = () => {
  const useToggle = (initialState) => {
    const [toggleValue, setToggleValue] = useState(initialState);

    const toggler = () => {
      setToggleValue(!toggleValue);
    };
    return [toggleValue, toggler];
  };
  const [toggle, setToggle] = useToggle();

  const useToggle1 = (initialState) => {
    const [toggleValue1, setToggleValue1] = useState(initialState);

    const toggler1 = () => {
      setToggleValue1(!toggleValue1);
    };
    return [toggleValue1, toggler1];
  };
  const [toggle1, setToggle1] = useToggle1();

  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [averageValue, setAverageValue] = useState(0);

  const [isVisible, setIsVisible] = useState(false);

  // const toggleVisibility = () => {
  //   setIsVisible(!isVisible);
  // };

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
  });

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
      const dateColumns = [16, 22, 24, 27];

      // Formatar as datas corretamente apenas nas colunas especificadas
      const formattedData = sheetData.map((row) =>
        row.map((cell, index) => {
          if (dateColumns.includes(index) && typeof cell === "number") {
            const date = convertToDate(cell);
            if (isValidDate(date)) {
              const day = String(date.getUTCDate()).padStart(2, "0");
              const month = String(date.getUTCMonth() + 1).padStart(2, "0");
              const year = date.getUTCFullYear();
              return `${day}/${month}/${year}`;
            }
          }
          return cell;
        })
      );

      setData(formattedData);
      setLoading(false);
      setMessage("Upload successful!");
    };

    reader.onerror = () => {
      setLoading(false);
      setMessage("Error reading file!");
    };

    reader.readAsBinaryString(uploadedFile);
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

  //     setData(sheetData);
  //     setLoading(false);
  //     setMessage("Upload successful!");
  //   };

  //   reader.onerror = () => {
  //     setLoading(false);
  //     setMessage("Error reading file!");
  //   };

  //   reader.readAsBinaryString(uploadedFile);
  // };

  // Função para aplicar o filtro na coluna 37 e 58 para a primeira tabela
  const filter_VD_LTP_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
    ].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  };
  const today = new Date();

  function formatDate(date, format) {
    const map = {
      mm: date.getMonth() + 1,
      dd: date.getDate(),
      yy: date.getFullYear().toString().slice(-2),
      yyyy: date.getFullYear(),
    };

    return format.replace(/mm|dd|yy|yyy/gi, (matched) => map[matched]);
  }

  function formatDateToDDMMYYYY(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // const today_Form = formatDate(today, "dd/mm/yyyy");
  const today_Form = formatDateToDDMMYYYY(today);
  // Função para aplicar o filtro na coluna 37 e 58 para a segunda tabela
  const filter_REF_RAC_LTP_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]);
    const isLTP = row[15] > 4;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  };
  const filter_Customer_outdated = (row) => {
    // const isCol37Valid = row[37] === "LP";
    const isCol14Valid = row[13] === "HP030";
    // const isOutadate = row[24] < today;
    const isLTP = row[15] > 1;
    // const isInHome = row[34] === "IH";

    return isCol14Valid && isLTP;
  };
  const filter_repair_complete_outdated = (row) => {
    // const isCol37Valid = row[37] === "LP";
    const isCol14Valid = row[13] === "HL005";
    const isOutadate = row[27] < today_Form;
    // const isOutadate = today_Form.getDate() - row[27].getDate() > 0;

    // const isInHome = row[34] === "IH";

    return isCol14Valid && isOutadate;
  };
  // Função para aplicar o filtro na coluna 37 e 58 para a terceira tabela
  const filter_WSM_LP_LTP = (row) => {
    const isInHome = row[34] === "IH";
    const isCol37Valid = row[37] === "LP";
    const isCol58Valid = ["SWM01", "SWM03"].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  };

  const filter_DA_noParts = (row) => {
    // const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "SWM01",
      "SWM03",
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]);
    const notParts = row[61] == null;

    return isCol58Valid && notParts && isInHome;
  };

  const filter_allNext_LTP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isLTPnear = row[15] > 2;
    const isLTPnearby = row[15] < 7;
    return isCol37Valid && isLTPnear && isLTPnearby && isInHome;
  };

  const filter_isEffect_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] == row[24];
    const isInHome = row[34] === "IH";

    return isCol37Valid && isEffect && isInHome;
  };

  const filter_near_isEffect_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] > row[24];
    const isInHome = row[34] === "IH";

    return isCol37Valid && isEffect && isInHome;
  };
  const filter_potential_first_visit = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isTODAY = row[27] === today_Form;
    const isFromToday = row[16] === today_Form;

    const isInHome = row[34] === "CI";
    console.log(row[27] + "  opa " + today_Form);

    return isCol37Valid && isTODAY && isInHome && isFromToday;
  };

  const filter_next_isEffect_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] < row[24];
    const isOutadate = row[22] > today_Form;

    const isInHome = row[34] === "IH";

    return isCol37Valid && isEffect && isInHome;
  };

  const filter_CI_VD_LTP_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
    ].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  };

  const filter_CI_MX_LTP_LP = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [
      "NPC01",
      "NPC02",
      "NPC03",
      "THB01",
      "THB02",
      "THB03",
      "THB05",
      "THB42",
      "THB43",
      "THB96",
    ].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  };
  // Índices das colunas que queremos exibir (baseado em zero)
  const columnsToShow = [1, 9, 14, 15, 24, 61];
  const columnsToShow_intoogle = [1, 9, 14, 15, 37, 22, 24, 61];
  const columnsToShow_complete_repair = [1, 9, 14, 15, 37, 22, 24, 27];
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

  const filteredAndSortedData1 = sortData(
    data.slice(1).filter(filter_VD_LTP_LP)
  );
  const filteredAndSortedData2 = sortData(
    data.slice(1).filter(filter_REF_RAC_LTP_LP)
  );
  const filteredAndSortedData3 = sortData(
    data.slice(1).filter(filter_WSM_LP_LTP)
  );
  const filteredAndSortedData4 = sortData(
    data.slice(1).filter(filter_DA_noParts)
  );
  const filteredAndSortedData5 = sortData(
    data.slice(1).filter(filter_allNext_LTP)
  );
  const filteredAndSortedData6 = sortData(
    data.slice(1).filter(filter_isEffect_LP)
  );

  const filteredAndSortedData9 = sortData(
    data.slice(1).filter(filter_CI_VD_LTP_LP)
  );
  const filteredAndSortedData10 = sortData(
    data.slice(1).filter(filter_CI_MX_LTP_LP)
  );
  const filteredAndSortedData11 = sortData(
    data.slice(1).filter(filter_Customer_outdated)
  );
  const filteredAndSortedData12 = sortData(
    data.slice(1).filter(filter_repair_complete_outdated)
  );
  const filteredAndSortedData13 = sortData(
    data.slice(1).filter(filter_near_isEffect_LP)
  );
  const filteredAndSortedData14 = sortData(
    data.slice(1).filter(filter_next_isEffect_LP)
  );
  const filteredAndSortedData15 = sortData(
    data.slice(1).filter(filter_potential_first_visit)
  );

  const quantity_DA_noParts = filteredAndSortedData4.length;

  const quantity_LTP_VD = filteredAndSortedData1.length;
  const quantity_LTP_RAC_REF = filteredAndSortedData2.length;
  const quantity_LTP_WSM = filteredAndSortedData3.length;
  const quantity_LTP_VD_CI = filteredAndSortedData9.length;
  const quantity_LTP_MX_CI = filteredAndSortedData10.length;
  const quantity_Oudated_IH = filteredAndSortedData11.length;
  const quantity_Oudated_Repair_complete_IH = filteredAndSortedData12.length;
  const quantity_POTENTIAL_first_visit = filteredAndSortedData15.length;

  const all_lp_vd = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH" || row[34] === "CI";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
    ].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  };

  const all_lp_DA = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "SWM01",
      "SWM03",
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  };

  const filteredAndSortedData7 = sortData(data.slice(1).filter(all_lp_vd));
  const filteredAndSortedData8 = sortData(data.slice(1).filter(all_lp_DA));

  const midVar = data.slice(1).filter(all_lp_vd);
  const midVar2 = data.slice(1).filter(all_lp_DA);

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
        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
        {loading && <p>Uploading...</p>} {message && <p>{message}</p>}
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
      </Dashboard>
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
                {filteredAndSortedData1.map((row, rowIndex) => (
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
                {filteredAndSortedData2.map((row, rowIndex) => (
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
                {filteredAndSortedData3.map((row, rowIndex) => (
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
            <h2>Reparo comleto fora do prazo de todos os serviços</h2>
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
        </>
      )}
    </MainContainer>
  );
};

const UploadBox = styled.div``;
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

const SubMenuSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: start;
  .divider {
    height: 2px;
    width: 100%;
    background-color: #5a5a5a;
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
  /* justify-content: space-between; */
  /* align-items: center; */
  /* height: 100vh; */
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
