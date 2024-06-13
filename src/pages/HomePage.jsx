import React, { useState } from "react";
import HeaderComponent from "../components/HeaderComponent";
import * as XLSX from "xlsx";
import styled from "styled-components";
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

      setData(sheetData);
      setLoading(false);
      setMessage("Upload successful!");
    };

    reader.onerror = () => {
      setLoading(false);
      setMessage("Error reading file!");
    };

    reader.readAsBinaryString(uploadedFile);
  };

  // Função para aplicar o filtro na coluna 37 e 58 para a primeira tabela
  const applyFilter1 = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCol58Valid = ["LED01", "LED02", "LED03", "LFD01", "LFD02"].includes(
      row[58]
    );
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP;
  };

  // Função para aplicar o filtro na coluna 37 e 58 para a segunda tabela
  const applyFilter2 = (row) => {
    const isCol37Valid = row[37] === "LP";
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
    return isCol37Valid && isCol58Valid && isLTP;
  };

  // Função para aplicar o filtro na coluna 37 e 58 para a terceira tabela
  const applyFilter3 = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCol58Valid = ["SWM01", "SWM03"].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP;
  };

  const applyFilter4 = (row) => {
    // const isCol37Valid = row[37] === "LP";
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

    return isCol58Valid && notParts;
  };

  const applyFilter5 = (row) => {
    const isCol37Valid = row[37] === "LP";

    const isLTPnear = row[15] > 2;
    const isLTPnearby = row[15] < 7;
    return isCol37Valid && isLTPnear && isLTPnearby;
  };

  const applyFilter6 = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] == row[24];

    return isCol37Valid && isEffect;
  };

  // Índices das colunas que queremos exibir (baseado em zero)
  const columnsToShow = [1, 9, 14, 15, 24, 61];
  const columnsToShow_intoogle = [1, 9, 14, 15, 37, 22, 24, 61];

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

  const filteredAndSortedData1 = sortData(data.slice(1).filter(applyFilter1));
  const filteredAndSortedData2 = sortData(data.slice(1).filter(applyFilter2));
  const filteredAndSortedData3 = sortData(data.slice(1).filter(applyFilter3));
  const filteredAndSortedData4 = sortData(data.slice(1).filter(applyFilter4));
  const filteredAndSortedData5 = sortData(data.slice(1).filter(applyFilter5));
  const filteredAndSortedData6 = sortData(data.slice(1).filter(applyFilter6));

  const all_lp_vd = (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCol58Valid = ["LED01", "LED02", "LED03", "LFD01", "LFD02"].includes(
      row[58]
    );
    return isCol37Valid && isCol58Valid;
  };

  const all_lp_DA = (row) => {
    const isCol37Valid = row[37] === "LP";
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
    return isCol37Valid && isCol58Valid;
  };

  const filteredAndSortedData7 = sortData(data.slice(1).filter(all_lp_vd));
  const filteredAndSortedData8 = sortData(data.slice(1).filter(all_lp_DA));

  const midVar = data.slice(1).filter(all_lp_vd);
  const midVar2 = data.slice(1).filter(all_lp_DA);

  const matches = filteredAndSortedData7.length;
  const sum = midVar.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average = matches > 0 ? sum / matches : 0;
  //   setAverageValue(average);

  const matches2 = filteredAndSortedData8.length;
  const sum2 = midVar2.reduce((acc, row) => acc + parseFloat(row[15]) || 0, 0);
  const average2 = matches2 > 0 ? sum2 / matches2 : 0;

  return (
    <MainContainer>
      <HeaderComponent />
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {loading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
      {data.length > 0 && (
        <>
          <h2>EM LTP DTV - RTAT DTV ATUAL {average.toFixed(2)}</h2>
          <table>
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
          <h2>RTAT ATUAL DA - {average2.toFixed(2)}</h2>
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
        </>
      )}

      <div>
        <button onClick={setToggle} class="btn btn-secondary mb-5">
          Casos de DA sem peça OW e LP
        </button>
        {toggle && (
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
        )}

        <button onClick={setToggle1} class="btn btn-secondary mb-5">
          Próximos casos a entrar em LTP
        </button>
        {toggle1 && (
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
        )}
      </div>
    </MainContainer>
  );
};

const MainContainer = styled.div`
  h2 {
    font-weight: 900;
  }
`;
export default HomePage;