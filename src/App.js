import React from "react";
import "./App.css";
import PagesRoutes from "./Router";
import styled from "styled-components";
import HeaderComponent from "./components/HeaderComponent";

const App = () => {
  return (
    <div className="App">
      {/* <HeaderComponent /> */}
      {/* <HomePage /> */}
      <PagesRoutes />
      <Footer>
        <p>2024 - Desenvolvido por Daniel Carvalho</p>
        <p>Versão 1.7</p>
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

  background-color: #0093e9;
  background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%);
`;
export default App;
