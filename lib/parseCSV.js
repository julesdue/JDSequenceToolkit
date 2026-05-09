function parseCSV(csvString) {
  try {
    const lines = csvString.trim().split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
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
