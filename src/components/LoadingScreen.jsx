// src/components/LoadingScreen.js
import React, { useEffect, useState } from "react";
import "./LoadingScreen.css"; // Estilos CSS para o componente

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000); // 2 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className={`loading-container ${isVisible ? "visible" : "hidden"}`}>
        <img src="/logo.webp" alt="Loading" className="loading-image" />
        <div class="spinner">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    </>
  );
};

export default LoadingScreen;
