import React from "react";
import "./App.css";
import PagesRoutes from "./Router";
import styled from "styled-components";
import HeaderComponent from "./components/HeaderComponent";
import LoadingScreen from "./components/LoadingScreen";
import { HomeProvider } from "./Contexts/HomeContext";
const App = () => {
  return (
    <>
      <HomeProvider>
        <div className="App">
          <LoadingScreen />

          {/* <HeaderComponent /> */}
          {/* <HomePage /> */}
          <PagesRoutes />
          <Footer>
            <p>2025 - Desenvolvido por Daniel Carvalho</p>
            <p>Versão 2.1.2</p>
          </Footer>
        </div>
      </HomeProvider>
    </>
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
