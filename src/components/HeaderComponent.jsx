import styled from "styled-components";

const HeaderComponent = () => {
  return (
    <TopBar>
      <Header>
        <Title>Tracking Online</Title>
      </Header>
    </TopBar>
  );
};
const Title = styled.h1`
  font-weight: 600;
  font-size: 24px;
  color: white;
  /* background-color: #0093e9;
  background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%); */
  border-radius: 0px 0px 5px 5px;
  padding: 10px;
  /* h1 {
    position: relative;
  } */
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const Header = styled.div`
  display: flex;

  /* flex-direction: column; */
  width: 100%;
  /* height: 15px; */
  align-items: center;
  /* justify-content: center; */
  /* padding: 20px; */
  /* background-color: #007bff; */
  -webkit-box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);
  -moz-box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);
  box-shadow: 0px 9px 17px -7px rgba(0, 0, 0, 0.33);

  font-family: "Rubik", sans-serif;
  font-optical-sizing: auto;
  font-weight: 800;
  font-style: normal;

  /* background-color: #0093e9; */
  background-color: #23323d;
  /* background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%); */
  h2 {
    margin-right: 10px;
  }
`;
export default HeaderComponent;
