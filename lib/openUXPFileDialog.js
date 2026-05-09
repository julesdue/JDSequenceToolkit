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

    // Read file content - try multiple approaches
    let content;

    // Try approach 1: read() method
    if (typeof pickedFile.read === 'function') {
      const arrayBuffer = await pickedFile.read();
      content = new TextDecoder().decode(arrayBuffer);
    }
    // Try approach 2: slice() as Blob
    else if (typeof pickedFile.slice === 'function') {
      const blob = pickedFile.slice();
      content = await blob.text();
    }
    // Fallback: try to read as string directly
    else {
      content = String(pickedFile);
    }

    console.log(`✅ CSV file read: ${content.length} bytes`);
    return content;
  } catch (err) {
    console.error('❌ File dialog error:', err);
    throw err;
  }
}

module.exports = { openUXPFileDialog };
