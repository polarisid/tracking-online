import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";

// Icons
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import PieChartIcon from "@mui/icons-material/PieChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const tabConfig = [
  { label: "Indicadores", icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
  { label: "Análise", icon: <TroubleshootIcon sx={{ fontSize: 18 }} /> },
  { label: "Gráficos", icon: <PieChartIcon sx={{ fontSize: 18 }} /> },
  { label: "Calendário", icon: <CalendarMonthIcon sx={{ fontSize: 18 }} /> },
];

function CustomTabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function BasicTabs({ children }) {
  const [value, setValue] = React.useState(0);
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="w-full">
      {/* Tab Bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4">
          <nav className="flex gap-1" aria-label="Tabs">
            {tabConfig.map((tab, index) => {
              const isActive = value === index;
              return (
                <button
                  key={index}
                  onClick={() => setValue(index)}
                  id={`tab-${index}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tab-panel-${index}`}
                  className={`
                    relative flex items-center gap-2 px-4 py-3
                    text-sm font-semibold tracking-wide
                    transition-all duration-300 ease-out
                    border-b-2 -mb-px
                    ${isActive
                      ? 'text-blue-600 border-blue-500'
                      : 'text-slate-400 border-transparent hover:text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <span className={`transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Panels */}
      {childrenArray.map((child, index) => (
        <CustomTabPanel key={index} value={value} index={index}>
          {child}
        </CustomTabPanel>
      ))}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
