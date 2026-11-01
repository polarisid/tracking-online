import React, { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";

// Primitivas de animação compartilhadas (estilo 21st.dev): easing "expo out"
// único pro app inteiro, pra tudo ter o mesmo ritmo.
export const EASE = [0.16, 1, 0.3, 1];

/** Entrada com fade + subida suave. `delay` em segundos. */
export function Reveal({ children, delay = 0, y = 12, className = "", ...rest }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export const containerVariants = (gap = 0.045) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: 0.04 } },
});

export const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

/** Container que faz os <StaggerItem> filhos entrarem em cascata. */
export function Stagger({ children, gap = 0.045, className = "", ...rest }) {
  return (
    <motion.div variants={containerVariants(gap)} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "", ...rest }) {
  return (
    <motion.div variants={itemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/**
 * Número que "conta" até o valor novo (de onde parou, não do zero a cada
 * atualização). Valores não numéricos ("—", null) são mostrados como vieram.
 * Respeita prefers-reduced-motion (pula direto pro valor final).
 */
export function AnimatedNumber({ value, decimals = 0, prefix = "", suffix = "", suffixClassName = "", duration = 0.9, className = "" }) {
  const reduce = useReducedMotion();
  const target = value === null || value === undefined || value === "" ? NaN : Number(value);
  const isNumeric = Number.isFinite(target);
  const [shown, setShown] = useState(reduce || !isNumeric ? target : 0);
  const fromRef = useRef(reduce || !isNumeric ? target : 0);

  useEffect(() => {
    if (!isNumeric) return undefined;
    if (reduce) {
      setShown(target);
      fromRef.current = target;
      return undefined;
    }
    const controls = animate(fromRef.current, target, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        fromRef.current = v;
        setShown(v);
      },
    });
    return () => controls.stop();
  }, [target, isNumeric, reduce, duration]);

  if (!isNumeric) {
    return <span className={className}>{value ?? "—"}</span>;
  }
  const text = Number(shown).toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {text}
      {suffix && <span className={suffixClassName}>{suffix}</span>}
    </span>
  );
}
