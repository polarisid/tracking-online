import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import useHomeContext from "../hooks/UseHomeContext";
// import SwipeableViews from "react-swipeable-views";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TroubleshootIcon from "@mui/icons-material/Troubleshoot";
import styled from "styled-components";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;
  const { visibleComponents, setVisibleComponents } = useHomeContext();

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs({ children, child }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleChangeIndex = (index) => {
    setValue(index);
  };
  const childrenArray = React.Children.toArray(children);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
          //   variant="fullWidth"
        >
          <Tab
            label={`Indicadores `}
            icon={<TrendingUpIcon />}
            iconPosition="end"
            {...a11yProps(0)}
          />
          <Tab
            label="Análise"
            icon={<TroubleshootIcon />}
            iconPosition="end"
            {...a11yProps(1)}
          />
          <Tab
            label="Calendário"
            {...a11yProps(2)}
            icon={<CalendarMonthIcon />}
            iconPosition="end"
          />
        </Tabs>
      </Box>
      {/* <SwipeableViews
        // axis={theme.direction === "rtl" ? "x-reverse" : "x"}
        index={value}
        onChangeIndex={handleChangeIndex}
      > */}
      <CustomTabPanel value={value} index={0}>
        {childrenArray[0]}
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        {childrenArray[1]}
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        {childrenArray[2]}
      </CustomTabPanel>
      {/* </SwipeableViews> */}
    </Box>
  );
}
