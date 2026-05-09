/**
 * parseCSV.js
 *
 * Parses CSV string content with auto-detection of delimiter (comma or semicolon).
 * Returns headers and array of row objects for easy column access.
 *
 * Usage:
 *   const { headers, data } = parseCSV(csvString);
 *   data.forEach(row => console.log(row.ColumnName));
 */

/**
 * Parse CSV content into structured data
 * @param {string} csvString - CSV content as string
 * @returns {Object} { headers: Array<string>, data: Array<Object> }
 * @throws {Error} If CSV is empty or parsing fails
 */
function parseCSV(csvString) {
  try {
    const lines = csvString.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Auto-detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    console.log(`📊 Detected delimiter: "${delimiter}"`);

    const headers = firstLine.split(delimiter).map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
    });

    console.log(`✅ CSV parsed: ${headers.length} columns, ${data.length} rows`);
    console.log('Headers:', headers);
    return { headers, data };
  } catch (err) {
    console.error('❌ CSV parsing error:', err);
    throw err;
  }
}

module.exports = { parseCSV };
