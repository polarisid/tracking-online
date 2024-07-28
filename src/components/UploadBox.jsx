import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
// import useHomeContext from "../hooks/UseHomeContext";
import { UploadButton } from "../components/UploadButton";
import DownloadIcon from "@mui/icons-material/Download";

export default function UploadBoxMenu({
  handleFileUpload_beta,
  downloadExcel,
  setFile1,
  setFile2,
  setData2,
  setData1,
  loading,
  message,
}) {
  // const { file1, setFile1 } = useHomeContext();
  // const { file2, setFile2 } = useHomeContext();
  // const { data1, setData1 } = useHomeContext();
  // const { data2, setData2 } = useHomeContext();
  // const { combinedData, setCombinedData } = useHomeContext();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
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
        <MenuItem onClick={handleClose}>
          <UploadButton
            onChange={(e) => handleFileUpload_beta(e, setFile1, setData1)}
            text={"Carregar A. Pending"}
          />
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <UploadButton
            onChange={(e) => handleFileUpload_beta(e, setFile2, setData2)}
            text={"Carregar Cidades "}
          />
        </MenuItem>

        {/* <MenuItem onClick={(e) => downloadExcel(combinedData)}>
          Download
          <DownloadIcon />
        </MenuItem> */}
      </Menu>
      {loading && <p>Carregando...</p>}
      {message && <p>{message}</p>}
    </div>
  );
}
