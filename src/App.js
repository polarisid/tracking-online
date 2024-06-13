// import React, { useState } from "react";
// import * as XLSX from "xlsx";
// import "./App.css";

// const App = () => {
//   const [file, setFile] = useState(null);
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleFileUpload = (e) => {
//     const uploadedFile = e.target.files[0];
//     setFile(uploadedFile);
//     setLoading(true);
//     setMessage("");

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryStr = event.target.result;
//       const workbook = XLSX.read(binaryStr, { type: "binary" });

//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       setData(sheetData);
//       setLoading(false);
//       setMessage("Upload successful!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   // Função para aplicar o filtro na coluna 37 e 58
//   const applyFilter = (row) => {
//     const isCol37Valid = row[36] === "LP";
//     const isLTP = row[14] > 6;
//     const isCol58Valid = ["LED01", "LED02", "LED03"].includes(row[57]);
//     return isCol37Valid && isCol58Valid && isLTP;
//   };

//   // Índices das colunas que queremos exibir (baseado em zero)
//   const columnsToShow = [1, 8, 13, 14, 36];

//   // Função para ordenar as linhas com base na coluna 15 (índice 14)
//   const sortData = (filteredData) => {
//     return filteredData.sort((a, b) => {
//       const valA = a[14];
//       const valB = b[14];
//       if (valA > valB) return -1;
//       if (valA < valB) return 1;
//       return 0;
//     });
//   };

//   const filteredAndSortedData = sortData(data.slice(1).filter(applyFilter));

//   return (
//     <div className="App">
//       <h1>Spreadsheet Analyzer</h1>
//       <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
//       {loading && <p>Uploading...</p>}
//       {message && <p>{message}</p>}
//       {data.length > 0 && (
//         <table>
//           <thead>
//             <tr>
//               {columnsToShow.map((colIndex) => (
//                 <th key={colIndex}>{data[0][colIndex]}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {filteredAndSortedData.map((row, rowIndex) => (
//               <tr key={rowIndex}>
//                 {columnsToShow.map((colIndex) => (
//                   <td key={colIndex}>{row[colIndex]}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default App;

import React, { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
    const isCol37Valid = row[36] === "LP";
    const isCol58Valid = ["LED01", "LED02", "LED03"].includes(row[57]);
    const isLTP = row[14] > 6;
    return isCol37Valid && isCol58Valid && isLTP;
  };

  // Função para aplicar o filtro na coluna 37 e 58 para a segunda tabela
  const applyFilter2 = (row) => {
    const isCol37Valid = row[36] === "LP";
    const isCol58Valid = [
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "REF01",
      "REF02",
    ].includes(row[57]);
    const isLTP = row[14] > 4;
    return isCol37Valid && isCol58Valid && isLTP;
  };

  // Função para aplicar o filtro na coluna 37 e 58 para a terceira tabela
  const applyFilter3 = (row) => {
    const isCol37Valid = row[36] === "LP";
    const isCol58Valid = ["SWM01", "SWM03"].includes(row[57]);
    const isLTP = row[14] > 6;
    return isCol37Valid && isCol58Valid && isLTP;
  };

  // Índices das colunas que queremos exibir (baseado em zero)
  const columnsToShow = [1, 8, 13, 14, 36, 60];

  // Função para ordenar as linhas com base na coluna 15 (índice 14)
  const sortData = (filteredData) => {
    return filteredData.sort((a, b) => {
      const valA = a[14];
      const valB = b[14];
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });
  };

  const filteredAndSortedData1 = sortData(data.slice(1).filter(applyFilter1));
  const filteredAndSortedData2 = sortData(data.slice(1).filter(applyFilter2));
  const filteredAndSortedData3 = sortData(data.slice(1).filter(applyFilter3));

  return (
    <div className="App">
      <h1>Spreadsheet Analyzer</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
      {loading && <p>Uploading...</p>}
      {message && <p>{message}</p>}
      {data.length > 0 && (
        <>
          <h2>Table 1</h2>
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

          <h2>Table 2</h2>
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

          <h2>Table 3</h2>
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
        </>
      )}
    </div>
  );
};

export default App;
