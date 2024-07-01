class DataSortProcessor {
  constructor(data) {
    this.data = data.slice(1);
  }

  sortData(filteredData) {
    return filteredData.sort((a, b) => {
      const valA = a[15];
      const valB = b[15];
      if (valA > valB) return -1;
      if (valA < valB) return 1;
      return 0;
    });
  }

  filterAndSortData(filterFunction) {
    return this.sortData(this.data.filter(filterFunction));
  }
}

export default DataSortProcessor;
