import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import styled from "styled-components";
export const UploadButton = ({ onChange, text }) => (
  <Container>
    <ButtonStyled
      component="label"
      // variant="contained"
      // variant="outlined"
      startIcon={<CloudUploadIcon />}
    >
      {text}
      <VisuallyHiddenInput type="file" onChange={onChange} />
    </ButtonStyled>
  </Container>
);

const Container = styled.div`
  /* margin: 10px; */
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
  backgroundColor: "#5a5a5a",
});

const ButtonStyled = styled(Button)`
  background-color: "#23323D";
`;
