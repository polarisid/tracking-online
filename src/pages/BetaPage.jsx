import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import "./styles.css";

const BetaPage = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [combinedData, setCombinedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = (e, setFileFunction, setDataFunction) => {
    const uploadedFile = e.target.files[0];
    setFileFunction(uploadedFile);
    setLoading(true);
    setMessage("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const binaryStr = event.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const convertToDate = (value) => {
        const date = XLSX.SSF.parse_date_code(value);
        if (date) {
          return new Date(Date.UTC(date.y, date.m - 1, date.d));
        }
        return null;
      };

      // Colunas que sabemos que devem conter datas
      const dateColumns = [16, 22, 24, 27];
      const isValidDate = (d) => {
        return d instanceof Date && !isNaN(d);
      };

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

      // setDataFunction(sheetData);
      setDataFunction(formattedData);
      setLoading(false);
      setMessage("Carregamento completo!");
    };

    reader.onerror = () => {
      setLoading(false);
      setMessage("Error reading file!");
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const selectSpecificColumns = (data, columnsToShow) => {
    return data.map((row) => {
      return columnsToShow.map((colIndex) => row[colIndex]);
    });
  };

  useEffect(() => {
    if (data1.length > 0) {
      const columnsToShow_complete_repair = [
        1, 9, 14, 15, 37, 22, 34, 24, 27, 44, 45, 46,
      ];
      const data1SelectedCols = selectSpecificColumns(
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

      setCombinedData([headers, ...combined]);
    }
  }, [data1, data2]);

  return (
    <div className="App">
      <div>
        <label htmlFor="file1">Carregar Planilha Principal</label>
        <input
          type="file"
          id="file1"
          onChange={(e) => handleFileUpload(e, setFile1, setData1)}
        />
      </div>
      <div>
        <label htmlFor="file2">Carregar Planilha de Clientes e Cidades</label>
        <input
          type="file"
          id="file2"
          onChange={(e) => handleFileUpload(e, setFile2, setData2)}
        />
      </div>
      {loading && <p>Carregando...</p>}
      {message && <p>{message}</p>}
      {combinedData.length > 0 && (
        <table>
          <thead>
            <tr>
              {combinedData[0].map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {combinedData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BetaPage;
