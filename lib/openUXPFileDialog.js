const uxp = require('uxp');

async function openUXPFileDialog() {
  try {
    const fs = uxp.storage;
    const pickedFile = await fs.localFileSystem.getFileForOpening({
      allowMultiple: false
    });

    if (!pickedFile) {
      console.log('⚠️  File selection cancelled');
      return null;
    }

    console.log(`📂 File selected: ${pickedFile.name}`);

    // Read file content using UXP API
    const content = await pickedFile.getContents('utf8');
    console.log(`✅ CSV file read: ${content.length} bytes`);
    return content;
  } catch (err) {
    console.error('❌ File dialog error:', err);
    throw err;
  }
}

module.exports = { openUXPFileDialog };
