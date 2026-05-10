//global objects.
const os = require('os');
const ppro = require("premierepro");
const path = require('path');


console.log("KiPro Manager plugin loaded");
console.log(ppro);

// === Theme Support ===
function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark", "theme-darkest");

  if (theme && theme.includes("dark")) {
    document.body.classList.add(theme === "darkest" ? "theme-darkest" : "theme-dark");
  } else {
    document.body.classList.add("theme-light");
  }

  console.log(`Theme applied: ${theme}`);
}

// Apply theme on load
if (document.theme && document.theme.getCurrent) {
  try {
    const currentTheme = document.theme.getCurrent();
    applyTheme(currentTheme);

    // Listen for theme changes
    if (document.theme.onUpdated && document.theme.onUpdated.addListener) {
      document.theme.onUpdated.addListener(applyTheme);
    }
  } catch (e) {
    console.log("Theme API not available, using default dark theme");
    document.body.classList.add("theme-dark");
  }
} else {
  console.log("Theme API not available, using default dark theme");
  document.body.classList.add("theme-dark");
}

// === Tab Navigation ===
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const infoSections = document.querySelectorAll(".info-section");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");
      const targetInfo = targetTab.replace("tab-", "info-");

      // Remove active class from all buttons, contents, and info sections
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));
      infoSections.forEach((section) => section.classList.remove("active"));

      // Add active class to clicked button, target content, and target info
      button.classList.add("active");
      document.getElementById(targetTab).classList.add("active");
      document.getElementById(targetInfo).classList.add("active");

      console.log(`Tab switched to: ${targetTab}, Info: ${targetInfo}`);
    });
  });
}

// Initialize tabs when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupTabs);
} else {
  setupTabs();
}

// === Resizable Divider ===
function setupResizableDivider() {
  const dividers = document.querySelectorAll(".tab-divider");

  dividers.forEach((divider) => {
    let isResizing = false;
    let startX = 0;
    let startLeftWidth = 0;

    divider.addEventListener("mousedown", (e) => {
      isResizing = true;
      startX = e.clientX;
      const tabContent = divider.closest(".tab-content");
      const tabLeft = tabContent.querySelector(".tab-left");
      startLeftWidth = tabLeft.offsetWidth;

      divider.classList.add("dragging");
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;

      const tabContent = divider.closest(".tab-content");
      const tabLeft = tabContent.querySelector(".tab-left");
      const tabRight = tabContent.querySelector(".tab-right");

      const delta = e.clientX - startX;
      const newLeftWidth = startLeftWidth + delta;
      const minWidth = 200;
      const maxWidth = tabContent.offsetWidth - 200;

      if (newLeftWidth > minWidth && newLeftWidth < maxWidth) {
        tabLeft.style.flex = `0 0 ${newLeftWidth}px`;
        tabRight.style.width = `${tabContent.offsetWidth - newLeftWidth - 4}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        divider.classList.remove("dragging");
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
    });
  });
}

// Initialize resizable dividers when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupResizableDivider);
} else {
  setupResizableDivider();
}

// === Checkbox Controls ===
function setupCheckboxControls() {
  const insertBlackFrameCheckbox = document.getElementById("insertBlackFrame");
  const blackFrameNameInput = document.getElementById("input-black-frame-name");

  const insertMogrtCheckbox = document.getElementById("insertMogrt");
  const mogrtNameInput = document.getElementById("input-mogrt-name");

  // Black frame checkbox
  if (insertBlackFrameCheckbox && blackFrameNameInput) {
    blackFrameNameInput.disabled = !insertBlackFrameCheckbox.checked;
    insertBlackFrameCheckbox.addEventListener("change", () => {
      blackFrameNameInput.disabled = !insertBlackFrameCheckbox.checked;
      console.log(`Black frame insertion: ${insertBlackFrameCheckbox.checked ? "enabled" : "disabled"}`);
    });
  }

  // MOGRT checkbox
  if (insertMogrtCheckbox && mogrtNameInput) {
    mogrtNameInput.disabled = !insertMogrtCheckbox.checked;
    insertMogrtCheckbox.addEventListener("change", () => {
      mogrtNameInput.disabled = !insertMogrtCheckbox.checked;
      console.log(`MOGRT insertion: ${insertMogrtCheckbox.checked ? "enabled" : "disabled"}`);
    });
  }
}

// Initialize checkbox controls when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupCheckboxControls);
} else {
  setupCheckboxControls();
}

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

  // Check if black frame insertion is enabled
  const insertBlackFrameCheckbox = document.getElementById("insertBlackFrame");
  const insertBlackFrame = insertBlackFrameCheckbox?.checked || false;
  let blackFrameName = "";
  if (insertBlackFrame) {
    blackFrameName = document.getElementById("input-black-frame-name").value;
    console.log(`Black frame name: ${blackFrameName}`);
  } else {
    console.log("Black frame insertion disabled");
  }

  // Check if MOGRT insertion is enabled
  const insertMogrtCheckbox = document.getElementById("insertMogrt");
  const insertMogrt = insertMogrtCheckbox?.checked || false;
  let mogrtName = "";
  if (insertMogrt) {
    mogrtName = document.getElementById("input-mogrt-name").value;
    console.log(`MOGRT name: ${mogrtName}`);
  } else {
    console.log("MOGRT insertion disabled");
  }

  try {
    await createSequencesFromFolder(sep, folderName, insertBlackFrame ? blackFrameName : "", insertMogrt ? mogrtName : "");
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
  }
});


// Listener for download sample CSV button
document.querySelector("#btnDownloadSampleCSV").addEventListener("click", async () => {
  console.log("Download Sample CSV button clicked");
  document.getElementById("csvStatusText").textContent = "Sample CSV download not yet implemented";
  // TODO: Implement sample CSV download
});


// Listener for insert filmslide data button
document.querySelector("#btnInsertFilmslideData").addEventListener("click", async () => {
  console.log("Insert Filmslide Data button clicked");
  const statusEl = document.getElementById("csvStatusText");
  const folderStatusEl = document.getElementById("folderStatusText");

  try {
    // Get selected folder from project panel
    const project = await ppro.Project.getActiveProject();
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const selection = await projectSelection.getItems();

    if (!selection || selection.length === 0) {
      folderStatusEl.textContent = "❌ No folder selected";
      return;
    }

    // Get the first selected item and check if it's a folder
    const selectedItem = selection[0];
    let folderItem = null;

    try {
      folderItem = ppro.FolderItem.cast(selectedItem);
    } catch (e) {
      // Not a folder, try to get its parent
      try {
        folderItem = selectedItem.getParentItem();
        if (folderItem) {
          const casted = ppro.FolderItem.cast(folderItem);
          if (!casted) folderItem = null;
        }
      } catch (err) {
        // Could not get parent or it's not a folder
      }
    }

    if (!folderItem) {
      folderStatusEl.textContent = "❌ Selected item is not a folder";
      return;
    }

    const folderName = folderItem.name;
    folderStatusEl.textContent = `📁 Using folder: "${folderName}"`;
    statusEl.textContent = "Inserting filmslide data...";

    const result = await populateFilmslides(folderItem);

    if (result.success) {
      statusEl.textContent = `✅ ${result.message}`;
      folderStatusEl.textContent = `📁 "${folderName}" - Complete`;
    } else {
      statusEl.textContent = `❌ ${result.error}`;
      folderStatusEl.textContent = `📁 "${folderName}" - Error`;
    }

    console.log("Filmslide data insertion complete");
  } catch (error) {
    console.error("Error inserting filmslide data:", error);
    statusEl.textContent = `❌ Error: ${error.message || error}`;
  }
});