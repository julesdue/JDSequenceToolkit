const uxp = require('uxp');

async function openUXPFileDialog() {
  try {
    const fs = uxp.storage;
    const pickedFile = await fs.localFileSystem.getFileForOpening({
      types: ['text/csv', 'text/plain'],
      allowMultiple: false
    });

    if (!pickedFile) {
      console.log('⚠️  File selection cancelled');
      return null;
    }

    console.log(`📂 File selected: ${pickedFile.name}`);

    // Read file content
    const content = await pickedFile.text();
    console.log(`✅ CSV file read: ${content.length} bytes`);
    return content;
  } catch (err) {
    console.error('❌ File dialog error:', err);
    throw err;
  }
}

module.exports = { openUXPFileDialog };
