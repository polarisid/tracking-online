import React from "react";

// Marca do Tracking Online: um pin de localização (tracking) com barras
// ascendentes internas (analítico/performance). Traçado em negative-space
// (fill-rule evenodd) — funciona sobre o gradiente ou em qualquer fundo.
const MARK_D =
  "M12 2C7.58 2 4 5.58 4 10c0 5.4 6.2 10.6 7.4 11.6a1 1 0 0 0 1.2 0C13.8 20.6 20 15.4 20 10 20 5.58 16.42 2 12 2Z " +
  "M8.8 10.2h1.7v2.6H8.8z M11.2 8.4h1.7v4.4H11.2z M13.6 6.8h1.7v6H13.6z";

// Só o glifo (ex: dentro do badge animado do loader).
export function LogoMark({ size = 24, color = "#fff", className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={MARK_D} fill={color} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// Badge completo: o glifo dentro do tile em gradiente azul→índigo.
export default function Logo({ size = 36, radius, className = "", style = {}, glow = true }) {
  const r = radius != null ? radius : Math.round(size * 0.28);
  return (
    <span
      className={className}
      aria-label="Tracking Online"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        flex: "0 0 auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(140deg,#3b82f6 0%,#6366f1 100%)",
        boxShadow: glow
          ? "0 8px 20px -6px rgba(59,130,246,0.5), inset 0 1px 0 rgba(255,255,255,0.25)"
          : "inset 0 1px 0 rgba(255,255,255,0.25)",
        ...style,
      }}
    >
      <LogoMark size={Math.round(size * 0.6)} />
    </span>
  );
}
