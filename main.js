//global objects.
const os = require('os');
const ppro = require("premierepro");
const path = require('path');
const { getEnvironmentInfo } = require("./lib/getVersionAwareResources.js");


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
      document.getElementById(targetInfo)?.classList.add("active");

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
      const maxWidth = tabContent.offsetWidth - /** @type {HTMLElement} */ (divider).offsetWidth - 200;

      if (newLeftWidth > minWidth && newLeftWidth < maxWidth) {
        tabLeft.style.flex = `0 0 ${newLeftWidth}px`;
        tabRight.style.flex = "1";
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

// === Footer Version Info ===
function populateFooterVersionInfo() {
  const el = document.getElementById("footer-version-info");
  if (!el) return;
  try {
    const info = /** @type {{premiereVersion: string, uxpVersion: string}} */ (getEnvironmentInfo());
    el.textContent = `PPro ${info.premiereVersion} · UXP ${info.uxpVersion}`;
  } catch (e) {
    el.textContent = "PPro — · UXP —";
    console.warn("Could not populate footer version info:", e instanceof Error ? e.message : String(e));
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", populateFooterVersionInfo);
} else {
  populateFooterVersionInfo();
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
const { createSequencesFromBin } = require("./workflows/createSequencesFromBin.js");
const { exportSequencesFromBin } = require("./workflows/exportSequencesFromBin.js");
const { exportBulkExtractedClips } = require("./workflows/exportBulkExtractedClips.js");
const { exportSelectedTrack } = require("./workflows/exportSelectedTrack.js");
const { populateFilmslides } = require("./workflows/populateFilmslides.js");
const { openUXPFileDialog } = require("./lib/openUXPFileDialog.js");
const uxp = require('uxp');
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





// === Video Track Dropdown ===
async function populateVideoTrackDropdown(/** @type {string} */ selectId) {
  const select = /** @type {HTMLSelectElement} */ (document.getElementById(selectId));
  if (!select) return;

  try {
    const project = await ppro.Project.getActiveProject();
    if (!project) { select.innerHTML = '<option value="">No active project</option>'; return; }

    const sequence = await project.getActiveSequence();
    if (!sequence) { select.innerHTML = '<option value="">No active sequence</option>'; return; }

    const count = await sequence.getVideoTrackCount();
    select.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const track = await sequence.getVideoTrack(i);
      // Track name is not always available via API — fall back to "Video N" label
      const name = (track && track.name) ? track.name : `Video ${i + 1}`;
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = name;
      select.appendChild(option);
    }

    if (count === 0) {
      select.innerHTML = '<option value="">No video tracks found</option>';
    } else {
      // Auto-select the first track
      select.value = '0';
      console.log(`Populated video track dropdown "${selectId}" with ${count} track(s) — first track selected`);
    }
  } catch (e) {
    select.innerHTML = '<option value="">Error loading tracks</option>';
    console.error('populateVideoTrackDropdown error:', e);
  }
}

// === Button Listeners ===
function setupButtonListeners() {

// Listener for create sequences button
document.querySelector("#btnCreateSequences").addEventListener("click", async () => {
  console.log("Create Sequences button clicked");
  const statusEl = document.getElementById("sequenceStatusText");

  // Resolve selected bin from project panel
  let folderItem = null;
  try {
    const project = await ppro.Project.getActiveProject();
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const selection = await projectSelection.getItems();

    if (!selection || selection.length === 0) {
      statusEl.textContent = "❌ No bin selected — select a bin in the project panel first";
      alert("No bin selected.\nPlease select a bin in the project panel first.");
      return;
    }

    const selectedItem = selection[0];
    folderItem = ppro.FolderItem.cast(selectedItem);
    if (!folderItem) {
      statusEl.textContent = "❌ Selected item is not a bin";
      alert("Selected item is not a bin.\nPlease select a bin (folder) in the project panel.");
      return;
    }
  } catch (e) {
    statusEl.textContent = "❌ No bin in project panel selected";
    alert(`No bin in project panel selected:\n${e.message || e}`);
    return;
  }

  console.log(`Selected bin: ${folderItem.name}`);
  statusEl.textContent = `Processing bin "${folderItem.name}"...`;

  // Check if black frame insertion is enabled
  const insertBlackFrameCheckbox = document.getElementById("insertBlackFrame");
  const insertBlackFrame = insertBlackFrameCheckbox?.checked || false;
  let blackFrameName = "";
  if (insertBlackFrame) {
    blackFrameName = document.getElementById("input-black-frame-name").value;
    console.log(`Black frame name: ${blackFrameName}`);
  }

  // Check if MOGRT insertion is enabled
  const insertMogrtCheckbox = document.getElementById("insertMogrt");
  const insertMogrt = insertMogrtCheckbox?.checked || false;
  let mogrtName = "";
  if (insertMogrt) {
    mogrtName = document.getElementById("input-mogrt-name").value;
    console.log(`MOGRT name: ${mogrtName}`);
  }

  try {
    const result = await createSequencesFromBin(sep, folderItem, insertBlackFrame ? blackFrameName : "", insertMogrt ? mogrtName : "");
    console.log(`Done creating sequences for bin: ${folderItem.name}`);
    if (result?.created === 0) {
      statusEl.textContent = `❌ No video files found in "${folderItem.name}"`;
    } else {
      statusEl.textContent = `✅ Done — ${result?.created} sequence(s) created in "${folderItem.name}"`;
    }
  } catch (error) {
    console.error(`Error creating sequences for bin: ${folderItem.name}`, error);
    statusEl.textContent = `❌ Error: ${error.message || error}`;
    alert(`Failed to create sequences: ${error.message || error}`);
  }
});

// Listener for browse export path button
document.querySelector("#btnBrowseExportPath").addEventListener("click", async () => {
  console.log("Browse Export Path button clicked");
  // @ts-ignore — localFileSystem exists in UXP runtime but is missing from type defs
  const folder = await uxp.storage.localFileSystem.getFolder();
  if (folder && folder.nativePath) {
    /** @type {HTMLInputElement} */ (document.getElementById("input-export-base-path")).value = folder.nativePath;
    console.log(`Export path set to: ${folder.nativePath}`);
  }
});

// Populate video track dropdown when the clip extractor tab becomes active
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.getAttribute("data-tab") === "tab-clip-extractor") {
      populateVideoTrackDropdown("select-clip-extract-video-track");
    }
  });
});

// Checkbox to toggle between entire stack and single track
const exportEntireStackCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("exportEntireStack"));
const trackSelect = /** @type {HTMLSelectElement} */ (document.getElementById("select-clip-extract-video-track"));
if (exportEntireStackCheckbox && trackSelect) {
  trackSelect.disabled = exportEntireStackCheckbox.checked;
  exportEntireStackCheckbox.addEventListener("change", () => {
    trackSelect.disabled = exportEntireStackCheckbox.checked;
    console.log(`Export entire stack: ${exportEntireStackCheckbox.checked ? "enabled" : "disabled"}`);
  });
}

// Refresh button for video track dropdown
document.querySelector("#btnRefreshClipExtractTracks")?.addEventListener("click", () => {
  populateVideoTrackDropdown("select-clip-extract-video-track");
});

// Listener for browse clip extract path button
document.querySelector("#btnBrowseClipExtractPath")?.addEventListener("click", async () => {
  console.log("Browse Clip Extract Path button clicked");
  // @ts-ignore — localFileSystem exists in UXP runtime but is missing from type defs
  const folder = await uxp.storage.localFileSystem.getFolder();
  if (folder && folder.nativePath) {
    /** @type {HTMLInputElement} */ (document.getElementById("input-clip-extract-basepath")).value = folder.nativePath;
    console.log(`Clip extract path set to: ${folder.nativePath}`);
  }
});

// Listener for browse export selection path button
document.querySelector("#btnBrowseExportSelectionPath")?.addEventListener("click", async () => {
  console.log("Browse Export Selection Path button clicked");
  // @ts-ignore — localFileSystem exists in UXP runtime but is missing from type defs
  const folder = await uxp.storage.localFileSystem.getFolder();
  if (folder && folder.nativePath) {
    /** @type {HTMLInputElement} */ (document.getElementById("input-export-selection-basepath")).value = folder.nativePath;
    console.log(`Export selection path set to: ${folder.nativePath}`);
  }
});

// Listener for export sequences button
document.querySelector("#btnExportSequences").addEventListener("click", async () => {
  console.log("Export Sequences button clicked");
  const statusEl = document.getElementById("exportStatusText");

  // Resolve selected bin from project panel
  let folderItem = null;
  try {
    const project = await ppro.Project.getActiveProject();
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const selection = await projectSelection.getItems();

    if (!selection || selection.length === 0) {
      statusEl.textContent = "❌ No bin selected — select a bin in the project panel first";
      alert("No bin selected.\nPlease select a bin in the project panel first.");
      return;
    }

    const selectedItem = selection[0];
    folderItem = ppro.FolderItem.cast(selectedItem);
    if (!folderItem) {
      statusEl.textContent = "❌ Selected item is not a bin";
      alert("Selected item is not a bin.\nPlease select a bin (folder) in the project panel.");
      return;
    }
  } catch (e) {
    statusEl.textContent = "❌ No bin in project panel selected";
    alert(`No bin in project panel selected:\n${e.message || e}`);
    return;
  }

  const exportBasePath = document.getElementById("input-export-base-path").value;
  console.log(`Export base path: ${exportBasePath}`);
  statusEl.textContent = `Exporting sequences from "${folderItem.name}"...`;

  try {
    const result = await exportSequencesFromBin(sep, folderItem, exportBasePath);
    console.log(`Done — queued ${result.exported}, failed ${result.failed} for bin: ${folderItem.name}`);
    if (result.exported === 0 && result.failed === 0) {
      statusEl.textContent = `⚠️ No sequences found in "${folderItem.name}"`;
    } else if (result.failed > 0 && result.exported === 0) {
      statusEl.textContent = `❌ Failed to queue sequences — is Adobe Media Encoder open?`;
    } else if (result.failed > 0) {
      statusEl.textContent = `⚠️ Queued ${result.exported} to AME, ${result.failed} failed`;
    } else {
      statusEl.textContent = `✅ Queued ${result.exported} sequence(s) to Adobe Media Encoder`;
    }
  } catch (error) {
    console.error(`Error exporting sequences for bin: ${folderItem.name}`, error);
    statusEl.textContent = `❌ Error: ${error.message || error}`;
    alert(`Failed to export sequences: ${error.message || error}`);
  }
});



// Listener for extract clips button
document.querySelector("#btnExtractClips").addEventListener("click", async () => {
  console.log("Extract Clips button clicked");
  const statusEl = document.getElementById("extractClipsStatusText");

  // Get input values from the UI
  const clipExtractPath = /** @type {HTMLInputElement} */ (document.getElementById("input-clip-extract-basepath")).value;
  console.log(`Clip extract path: ${clipExtractPath}`);
  const exportEntireStackCheckbox = /** @type {HTMLInputElement} */ (document.getElementById("exportEntireStack"));
  const exportEntireStack = exportEntireStackCheckbox?.checked || false;
  const trackSelect = /** @type {HTMLSelectElement} */ (document.getElementById("select-clip-extract-video-track"));
  const videoTrackIndex = trackSelect ? parseInt(trackSelect.value, 10) || 0 : 0;
  console.log(`Export entire stack: ${exportEntireStack}, Video track index: ${videoTrackIndex}`);

  if (statusEl) statusEl.textContent = "Extracting clips...";

  try {
    await exportBulkExtractedClips(sep, clipExtractPath, videoTrackIndex, exportEntireStack);
    console.log(`Done sending extracted clips to MediaEncoder`);
    if (statusEl) statusEl.textContent = `✅ Done — clips sent to Media Encoder`;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error extracting clips from path: ${clipExtractPath}`, error);
    if (statusEl) statusEl.textContent = `❌ Error: ${msg}`;
    alert(`Failed to extract clips: ${msg}`);
  }
});



// Listener for export selection button
document.querySelector("#btnExportSequenceSelection").addEventListener("click", async () => {
  console.log("Export Selection button clicked");
  const statusEl = document.getElementById("exportSelectionStatusText");

  // Get input values from the UI
  const exportSelectionPath = document.getElementById("input-export-selection-basepath").value;
  console.log(`Export selection basepath: ${exportSelectionPath}`);
  const videoTrackName = document.getElementById("input-export-selection-video-track").value;
  console.log(`Video track name: ${videoTrackName}`);

  if (statusEl) statusEl.textContent = "Exporting selection...";

  try {
    await exportSelectedTrack(sep, exportSelectionPath, videoTrackName);
    console.log(`Done exporting selection`);
    if (statusEl) statusEl.textContent = `✅ Done — selection exported`;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error exporting selection from path: ${exportSelectionPath}`, error);
    if (statusEl) statusEl.textContent = `❌ Error: ${msg}`;
    alert(`Failed to export selection: ${msg}`);
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
    console.log("Resolving selected folder from project panel...");
    const project = await ppro.Project.getActiveProject();
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const selection = await projectSelection.getItems();

    if (!selection || selection.length === 0) {
      console.log("No folder selected in project panel");
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
      console.log("Selected item is not a folder");
      folderStatusEl.textContent = "❌ Selected item is not a folder";
      return;
    }

    const folderName = folderItem.name;
    console.log(`Selected folder: "${folderName}"`);
    folderStatusEl.textContent = `📁 Using folder: "${folderName}"`;
    statusEl.textContent = "Inserting filmslide data...";

    console.log("Starting populateFilmslides workflow...");
    const result = await populateFilmslides(folderItem);

    if (result.success) {
      console.log(`✅ Filmslide data insertion successful: ${result.message}`);
      statusEl.textContent = `✅ ${result.message}`;
      folderStatusEl.textContent = `📁 "${folderName}" - Complete`;
    } else {
      console.log(`❌ Filmslide data insertion failed: ${result.error}`);
      statusEl.textContent = `❌ ${result.error}`;
      folderStatusEl.textContent = `📁 "${folderName}" - Error`;
    }

    console.log("Filmslide data insertion workflow complete");
  } catch (error) {
    console.error("Error inserting filmslide data:", error);
    statusEl.textContent = `❌ Error: ${error.message || error}`;
    console.log(`Error details: ${error instanceof Error ? error.stack : String(error)}`);
  }
});

} // end setupButtonListeners

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setupButtonListeners();
    // Auto-populate video track dropdown on plugin load
    populateVideoTrackDropdown("select-clip-extract-video-track");
  });
} else {
  setupButtonListeners();
  // Auto-populate video track dropdown on plugin load
  populateVideoTrackDropdown("select-clip-extract-video-track");
}