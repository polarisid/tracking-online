import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";

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

export default function BasicTabs({ children, activeTab }) {
  const value = activeTab !== undefined ? activeTab : 0;
  const childrenArray = React.Children.toArray(children);

  return (
    <div className="w-full">
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
