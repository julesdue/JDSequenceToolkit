//global objects.
const os = require('os');
const ppro = require("premierepro");
const path = require('path');


console.log("KiPro Manager plugin loaded");
console.log(ppro);


// UXP scripts and API as CommonJS modules
const { createSequencesFromBinUXP } = require("./js/createSequencesFromBinUXP.js");
const { exportSequencesToMEUXP } = require("./js/exportSequencesToMEUXP.js");

// UXP requires a different way to handle paths and OS-specific separators
let sep = '/';
if (path && path.sep) {
  sep = path.sep;
} else if (os.platform && os.platform().startsWith('win')) {
  sep = '\\';
}
console.log(`OS platform: ${os.platform()}, separator: '${sep}'`);




// Define payloads path here (relative or absolute as needed)
const payloadsFolder = "payloads";
// resolve path with resolve(paths) from path module
// const payloadsPath = path.resolve("hallo", payloadsFolder) + sep;
// console.log(`Payloads path resolved to: ${payloadsPath}`);


// Listener for create sequences button
document.querySelector("#btnCreateSequences").addEventListener("click", async () => {
  console.log("Create Sequences button clicked");

  // Get input values from the UI
  const binName = document.getElementById("input-bin-name").value;
  console.log(`Bin name: ${binName}`);
  const blackFrameName = document.getElementById("input-black-frame-name").value;
  console.log(`Black frame name: ${blackFrameName}`);
  
  // Resolve payloads path
  // console.log(`Payloads path resolved to: ${payloadsPath}`);

  console.log(`Creating sequences for bin: ${binName}`);
  // await createSequencesFromBinUXP(binName, blackFrameName, payloadsFolder, sep);
  try {
    await createSequencesFromBinUXP(binName, blackFrameName, payloadsFolder, sep);
    console.log(`Done creating sequences for bin: ${binName}`);
  } catch (error) {
    console.error(`Error creating sequences for bin: ${binName}`, error);
    alert(`Failed to create sequences: ${error.message || error}`);
  }
});

// Listener for export sequences button
document.querySelector("#btnExportSequences").addEventListener("click", async () => {
  // Get input values from the UI
  const binName = document.getElementById("input-bin-name").value;
  const exportBasePath = document.getElementById("input-export-base-path").value;



  console.log(`OS platform: ${os.platform()}, separator: '${sep}'`);
  console.log(`Exporting sequences for bin: ${binName}`);
  await exportSequencesToMEUXP(binName, exportBasePath, payloadsPath, sep);
  console.log(`Done exporting sequences for bin: ${binName}`);
});
