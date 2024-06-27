import filters from "./filters";

const sortData = (filteredData) => {
  return filteredData.sort((a, b) => {
    const valA = a[15];
    const valB = b[15];
    if (valA > valB) return -1;
    if (valA < valB) return 1;
    return 0;
  });
};

const tables = {};
