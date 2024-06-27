import React from "react";
import "./App.css";
import HomePage from "./pages/HomePage";
import styled from "styled-components";
const App = () => {
  return (
    <div className="App">
      <HomePage />
      <Footer>
        <p>2024 - Desenvolvido por Daniel Carvalho</p>
        <p>Versão 1.5</p>
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
