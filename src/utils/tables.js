import filters from "./filters";

const sortData = (filteredData) => {
  return filteredData.sort((a, b) => {
    const valA = Number(a[15]) || 0;
    const valB = Number(b[15]) || 0;
    return valB - valA;
  });
};

const tables = {};
