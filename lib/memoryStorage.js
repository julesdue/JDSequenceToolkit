let storage = {
  csvData: null,
  mappingSelection: null,
  folderName: null,

  setCsvData(data) {
    this.csvData = data;
  },

  getCsvData() {
    return this.csvData;
  },

  setMappingSelection(mapping) {
    this.mappingSelection = mapping;
  },

  getMappingSelection() {
    return this.mappingSelection;
  },

  setFolderName(name) {
    this.folderName = name;
  },

  getFolderName() {
    return this.folderName;
  },

  reset() {
    this.csvData = null;
    this.mappingSelection = null;
    this.folderName = null;
    console.log('✅ Memory storage cleared');
  }
};

module.exports = { memoryStorage };
