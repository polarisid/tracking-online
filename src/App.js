import React from "react";
import "./App.css";
import PagesRoutes from "./Router";
import styled from "styled-components";
import HeaderComponent from "./components/HeaderComponent";
import LoadingScreen from "./components/LoadingScreen";

const App = () => {
  return (
    <div className="App">
      <LoadingScreen />

      {/* <HeaderComponent /> */}
      {/* <HomePage /> */}
      <PagesRoutes />
      <Footer>
        <p>2024 - Desenvolvido por Daniel Carvalho</p>
        <p>Versão 2.0</p>
      </Footer>
    </div>
  );
};

const Footer = styled.footer`
  /* background-color: #007bff; */
  width: 100%;
  padding: 1rem;
  text-align: center;
  color: white;

  background-color: #23323d;
  /* background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%); */
`;
export default App;
