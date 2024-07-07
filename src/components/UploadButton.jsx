import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import styled from "styled-components";
export const UploadButton = ({ onChange, text }) => (
  <Container>
    <Button
      component="label"
      variant="contained"
      startIcon={<CloudUploadIcon />}
    >
      {text}
      <VisuallyHiddenInput type="file" onChange={onChange} />
    </Button>
  </Container>
);

const Container = styled.div`
  margin: 10px;
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
