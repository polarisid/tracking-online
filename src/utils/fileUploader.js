import * as XLSX from "xlsx";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
function handleFileUpload(
  e,
  setFileFunction,
  setDataFunction,
  setLoading,
  setMessage,
  isAppend = false
) {
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
    const dateColumns = [16, 22, 24, 27,150];
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

            return `${month}/${day}/${year}`;
          }
        }
        return cell;
      })
    );

    // Mapeamentos para tradução de status e reason
    const STATUS_MAP = {
      'ST015': 'Acknowledge(ASC)',
      'ST025': 'Engineer Assigned',
      'ST030': 'Pending',
      'ST035': 'Repair Completed'
    };

    const INVERSE_STATUS_MAP = {
      'Acknowledge(ASC)': 'ST015',
      'Engineer Assigned': 'ST025',
      'Pending': 'ST030',
      'Repair Completed': 'ST035'
    };

    const REASON_MAP = {
      'HE004': 'Appointment Date is set',
      'HE005': 'Repair in progress',
      'HP030': 'Waiting for Confirmation from customer',
      'HEZ03': 'FTF(Ready to go)'
    };

    const INVERSE_REASON_MAP = {
      'Appointment Date is set': 'HE004',
      'Repair in progress': 'HE005',
      'Waiting for Confirmation from customer': 'HP030',
      'FTF(Ready to go)': 'HEZ03'
    };

    // Aplicar traduções nas linhas (ignorando o cabeçalho)
    for (let i = 1; i < formattedData.length; i++) {
      const row = formattedData[i];
      if (!row) continue;

      const statusCode = row[11];
      const statusVal = row[8];
      const reasonCode = row[13];
      const reasonVal = row[14];

      if (statusCode && STATUS_MAP[statusCode]) {
        row[8] = STATUS_MAP[statusCode];
      } else if (statusVal && INVERSE_STATUS_MAP[statusVal]) {
        row[11] = INVERSE_STATUS_MAP[statusVal];
      }

      if (reasonCode && REASON_MAP[reasonCode]) {
        row[14] = REASON_MAP[reasonCode];
      } else if (reasonVal && INVERSE_REASON_MAP[reasonVal]) {
        row[13] = INVERSE_REASON_MAP[reasonVal];
      }
    }

    if (isAppend) {
      setDataFunction(prevData => {
        if (!prevData || prevData.length === 0) return formattedData;
        return [...prevData, ...formattedData.slice(1)];
      });
    } else {
      setDataFunction(formattedData);
    }
    setLoading(false);
    setMessage(<DoneOutlineIcon />);
  };

  reader.onerror = () => {
    setLoading(false);
    setMessage("Error reading file!");
  };

  reader.readAsBinaryString(uploadedFile);
}
export default handleFileUpload;
