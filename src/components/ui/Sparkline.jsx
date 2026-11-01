import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { EASE } from "./motion";

/**
 * Mini gráfico de tendência pros KPIs (estilo Power BI "sparkline"): só a
 * linha e um degradê, sem eixos nem tooltip. `data` é uma lista de números
 * (null/NaN são ignorados). Com menos de 2 pontos não desenha nada.
 */
// O svg ocupa 100% do pai e o desenho usa a largura REAL medida (ResizeObserver):
// esticar um viewBox fixo achatava o ponto final em elipse e afinava o traço.
// `width` é só a largura inicial, antes da primeira medição.
export default function Sparkline({ data = [], color = "#6366f1", width: initialWidth = 120, height = 28, className = "" }) {
  const gid = useId();
  const ref = useRef(null);
  const [width, setWidth] = useState(initialWidth);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const pts = data.filter((v) => typeof v === "number" && Number.isFinite(v));
    if (pts.length < 2) return null;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const pad = 4;
    const step = (width - pad * 2) / (pts.length - 1);
    const coords = pts.map((v, i) => [pad + i * step, pad + (1 - (v - min) / span) * (height - pad * 2)]);
    const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${coords[coords.length - 1][0].toFixed(1)},${height} L${coords[0][0].toFixed(1)},${height} Z`;
    return { line, area, last: coords[coords.length - 1] };
  }, [data, width, height]);

  // O wrapper (medido) existe sempre, com ou sem dados, pra o observer não se perder.
  if (!geometry) return <div ref={ref} style={{ height }} className={className} aria-hidden="true" />;

  return (
    <div ref={ref} style={{ height }} className={className} aria-hidden="true">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
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
    </div>
  );
}
