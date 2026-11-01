import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { EASE } from "./motion";

/**
 * Mini gráfico de tendência pros KPIs (estilo Power BI "sparkline"): só a
 * linha e um degradê, sem eixos nem tooltip. `data` é uma lista de números
 * (null/NaN são ignorados). Com menos de 2 pontos não desenha nada.
 */
// width é só a largura do viewBox (resolução do desenho); o svg ocupa 100% do pai.
export default function Sparkline({ data = [], color = "#6366f1", width = 120, height = 28, className = "" }) {
  const gid = useId();

  const geometry = useMemo(() => {
    const pts = data.filter((v) => typeof v === "number" && Number.isFinite(v));
    if (pts.length < 2) return null;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const pad = 3;
    const step = (width - pad * 2) / (pts.length - 1);
    const coords = pts.map((v, i) => [pad + i * step, pad + (1 - (v - min) / span) * (height - pad * 2)]);
    const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;
    return { line, area, last: coords[coords.length - 1] };
  }, [data, width, height]);

  if (!geometry) return <div style={{ height }} className={className} aria-hidden="true" />;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path
        d={geometry.area}
        fill={`url(#${gid})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
      />
      <motion.path
        d={geometry.line}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <motion.circle
        cx={geometry.last[0]}
        cy={geometry.last[1]}
        r={2.5}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 400, damping: 18 }}
      />
    </svg>
  );
}
