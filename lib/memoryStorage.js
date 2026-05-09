/**
 * memoryStorage.js
 *
 * In-memory session store for workflow state between UI interactions.
 * Persists CSV data, CSV-to-MOGRT mappings, and folder selections.
 * Cleared when workflow completes or user starts over.
 *
 * Usage:
 *   memoryStorage.setCsvData(csvData);
 *   const data = memoryStorage.getCsvData();
 *   memoryStorage.reset();
 */

/**
 * In-memory storage for workflow session state
 * @type {Object}
 */
let memoryStorage = {
  csvData: null,
  mappingSelection: null,
  folderName: null,

  /**
   * Store parsed CSV data
   * @param {Object} data - CSV data { headers, data }
   */
  setCsvData(data) {
    this.csvData = data;
  },

  /**
   * Retrieve stored CSV data
   * @returns {Object|null} CSV data or null if not set
   */
  getCsvData() {
    return this.csvData;
  },

  /**
   * Store CSV-to-MOGRT column mapping
   * @param {Object} mapping - { mogrtParamName: csvColumnName }
   */
  setMappingSelection(mapping) {
    this.mappingSelection = mapping;
  },

  /**
   * Retrieve stored column mapping
   * @returns {Object|null} Mapping or null if not set
   */
  getMappingSelection() {
    return this.mappingSelection;
  },

  /**
   * Store target folder name
   * @param {string} name - Folder name
   */
  setFolderName(name) {
    this.folderName = name;
  },

  /**
   * Retrieve stored folder name
   * @returns {string|null} Folder name or null if not set
   */
  getFolderName() {
    return this.folderName;
  },

  /**
   * Clear all stored data
   */
  reset() {
    this.csvData = null;
    this.mappingSelection = null;
    this.folderName = null;
    console.log('✅ Memory storage cleared');
  }
};

module.exports = { memoryStorage };
