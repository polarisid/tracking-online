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

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./styles.css";
import * as XLSX from "xlsx";

const localizer = momentLocalizer(moment);

const BetaPage = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState([]);
  const [data, setData] = useState([]);
  const [cityData, setCityData] = useState({});
  const [tableData, setTableData] = useState([]);

  const handleFileUpload = (e, setFileFunction) => {
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

      // Se for o primeiro arquivo
      if (setFileFunction === setFile1) {
        // Colunas que sabemos que devem conter datas
        const dateColumns = [16, 22, 24, 27]; // Ajuste conforme necessário

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
      } else {
        // Se for o segundo arquivo
        // Criar um mapeamento das ordens de serviço para os valores das colunas L e M
        const cityMapping = {};
        sheetData.slice(1).forEach((row) => {
          const orderId = row[1]; // Índice da coluna B
          const city = row[11]; // Índice da coluna L
          const additionalInfo = row[12]; // Índice da coluna M
          cityMapping[orderId] = { city, additionalInfo };
        });

        setCityData(cityMapping);
      }

      setLoading(false);
      setMessage("Carregamento completo!");
    };

    reader.onerror = () => {
      setLoading(false);
      setMessage("Error reading file!");
    };

    reader.readAsBinaryString(uploadedFile);
  };

  useEffect(() => {
    if (data.length > 0) {
      const columnsToShow_complete_repair = [1, 14, 15, 37, 22, 34, 24, 27]; // Índices das colunas a serem exibidas
      const nameColumnIndex = 9; // Índice da coluna do nome do cliente na planilha principal

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
          const date = new Date(row[24]); // Usando o índice da coluna para a data (Y)
          const isValidDate = !isNaN(date);
          const startDate = isValidDate
            ? date
            : new Date(moment(row[24], "DD/MM/YYYY").toDate());
          const orderId = row[1]; // Índice da coluna B

          // Adicionar os valores das colunas L e M da segunda planilha se disponível
          const cityInfo = cityData[orderId] || {
            city: "",
            additionalInfo: "",
          };

          return {
            title: `${row[1] || "Service Order"}${
              cityInfo.city ? ` - ${cityInfo.city}` : ""
            }${cityInfo.additionalInfo ? ` - ${cityInfo.additionalInfo}` : ""}`, // Usando o índice da coluna para o título (B) e adicionando as colunas L e M
            start: startDate,
            end: startDate,
            type: row[34], // Armazenar o tipo para usar no eventPropGetter
          };
        });

      const tableRows = data
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
          const orderId = row[1]; // Índice da coluna B
          const cityInfo = cityData[orderId] || {
            city: "",
            additionalInfo: "",
          };
          return [
            ...columnsToShow_complete_repair.map((index) => row[index]),
            row[nameColumnIndex], // Adiciona o nome do cliente
            cityInfo.city, // Adiciona a cidade do cliente
          ];
        });

      setEvents(formattedEvents);
      setTableData(tableRows);
    }
  }, [data, cityData]);

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

  return (
    <div className="App">
      <input type="file" onChange={(e) => handleFileUpload(e, setFile1)} />
      <input type="file" onChange={(e) => handleFileUpload(e, setFile2)} />
      {loading && <p>Carregando...</p>}
      {message && <p>{message}</p>}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventPropGetter}
      />
      {tableData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Ordem de Serviço</th>
              <th>Coluna 14</th>
              <th>Coluna 15</th>
              <th>Coluna 37</th>
              <th>Coluna 22</th>
              <th>Coluna 34</th>
              <th>Coluna 24</th>
              <th>Coluna 27</th>
              <th>Nome do Cliente</th>
              <th>Cidade do Cliente</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
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
