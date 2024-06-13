import styled from "styled-components";

const HeaderComponent = () => {
  return (
    <>
      <Header>
        <Title>Tracking Base</Title>
      </Header>
    </>
  );
};
const Title = styled.h1`
  font-weight: 600;
  font-size: 24px;
  color: white;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* background-color: #007bff; */
  -webkit-box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);
  -moz-box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);
  box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);

  font-family: "Rubik", sans-serif;
  font-optical-sizing: auto;
  font-weight: 800;
  font-style: normal;

  background-color: #0093e9;
  background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%);
`;
export default HeaderComponent;
