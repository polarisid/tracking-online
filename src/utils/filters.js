import {
  formatDateToDDMMYYYY,
  formatDateToDDMMYYYY_tomorrow,
} from "./dateFomatter";

const today = new Date();
const today_Form = formatDateToDDMMYYYY(today);
const tomorrow_Form = formatDateToDDMMYYYY_tomorrow(today);

const filters = {
  // filter_REF_RAC_LTP_LP: (row) => {
  //   const isCol37Valid = row[37] === "LP";
  //   const isInHome = row[34] === "IH";
  //   const isCol58Valid = [
  //     "FJM01",
  //     "RAO01",
  //     "RAO02",
  //     "RAC01",
  //     "RAC02",
  //     "RAC03",
  //     "RAS01",
  //     "SBS01",
  //     "REF01",
  //     "REF02",
  //   ].includes(row[58]);
  //   const isLTP = row[15] > 4;
  //   return isCol37Valid && isCol58Valid && isLTP && isInHome;
  // },
  filter_REF_RAC_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP"; //37 ->39
    const isInHome = row[34] === "IH"; // 34->36
    const isCol58Valid = [
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]); // 58 -> 60
    const isLTP = row[15] > 4; //15>17
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_REF_RAC_EX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP"; //37 ->39
    const isInHome = row[34] === "IH"; // 34->36
    const isCol58Valid = [
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]); // 58 -> 60
    const isLTP = row[15] > 9; //15>17
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_Customer_outdated: (row) => {
    const isCol14Valid = row[13] === "HP030";
    const isLTP = row[15] > 1;
    return isCol14Valid && isLTP;
  },
  filter_repair_complete_outdated: (row) => {
    const isCol14Valid = row[13] === "HL005";
    const isOutadate = row[27] < today_Form;
    return isCol14Valid && isOutadate;
  },
  filter_WSM_LP_LTP: (row) => {
    const isInHome = row[34] === "IH";
    const isCol37Valid = row[37] === "LP";
    const isCol58Valid = ["SWM01", "SWM03"].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_DA_noParts: (row) => {
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "SWM01",
      "SWM03",
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]);
    const notParts = row[61] == null;
    return isCol58Valid && notParts && isInHome;
  },
  filter_allNext_LTP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isLTPnear = row[15] > 2;
    const isLTPnearby = row[15] < 7;
    return isCol37Valid && isLTPnear && isLTPnearby && isInHome;
  },
  filter_isEffect_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] == row[24];
    const isInHome = row[34] === "IH";
    return isCol37Valid && isEffect && isInHome;
  },
  filter_agenda_today: (row) => {
    const isEffect = row[24] === today_Form;
    const isNOTCI = row[34] != "CI";
    const isFTF = row[11] === "ST025";
    return isNOTCI && isFTF && isEffect;
    // return isEffect && isFTF && isNOTCI;
  },
  filter_agenda_tomorrow: (row) => {
    const isEffect = row[24] === tomorrow_Form;
    const isNOTCI = row[34] != "CI";
    const isFTF = row[11] === "ST025";
    return isEffect && isFTF && isNOTCI;
  },
  filter_near_isEffect_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] > row[24];
    const isInHome = row[34] === "IH";
    return isCol37Valid && isEffect && isInHome;
  },
  filter_potential_first_visit: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isTODAY = row[27] === today_Form;
    const isFromToday = row[16] === today_Form;
    const isInHome = row[34] === "CI";
    return isCol37Valid && isTODAY && isInHome && isFromToday;
  },
  filter_next_isEffect_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isEffect = row[22] < row[24];
    const isOutadate = row[22] > today_Form;
    const isInHome = row[34] === "IH";
    return isCol37Valid && isEffect && isInHome;
  },
  filter_CI_VD_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
      "PJT01",
    ].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  },

  // filter_VD_LTP_LP: (row) => {
  //   const isCol37Valid = row[37] === "LP";
  //   const isInHome = row[34] === "IH";
  //   const isCol58Valid = [
  //     "LED01",
  //     "LED02",
  //     "LED03",
  //     "LFD01",
  //     "LFD02",
  //     "HTS01",
  //     "PJT01",
  //     "TFT01",
  //     "TFT02",
  //   ].includes(row[58]);
  //   const isLTP = row[15] > 6;
  //   return isCol37Valid && isCol58Valid && isLTP && isInHome;
  // },
  filter_VD_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
      "PJT01",
    ].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_VD_EX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
      "PJT01",
      "PJT02",
    ].includes(row[58]);
    const isLTP = row[15] > 13;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_CI_MX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [
      "NPC01",
      "NPC02",
      "NPC03",
      "THB01",
      "THB02",
      "THB03",
      "THB05",
      "THB42",
      "THB43",
      "THB96",
    ].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  },

  all_lp_vd: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH" || row[34] === "CI";
    const isCol58Valid = [
      "LED01",
      "LED02",
      "LED03",
      "LFD01",
      "LFD02",
      "HTS01",
      "PJT01",
      "TFT01",
      "TFT02",
      "PJT01",
      "PJT02",
    ].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },

  all_lp_DA: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [
      "SWM01",
      "SWM03",
      "FJM01",
      "RAO01",
      "RAO02",
      "RAC01",
      "RAC02",
      "RAC03",
      "RAS01",
      "SBS01",
      "REF01",
      "REF02",
    ].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },
};

export default filters;
