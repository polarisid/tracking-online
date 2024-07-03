// import React, { useState } from "react";
// import { Calendar, momentLocalizer } from "react-big-calendar";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// // import "./App.css";
// import "./styles.css";
// import * as XLSX from "xlsx";

// const localizer = momentLocalizer(moment);

// const BetaPage = () => {
//   const [file, setFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [events, setEvents] = useState([]);
//   const [data, setData] = useState([]);

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

//       // Função para verificar se um valor é uma data válida
//       const isValidDate = (d) => {
//         return d instanceof Date && !isNaN(d);
//       };

//       // Função para converter números em datas
//       const convertToDate = (value) => {
//         const date = XLSX.SSF.parse_date_code(value);
//         if (date) {
//           return new Date(Date.UTC(date.y, date.m - 1, date.d));
//         }
//         return null;
//       };

//       // Colunas que sabemos que devem conter datas
//       const dateColumns = [16, 22, 24, 27]; // Ajuste conforme necessário

//       // Formatar as datas corretamente apenas nas colunas especificadas
//       const formattedData = sheetData.map((row) =>
//         row.map((cell, index) => {
//           if (dateColumns.includes(index) && typeof cell === "number") {
//             const date = convertToDate(cell);
//             if (isValidDate(date)) {
//               const day = String(date.getUTCDate()).padStart(2, "0");
//               const month = String(date.getUTCMonth() + 1).padStart(2, "0");
//               const year = date.getUTCFullYear();
//               return `${day}/${month}/${year}`;
//             }
//           }
//           return cell;
//         })
//       );

//       setData(formattedData);
//       setLoading(false);
//       setMessage("Carregamento completo!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   const displayCalendarEvents = () => {
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
//         const date = new Date(row[24]); // Usando o índice da coluna para a data (Y)
//         const isValidDate = !isNaN(date);
//         const startDate = isValidDate
//           ? date
//           : new Date(moment(row[24], "DD/MM/YYYY").toDate());

//         return {
//           title: row[1] || "Service Order", // Usando o índice da coluna para o título (B)
//           start: startDate,
//           end: startDate,
//           type: row[34], // Armazenar o tipo para usar no eventPropGetter
//         };
//       });

//     setEvents(formattedEvents);
//   };

//   const eventPropGetter = (event) => {
//     let className = "";
//     switch (event.type) {
//       case "II":
//         className = "ii-event";
//         break;
//       case "IH":
//         className = "ih-event";
//         break;
//       case "SH":
//         className = "sh-event";
//         break;
//       default:
//         break;
//     }
//     return { className };
//   };

//   return (
//     <div className="App">
//       <input type="file" onChange={handleFileUpload} />
//       <button onClick={displayCalendarEvents} disabled={!data.length}>
//         Mostrar no Calendário
//       </button>
//       {loading && <p>Carregando...</p>}
//       {message && <p>{message}</p>}
//       <Calendar
//         localizer={localizer}
//         events={events}
//         startAccessor="start"
//         endAccessor="end"
//         style={{ height: 500 }}
//         eventPropGetter={eventPropGetter}
//       />
//     </div>
//   );
// };

// export default BetaPage;

// import React, { useState } from "react";
// import { Calendar, momentLocalizer } from "react-big-calendar";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import "./styles.css";
// import * as XLSX from "xlsx";

// const localizer = momentLocalizer(moment);

// const BetaPage = () => {
//   const [file1, setFile1] = useState(null);
//   const [file2, setFile2] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [events, setEvents] = useState([]);
//   const [data, setData] = useState([]);
//   const [cityData, setCityData] = useState({});

//   const handleFile1Upload = (e) => {
//     const uploadedFile = e.target.files[0];
//     setFile1(uploadedFile);
//     setLoading(true);
//     setMessage("");

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryStr = event.target.result;
//       const workbook = XLSX.read(binaryStr, { type: "binary" });

//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       // Função para verificar se um valor é uma data válida
//       const isValidDate = (d) => {
//         return d instanceof Date && !isNaN(d);
//       };

//       // Função para converter números em datas
//       const convertToDate = (value) => {
//         const date = XLSX.SSF.parse_date_code(value);
//         if (date) {
//           return new Date(Date.UTC(date.y, date.m - 1, date.d));
//         }
//         return null;
//       };

//       // Colunas que sabemos que devem conter datas
//       const dateColumns = [16, 22, 24, 27]; // Ajuste conforme necessário

//       // Formatar as datas corretamente apenas nas colunas especificadas
//       const formattedData = sheetData.map((row) =>
//         row.map((cell, index) => {
//           if (dateColumns.includes(index) && typeof cell === "number") {
//             const date = convertToDate(cell);
//             if (isValidDate(date)) {
//               const day = String(date.getUTCDate()).padStart(2, "0");
//               const month = String(date.getUTCMonth() + 1).padStart(2, "0");
//               const year = date.getUTCFullYear();
//               return `${day}/${month}/${year}`;
//             }
//           }
//           return cell;
//         })
//       );

//       setData(formattedData);
//       setLoading(false);
//       setMessage("Carregamento completo!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   const handleFile2Upload = (e) => {
//     const uploadedFile = e.target.files[0];
//     setFile2(uploadedFile);
//     setLoading(true);
//     setMessage("");

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryStr = event.target.result;
//       const workbook = XLSX.read(binaryStr, { type: "binary" });

//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       // Criar um mapeamento das ordens de serviço para os valores das colunas L e M
//       const cityMapping = {};
//       sheetData.slice(1).forEach((row) => {
//         const orderId = row[1]; // Índice da coluna B
//         const city = row[11]; // Índice da coluna L
//         const additionalInfo = row[12]; // Índice da coluna M
//         cityMapping[orderId] = { city, additionalInfo };
//       });

//       setCityData(cityMapping);
//       setLoading(false);
//       setMessage("Carregamento completo!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   const displayCalendarEvents = () => {
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
//         const date = new Date(row[24]); // Usando o índice da coluna para a data (Y)
//         const isValidDate = !isNaN(date);
//         const startDate = isValidDate
//           ? date
//           : new Date(moment(row[24], "DD/MM/YYYY").toDate());
//         const orderId = row[1]; // Índice da coluna B

//         // Adicionar os valores das colunas L e M da segunda planilha
//         const cityInfo = cityData[orderId] || { city: "", additionalInfo: "" };

//         return {
//           title: `${row[1] || "Service Order"} - ${cityInfo.city} - ${
//             cityInfo.additionalInfo
//           }`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
//           start: startDate,
//           end: startDate,
//           type: row[34], // Armazenar o tipo para usar no eventPropGetter
//         };
//       });

//     setEvents(formattedEvents);
//   };

//   const eventPropGetter = (event) => {
//     let className = "";
//     switch (event.type) {
//       case "II":
//         className = "ii-event";
//         break;
//       case "IH":
//         className = "ih-event";
//         break;
//       case "SH":
//         className = "sh-event";
//         break;
//       default:
//         break;
//     }
//     return { className };
//   };

//   return (
//     <div className="App">
//       <input type="file" onChange={handleFile1Upload} />
//       <input type="file" onChange={handleFile2Upload} />
//       <button
//         onClick={displayCalendarEvents}
//         disabled={!data.length || !Object.keys(cityData).length}
//       >
//         Mostrar no Calendário
//       </button>
//       {loading && <p>Carregando...</p>}
//       {message && <p>{message}</p>}
//       <Calendar
//         localizer={localizer}
//         events={events}
//         startAccessor="start"
//         endAccessor="end"
//         style={{ height: 500 }}
//         eventPropGetter={eventPropGetter}
//       />
//     </div>
//   );
// };

// export default BetaPage;

// import React, { useState, useEffect } from "react";
// import * as XLSX from "xlsx";
// import "./styles.css";

// const BetaPage = () => {
//   const [file1, setFile1] = useState(null);
//   const [file2, setFile2] = useState(null);
//   const [data1, setData1] = useState([]);
//   const [data2, setData2] = useState([]);
//   const [combinedData, setCombinedData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleFileUpload = (e, setFileFunction, setDataFunction) => {
//     const uploadedFile = e.target.files[0];
//     setFileFunction(uploadedFile);
//     setLoading(true);
//     setMessage("");

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryStr = event.target.result;
//       const workbook = XLSX.read(binaryStr, { type: "binary" });

//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       setDataFunction(sheetData);
//       setLoading(false);
//       setMessage("Carregamento completo!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   const removeEmptyColumns = (data) => {
//     const transposed = data[0].map((_, colIndex) =>
//       data.map((row) => row[colIndex])
//     );
//     const nonEmptyCols = transposed.filter((col) =>
//       col.some((cell) => cell !== null && cell !== undefined && cell !== "")
//     );
//     return nonEmptyCols[0].map((_, rowIndex) =>
//       nonEmptyCols.map((col) => col[rowIndex])
//     );
//   };

//   useEffect(() => {
//     if (data1.length > 0) {
//       const data1WithoutEmptyCols = removeEmptyColumns(data1);
//       const headers = [
//         ...data1WithoutEmptyCols[0],
//         "Nome do Cliente",
//         "Cidade do Cliente",
//       ];
//       const dataMapping = data2.slice(1).reduce((acc, row) => {
//         acc[row[1]] = { nome: row[11], cidade: row[12] }; // Mapeando pelo número da ordem de serviço
//         return acc;
//       }, {});

//       const combined = data1WithoutEmptyCols.slice(1).map((row) => {
//         const orderId = row[1]; // Índice da coluna do número da ordem de serviço
//         const additionalData = dataMapping[orderId] || { nome: "", cidade: "" };
//         return [...row, additionalData.nome, additionalData.cidade];
//       });

//       setCombinedData([headers, ...combined]);
//     }
//   }, [data1, data2]);

//   return (
//     <div className="App">
//       <div>
//         <label htmlFor="file1">Carregar Planilha Principal</label>
//         <input
//           type="file"
//           id="file1"
//           onChange={(e) => handleFileUpload(e, setFile1, setData1)}
//         />
//       </div>
//       <div>
//         <label htmlFor="file2">Carregar Planilha de Clientes e Cidades</label>
//         <input
//           type="file"
//           id="file2"
//           onChange={(e) => handleFileUpload(e, setFile2, setData2)}
//         />
//       </div>
//       {loading && <p>Carregando...</p>}
//       {message && <p>{message}</p>}
//       {combinedData.length > 0 && (
//         <table>
//           <thead>
//             <tr>
//               {combinedData[0].map((header, index) => (
//                 <th key={index}>{header}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {combinedData.slice(1).map((row, rowIndex) => (
//               <tr key={rowIndex}>
//                 {row.map((cell, cellIndex) => (
//                   <td key={cellIndex}>{cell}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default BetaPage;

// import React, { useState, useEffect } from "react";
// import * as XLSX from "xlsx";
// import "./styles.css";

// const BetaPage = () => {
//   const [file1, setFile1] = useState(null);
//   const [file2, setFile2] = useState(null);
//   const [data1, setData1] = useState([]);
//   const [data2, setData2] = useState([]);
//   const [combinedData, setCombinedData] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");

//   const handleFileUpload = (e, setFileFunction, setDataFunction) => {
//     const uploadedFile = e.target.files[0];
//     setFileFunction(uploadedFile);
//     setLoading(true);
//     setMessage("");

//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryStr = event.target.result;
//       const workbook = XLSX.read(binaryStr, { type: "binary" });

//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//       setDataFunction(sheetData);
//       setLoading(false);
//       setMessage("Carregamento completo!");
//     };

//     reader.onerror = () => {
//       setLoading(false);
//       setMessage("Error reading file!");
//     };

//     reader.readAsBinaryString(uploadedFile);
//   };

//   const selectSpecificColumns = (data, columnsToShow) => {
//     return data.map((row) => {
//       return columnsToShow.map((colIndex) => row[colIndex]);
//     });
//   };

//   useEffect(() => {
//     if (data1.length > 0) {
//       const columnsToShow_complete_repair = [1, 9, 14, 15, 37, 22, 34, 24, 27];
//       const data1SelectedCols = selectSpecificColumns(
//         data1,
//         columnsToShow_complete_repair
//       );

//       const headers = [
//         ...columnsToShow_complete_repair.map((index) => data1[0][index]),
//         "Nome do Cliente",
//         "Cidade do Cliente",
//       ];

//       const dataMapping = data2.slice(1).reduce((acc, row) => {
//         acc[row[1]] = { nome: row[11], cidade: row[12] }; // Mapeando pelo número da ordem de serviço
//         return acc;
//       }, {});

//       const combined = data1SelectedCols.slice(1).map((row, rowIndex) => {
//         const orderId = data1[rowIndex + 1][1]; // Índice da coluna do número da ordem de serviço
//         const additionalData = dataMapping[orderId] || { nome: "", cidade: "" };
//         return [...row, additionalData.nome, additionalData.cidade];
//       });

//       setCombinedData([headers, ...combined]);
//     }
//   }, [data1, data2]);

//   return (
//     <div className="App">
//       <div>
//         <label htmlFor="file1">Carregar Planilha Principal</label>
//         <input
//           type="file"
//           id="file1"
//           onChange={(e) => handleFileUpload(e, setFile1, setData1)}
//         />
//       </div>
//       <div>
//         <label htmlFor="file2">Carregar Planilha de Clientes e Cidades</label>
//         <input
//           type="file"
//           id="file2"
//           onChange={(e) => handleFileUpload(e, setFile2, setData2)}
//         />
//       </div>
//       {loading && <p>Carregando...</p>}
//       {message && <p>{message}</p>}
//       {combinedData.length > 0 && (
//         <table>
//           <thead>
//             <tr>
//               {combinedData[0].map((header, index) => (
//                 <th key={index}>{header}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {combinedData.slice(1).map((row, rowIndex) => (
//               <tr key={rowIndex}>
//                 {row.map((cell, cellIndex) => (
//                   <td key={cellIndex}>{cell}</td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// export default BetaPage;

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
