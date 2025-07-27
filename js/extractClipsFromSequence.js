// import modules
const { sendToMEwithPreset } = require('../src/sendToAMEwithPreset.js');

// global objects
const ppro = require("premierepro");

// Function
async function extractClipsFromSequence(sep, clipExtractPath) {
    console.log('extractClipsFromSequence called');

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

    // get ProjectItems of root
    const topProjectItems = await rootItem.getItems();
    console.log('Top level ProjectItems: ', topProjectItems);

    // Get the active sequence
    const activeSequence = await project.getActiveSequence();
    console.log('Active sequence: ', activeSequence);


    // setup vars for export function
    const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}kipromanager${sep}payloads${sep}ALPINALE_Extracts_QT_h264_medium_quality.epr`;
    console.log(`Preset path set to: ${presetPath}`);
    const outputPath = `${clipExtractPath}${sep}${activeSequence.name}.mov`;
    console.log(`Output path set to: ${outputPath}`);
    const exportArea = false; // true = working area; false = in/out points

    // get all clips in the active sequence
    const clipsAmount = await activeSequence.getVideoTrackCount();
    console.log('Number of clips in active sequence: ', clipsAmount, '. Sending all clips to Media Encoder.');

    // get VideoClipTrackItem
    // const videoClipTrackItem = await ppro.VideoClipTrackItem.createSetOutPointAction();

    // start loop for exporting each clip in the sequence
    for (let i = 0; i < clipsAmount; i++) {

        // setting inpoint for the clip to export
        // const inPoint = await activeSequence.createSetZeroPointAction();

        // NOT WORKING YET: SETTING IN AND OUT POINTS FOR EACH CLIP

        // call export function
        const exportFunction = await sendToMEwithPreset(activeSequence, outputPath, presetPath, exportArea);
        console.log('Returned value: ', exportFunction);

    }

}

module.exports = { extractClipsFromSequence };