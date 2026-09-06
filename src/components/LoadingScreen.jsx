// src/components/LoadingScreen.jsx
import React, { useEffect, useState } from "react";
import { LogoMark } from "./Logo";
import "./LoadingScreen.css";

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`ld-root ${isVisible ? "ld-visible" : "ld-hidden"}`} aria-hidden={!isVisible}>
      {/* Glows ambiente (mesma linguagem da tela de login) */}
      <div className="ld-glow ld-glow-1" />
      <div className="ld-glow ld-glow-2" />

      <div className="ld-stack">
        <div className="ld-logo-wrap">
          <div className="ld-track" />
          <div className="ld-orbit" />
          <div className="ld-pulse" />
          <div className="ld-logo">
            <LogoMark size={40} />
          </div>
        </div>

        <div className="ld-word">
          <span className="ld-word-1">Tracking</span>
          <span className="ld-word-2">Online</span>
        </div>

        <div className="ld-dots" role="status" aria-label="Carregando">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
