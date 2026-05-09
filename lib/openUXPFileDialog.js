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

    // Read file content
    let content;

    // Try using read() method
    if (typeof pickedFile.read === 'function') {
      const buffer = await pickedFile.read();

      // Convert buffer to string
      if (buffer instanceof ArrayBuffer) {
        const view = new Uint8Array(buffer);
        content = String.fromCharCode.apply(null, view);
      } else if (typeof buffer === 'string') {
        content = buffer;
      } else {
        content = String(buffer);
      }
    } else {
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
