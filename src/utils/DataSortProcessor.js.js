class DataSortProcessor {
  constructor(data) {
    this.data = data.slice(1);
  }

  sortData(filteredData) {
    return filteredData.sort((a, b) => {
      const valA = Number(a[15]) || 0;
      const valB = Number(b[15]) || 0;
      return valB - valA;
    });
  }

  filterAndSortData(filterFunction) {
    return this.sortData(this.data.filter(filterFunction));
  }
}

export default DataSortProcessor;
