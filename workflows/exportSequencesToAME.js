// import modules
const { findProjectFolderByName } = require('../lib/findProjectFolderByName.js');
const { sendToMEwithPreset } = require('../lib/sendToAMEwithPreset.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');

// global objects
const ppro = require("premierepro");


async function exportSequencesToAME(sep, folderName, exportBasePath) {
    // Log start of function
    console.log('exportSequencesToAME called');

    // Get the current project using UXP API
    const project = await ppro.Project.getActiveProject();
    if (!project) {
        console.error('No active project found.');
        return;
    }
    console.log('Project object acquired: ', project);

    // Get root of project
    const rootItem = await project.getRootItem();
    console.log('Root FolderItems: ', rootItem);
    
    // Find the bin by name
    const folderItem = await findProjectFolderByName(rootItem, folderName);
    if (!folderItem) {
        console.error(`Folder not found: ${folderName}`);
        return;
    }
    console.log(`Folder found: ${folderItem}`);

    // Get all sequences in the folder
    const sequences = await folderItem.getItems(); // still not working

    // Load preset path from version-aware resource handler
    const presetPath = await getPresetPath('KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr');
    if (!presetPath) {
        console.error('Could not load preset path - aborting export');
        return;
    }
    console.log(`Preset path resolved to: ${presetPath}`);
    const exportArea = true; // true = working area; false = in/out points

    // start loop for exporting each clip in the sequence
    for (let i = 0; i < sequences.length; i++) {
        const activeSequence = sequences[i];

        // set output path according to sequence name
        const outputPath = `${exportBasePath}${sep}${activeSequence.name}.mov`;
        console.log(`Output path set to: ${outputPath}`);

        // call export function
        const exportFunction = await sendToMEwithPreset(activeSequence, outputPath, presetPath, exportArea);
        console.log('Returned value: ', exportFunction);
    }
}

module.exports = { exportSequencesToAME };