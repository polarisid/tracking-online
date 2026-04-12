import {
  formatDateToDDMMYYYY,
  formatDateToDDMMYYYY_tomorrow,
} from "./dateFomatter";

const today = new Date();
const today_Form = formatDateToDDMMYYYY(today);
const tomorrow_Form = formatDateToDDMMYYYY_tomorrow(today);

const SWM_CODES = ["SWM01", "SWM02", "SWM03", "SWM99", "SWD01", "SWD02", "SWD03", "SWD99"];
const HKE_CODE = ["GCT01", "SEO01", "SHD01", "ZHA09"];
const AV_CODES = ["CTV99", "DTV02", "LED01", "LED02", "LED03", "LED85", "LTV01", "LTV02", "LTV99", "PDP01", "AUD01", "AUD04",
  "AUD05", "AUD06", "AUD99", "BDP01", "BTV01", "CTV01", "CTV02", "CTV97", "CTV98", "CTV99", "DLB01", "DPT01", "DTV01", "DTV02", "DVD01",
  "DVD02", "DVD04", "DVD05", "DVD06", "HTS01", "HTS02", "HTS03", "HTS99", "HTV01", "HTV02", "LDI01", "LDI02", "LED01", "LED02", "LED03",
  "LED85", "LPF07", "LPF08", "LPF10", "LTV01", "LTV02", "LTV99", "MON01", "MOT01", "MST01", "PDM01", "PDP01", "PDP02", "PJM01", "PJM99",
  "PJT01", "TFT01", "TFT02", "WTV01", "PDP02", "WTV01", "LED01", "LED02", "LED03", "LFD01", "LFD02", "HTS01", "PJT01", "TFT01",
  "TFT02", "PJT01"];
const RAC_CODES = ["FJM01", "CAC01", "CAC06", "RAC01", "RAC02", "RAC03", "RAM01", "RAO01", "RAS01", "RAW01", "SAC01", "SAC02", "SAC04", "RAO02", "RAO01"];
const REF_CODES = ["REF01", "REF99", "SBS01", "SWC01"];
const MX_CODES = ["NPC01", "NPC02", "NPC03", "THB01", "THB02", "THB03", "THB05", "THB42", "THB43", "THB96", "THB01", "THB02", "THB03",
  "THB04", "THB05", "THB42", "THB43", "THB44", "THB96", "THB98", "THB99", "THBZ1", "THBZ2", "THBZ5", "NPC01", "NPC02", "NPC03", "NPC99",
  "SDT02"];

const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return false;
  // A string original do sistema é DD/MM/YYYY
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  d.setHours(0, 0, 0, 0);
  
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  
  return d < t;
};

const filters = {
  filter_all_outdated_orders: (row) => {
    // Verifica estritamente o ASC Last Appointment Date (row 24)
    const passed24 = isPastDate(row[24]);
    
    // Filtra apenas atendimento em casa "IH" e exclui ST035
    const isIH = row[34] === "IH";
    const isNotComplete = row[11] !== "ST035";
    
    return passed24 && isIH && isNotComplete;
  },

  filter_REF_RAC_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP"; //37 ->39
    const isInHome = row[34] === "IH"; // 34->36
    const isCol58Valid = [...RAC_CODES, ...REF_CODES].includes(row[58]); // 58 -> 60
    const isLTP = row[15] > 4; //15>17
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_REF_RAC_EX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP"; //37 ->39
    const isInHome = row[34] === "IH"; // 34->36
    const isCol58Valid = [...RAC_CODES, ...REF_CODES].includes(row[58]); // 58 -> 60
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
    const isCol58Valid = [...SWM_CODES, ...HKE_CODE].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_DA_noParts: (row) => {
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...SWM_CODES, ...RAC_CODES, ...REF_CODES, ...HKE_CODE].includes(row[58]);
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
    const isEffect = row[22] === row[24];
    const isInHome = row[34] === "IH";
    return isCol37Valid && isEffect && isInHome;
  },
  filter_agenda_today: (row) => {
    const isEffect = row[24] === today_Form;
    const isNOTCI = row[34] !== "CI";
    const isFTF = row[11] === "ST025";
    return isNOTCI && isFTF && isEffect;
    // return isEffect && isFTF && isNOTCI;
  },
  filter_agenda_tomorrow: (row) => {
    const isEffect = row[24] === tomorrow_Form;
    const isNOTCI = row[34] !== "CI";
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
    // const isOutadate = row[22] > today_Form;
    const isInHome = row[34] === "IH";
    return isCol37Valid && isEffect && isInHome;
  },
  filter_CI_VD_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [...AV_CODES].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  },

  filter_CI_COMPLETE_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isRepairComplete = row[11] === "ST035";

    return isCol37Valid && isRepairComplete && isCI;
  },

  filter_CI_COMPLETE_OW_X09: (row) => {
    const isCol37Valid = row[37] === "OW";
    const isCI = row[34] === "CI";
    const isRepairComplete = row[11] === "ST035";
    const isCol53Valid = row[53] === "X09";

    return isCol37Valid && isCol53Valid && isRepairComplete && isCI;
  },

  filter_CI_COMPLETE_OW_NOT_X09: (row) => {
    const isCol37Valid = row[37] === "OW";
    const isCI = row[34] === "CI";
    const isRepairComplete = row[11] === "ST035";
    const isCol53INValid = row[53] !== "X09";

    return isCol37Valid && isCol53INValid && isRepairComplete && isCI;
  },

  filter_VD_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...AV_CODES].includes(row[58]);
    const isLTP = row[15] > 6;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_VD_EX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...AV_CODES].includes(row[58]);
    const isLTP = row[15] > 13;
    return isCol37Valid && isCol58Valid && isLTP && isInHome;
  },
  filter_CI_MX_LTP_LP: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isCI = row[34] === "CI";
    const isCol58Valid = [...MX_CODES].includes(row[58]);
    const isLTP = row[15] > 2;
    return isCol37Valid && isCol58Valid && isLTP && isCI;
  },

  all_lp_vd: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH" || row[34] === "CI";
    const isCol58Valid = [...AV_CODES].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },

  all_lp_DA: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...HKE_CODE, ...RAC_CODES, ...REF_CODES, ...SWM_CODES].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },

  filter_LP_up_to_3_days: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isUpTo3Days = row[15] <= 3;
    const isNotComplete = row[11] !== "ST035";
    const isIH = row[34] === "IH";
    
    return isCol37Valid && isUpTo3Days && isNotComplete && isIH;
  },

  all_lp_AV: (row) => {
    const isCol37Valid = row[37] === "LP";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...AV_CODES].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },

  all_DA_OW: (row) => {
    const isCol37Valid = row[37] === "OW";
    const isInHome = row[34] === "IH";
    const isCol58Valid = [...HKE_CODE, ...RAC_CODES, ...REF_CODES, ...SWM_CODES].includes(row[58]);
    return isCol37Valid && isCol58Valid && isInHome;
  },

  filter_FTF: (row) => {
    const isFTF = row[11] === "ST025";
    const validServiceTypes = ["II", "IH", "RH", "SH"];
    const isValidServiceType = validServiceTypes.includes(row[34]);
    return isFTF && isValidServiceType;
  },

  filter_FTF_Backlog_IH: (row) => {
    const isIH = row[34] === "IH";
    const isBacklog = row[15] > 7;
    return isIH && isBacklog;
  },
};

export default filters;
