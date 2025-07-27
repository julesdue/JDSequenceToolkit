// import modules
const { findProjectFolderByName } = require('../src/findProjectFolderByName.js');
const { sendToMEwithPreset } = require('../src/sendToAMEwithPreset.js');

// global objects
const ppro = require("premierepro");


async function exportSequencesToAME(sep, binName, exportBasePath) {
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
    const binItem = await findProjectFolderByName(rootItem, binName);
    if (!binItem) {
        console.error(`Bin not found: ${binName}`);
        return;
    }
    console.log(`Bin found: ${binItem}`);

    // Get all sequences in the bin
    const sequences = await binItem.getItems(); // still not working

    // setup vars for export function
    const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}kipromanager${sep}payloads${sep}KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr`;
    console.log(`Preset path set to: ${presetPath}`);
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
