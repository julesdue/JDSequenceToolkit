//global objects.
const os = require('os');
const ppro = require("premierepro");
const path = require('path');


console.log("KiPro Manager plugin loaded");
console.log(ppro);


// UXP scripts and API as CommonJS modules
const { createSequencesFromFolder } = require("./workflows/createSequencesFromFolder.js");
const { exportSequencesToAME } = require("./workflows/exportSequencesToAME.js");
const { extractClipsFromSequence } = require("./workflows/extractClipsFromSequence.js");
const { exportSequenceSelection } = require("./workflows/exportSequenceSelection.js");
const { populateFilmslides } = require("./workflows/populateFilmslides.js");
const { openUXPFileDialog } = require("./lib/openUXPFileDialog.js");
const { parseCSV } = require("./lib/parseCSV.js");
const { createMappingPopup } = require("./lib/createMappingPopup.js");
const { memoryStorage } = require("./lib/memoryStorage.js");

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
  const clipExtractPath = document.getElementById("input-clip-extract-basepath").value;
  console.log(`Clip extract path: ${clipExtractPath}`);
  const videoTrackName = document.getElementById("input-clip-extract-video-track").value;
  console.log(`Video track name: ${videoTrackName}`);

  try {
    await extractClipsFromSequence(sep, clipExtractPath, videoTrackName);
    console.log(`Done sending extracted clips to MediaEncoder`);
  } catch (error) {
    console.error(`Error extracting clips from path: ${clipExtractPath}`, error);
    alert(`Failed to extract clips: ${error.message || error}`);
  }
});



// Listener for export selection button
document.querySelector("#btnExportSequenceSelection").addEventListener("click", async () => {
  console.log("Export Selection button clicked");

  // Get input values from the UI
  const exportSelectionPath = document.getElementById("input-export-selection-basepath").value;
  console.log(`Export selection basepath: ${exportSelectionPath}`);
  const videoTrackName = document.getElementById("input-export-selection-video-track").value;
  console.log(`Video track name: ${videoTrackName}`);

  try {
    await exportSequenceSelection(sep, exportSelectionPath, videoTrackName);
    console.log(`Done exporting selection`);
  } catch (error) {
    console.error(`Error exporting selection from path: ${exportSelectionPath}`, error);
    alert(`Failed to export selection: ${error.message || error}`);
  }
});


// ===== Filmslide Data Insert Workflow =====

// Listener for load CSV button
document.querySelector("#btnLoadCSV").addEventListener("click", async () => {
  console.log("Load CSV button clicked");
  const statusEl = document.getElementById("csvStatusText");

  try {
    statusEl.textContent = "Loading CSV file...";

    // Open file dialog and read CSV
    const csvContent = await openUXPFileDialog();
    if (!csvContent) {
      statusEl.textContent = "File selection cancelled";
      return;
    }

    // Parse CSV
    const { headers, data } = parseCSV(csvContent);
    memoryStorage.setCsvData({ headers, data });

    // Show mapping popup
    statusEl.textContent = `CSV loaded: ${data.length} rows, ${headers.length} columns. Setting up mapping...`;
    console.log("Showing mapping popup");

    try {
      const mapping = await createMappingPopup(headers);
      memoryStorage.setMappingSelection(mapping);
      statusEl.textContent = `✅ CSV loaded with ${data.length} rows and mapping configured`;
      console.log("Mapping confirmed, ready for data insertion");
    } catch (err) {
      statusEl.textContent = "Mapping cancelled";
      console.log("Mapping cancelled:", err.message);
    }
  } catch (error) {
    console.error("Error loading CSV:", error);
    statusEl.textContent = `❌ Error loading CSV: ${error.message || error}`;
    alert(`Failed to load CSV: ${error.message || error}`);
  }
});


// Listener for download sample CSV button
document.querySelector("#btnDownloadSampleCSV").addEventListener("click", async () => {
  console.log("Download Sample CSV button clicked");
  alert("Sample CSV download not yet implemented");
  // TODO: Implement sample CSV download
});


// Listener for insert filmslide data button
document.querySelector("#btnInsertFilmslideData").addEventListener("click", async () => {
  console.log("Insert Filmslide Data button clicked");
  const statusEl = document.getElementById("csvStatusText");

  try {
    const folderName = document.getElementById("input-filmslide-folder").value;
    console.log(`Folder name: ${folderName}`);

    if (!folderName || folderName.trim() === "") {
      alert("Please enter a project folder name");
      return;
    }

    statusEl.textContent = "Inserting filmslide data...";

    const result = await populateFilmslides(folderName);

    if (result.success) {
      statusEl.textContent = `✅ ${result.message}`;
      alert(`Success! ${result.message}`);
    } else {
      statusEl.textContent = `❌ ${result.error}`;
      alert(`Error: ${result.error}`);
    }

    console.log("Filmslide data insertion complete");
  } catch (error) {
    console.error("Error inserting filmslide data:", error);
    statusEl.textContent = `❌ Error: ${error.message || error}`;
    alert(`Failed to insert filmslide data: ${error.message || error}`);
  }
});