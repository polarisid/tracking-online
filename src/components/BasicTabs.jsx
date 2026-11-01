import * as React from "react";
import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./ui/motion";

// Cada filho direto é uma aba (indexada por posição); só a ativa é montada.
// A troca é animada: a que sai some rápido (sem esperar), a nova entra subindo
// suave — dá a sensação de "navegar" em vez de o conteúdo piscar.
export default function BasicTabs({ children, activeTab }) {
  const value = activeTab !== undefined ? activeTab : 0;
  const childrenArray = React.Children.toArray(children);
  const active = childrenArray[value];

  return (
    <div className="w-full">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={value}
          role="tabpanel"
          id={`tab-panel-${value}`}
          aria-labelledby={`tab-${value}`}
          className="pt-4"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.38, ease: EASE } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
        >
          {active}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

BasicTabs.propTypes = {
  children: PropTypes.node,
  activeTab: PropTypes.number,
};
