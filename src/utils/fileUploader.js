import * as XLSX from "xlsx";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
function handleFileUpload(
  e,
  setFileFunction,
  setDataFunction,
  setLoading,
  setMessage
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
    setMessage(<DoneOutlineIcon />);
  };

  reader.onerror = () => {
    setLoading(false);
    setMessage("Error reading file!");
  };

  reader.readAsBinaryString(uploadedFile);
}
export default handleFileUpload;
