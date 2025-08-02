// import modules
const { exportWithPreset } = require('../src/exportWithPreset.js');

// global objects
const ppro = require("premierepro");

async function exportSequenceSelection(sep, exportBasePath) {
    console.log('exportSequenceSelection called');

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

    // Get the active sequence
    const activeSequence = await project.getActiveSequence();
    console.log('Active sequence: ', activeSequence);

    // get all video tracks
    const videoTrackCount = await activeSequence.getVideoTrackCount();
    
    // video track number
    const videoTrackNumber = 0; // alter if needed // 0 = first track


    // setup vars for export function
    const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}kipromanager${sep}payloads${sep}ALPINALE_Extracts_QT_h264_medium_quality.epr`;
    console.log(`Preset path set to: ${presetPath}`);
    const exportArea = false; // true = working area; false = in/out points

    
    // current playhead position
    // not needed
    const currentPlayheadPosition = await activeSequence.getPlayerPosition();
    console.log('Current playhead position: ', currentPlayheadPosition);

    // current selection
    // not needed
    const currentSelection = await activeSequence.getSelection();
    console.log('Current selection: ', currentSelection);
    const itemFromSelection = await currentSelection.getItems();
    console.log('Item from selection: ', itemFromSelection);


    // get in point of sequence
    const inPoint = await activeSequence.getInPoint();
    console.log('In point: ', inPoint.seconds, ' sec');

    // get video track 
    const videoTrack = await activeSequence.getVideoTrack(videoTrackNumber);
    console.log('Video track: ', videoTrack);

    const videoTrackItems = await videoTrack.getTrackItems(1, false);
    console.log('Video track items: ', videoTrackItems);

    // get video component chain
    const videoComponentChain = await videoTrackItems[0].VideoClipTrackItem(0);
    console.log('Video component chain: ', videoComponentChain);

    const itemName = await itemFromSelection[0].getName();
    // Remove file extension and add suffix "_extracted"
    const baseName = itemName.replace(/\.[^/.]+$/, "");
    const extractedName = `${baseName}_extracted`;
    console.log('Item name: ', extractedName);
    

    // set output path according to sequence name
    const outputPath = `${exportBasePath}${sep}${extractedName}.mov`;
    console.log(`Output path set to: ${outputPath}`);

    // call export function
    const exportFunction = await exportWithPreset(activeSequence, outputPath, presetPath, exportArea);
    console.log('Returned value: ', exportFunction);
    



}
module.exports = { exportSequenceSelection };