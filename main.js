//global objects.
const os = require('os');
const ppro = require("premierepro");
const path = require('path');


console.log("KiPro Manager plugin loaded");
console.log(ppro);


// UXP scripts and API as CommonJS modules
const { createSequencesFromFolder } = require("./js/createSequencesFromFolder.js");
const { exportSequencesToAME } = require("./js/exportSequencesToAME.js");
const { extractClipsFromSequence } = require("./js/extractClipsFromSequence.js");
const { exportSequenceSelection } = require("./js/exportSequenceSelection.js");

// UXP requires a different way to handle paths and OS-specific separators
let sep = '/';
if (path && path.sep) {
  sep = path.sep;
} else if (os.platform && os.platform().startsWith('win')) {
  sep = '\\';
}
console.log(`OS platform: ${os.platform()}, separator: '${sep}'`);





// Listener for create sequences button
document.querySelector("#btnCreateSequences").addEventListener("click", async () => {
  console.log("Create Sequences button clicked");

  // Get input values from the UI
  const folderName = document.getElementById("input-bin-name").value;
  console.log(`Folder name: ${folderName}`);
  const blackFrameName = document.getElementById("input-black-frame-name").value;
  console.log(`Black frame name: ${blackFrameName}`);
  
  // Resolve payloads path
  // console.log(`Payloads path resolved to: ${payloadsPath}`);

  console.log(`Creating sequences for bin: ${folderName}`);
  try {
    await createSequencesFromFolder(sep, folderName, blackFrameName);
    console.log(`Done creating sequences for bin: ${folderName}`);
  } catch (error) {
    console.error(`Error creating sequences for bin: ${folderName}`, error);
    alert(`Failed to create sequences: ${error.message || error}`);
  }
});

// Listener for export sequences button
document.querySelector("#btnExportSequences").addEventListener("click", async () => {
  console.log("Export Sequences button clicked");

  // Get input values from the UI
  const folderName = document.getElementById("input-bin-name").value;
  console.log(`Bin name: ${folderName}`);
  const exportBasePath = document.getElementById("input-export-base-path").value;
  console.log(`Export base path: ${exportBasePath}`);

  try {
    await exportSequencesToAME(sep, folderName, exportBasePath);
    console.log(`Done exporting sequences for bin: ${folderName}`);
  } catch (error) {
    console.error(`Error exporting sequences for bin: ${folderName}`, error);
    alert(`Failed to export sequences: ${error.message || error}`);
  }
});



// Listener for extract clips button
document.querySelector("#btnExtractClips").addEventListener("click", async () => {
  console.log("Extract Clips button clicked");

  // Get input values from the UI
  const clipExtractPath = document.getElementById("input-clip-extract-path").value;
  console.log(`Clip extract path: ${clipExtractPath}`);

  try {
    await extractClipsFromSequence(sep, clipExtractPath);
    console.log(`Done sending extracted clips to MediaEncoder`);
  } catch (error) {
    console.error(`Error extracting clips from path: ${clipExtractPath}`, error);
    alert(`Failed to extract clips: ${error.message || error}`);
  }
});



// Listener for export selection button
document.querySelector("#btnExportSelection").addEventListener("click", async () => {
  console.log("Export Selection button clicked");

  // Get input values from the UI
  const exportSelectionPath = document.getElementById("input-inout-extract-path").value;
  console.log(`Export selection path: ${exportSelectionPath}`);

  try {
    await exportSequenceSelection(sep, exportSelectionPath);
    console.log(`Done exporting selection`);
  } catch (error) {
    console.error(`Error exporting selection from path: ${exportSelectionPath}`, error);
    alert(`Failed to export selection: ${error.message || error}`);
  }
});