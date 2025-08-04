// import modules
const { exportWithPreset } = require('../src/exportWithPreset.js');

// global objects
const ppro = require("premierepro");
// const { localFileSystem, types } = require('uxp').storage;


async function exportSequenceSelection(sep, exportBasePath, videoTrackName) {
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

    // setup vars for export function
    const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}kipromanager${sep}payloads${sep}ALPINALE_Extracts_QT_h264_medium_quality.epr`;
    console.log(`Preset path set to: ${presetPath}`);
    const exportArea = false; // true = working area; false = in/out points

    
    // // current playhead position
    // // not needed
    // const currentPlayheadPosition = await activeSequence.getPlayerPosition();
    // console.log('Current playhead position: ', currentPlayheadPosition);

    // current selection
    // not needed
    // const currentSelection = await activeSequence.getSelection();
    // console.log('Current selection: ', currentSelection);
    // const itemFromSelection = await currentSelection.getItems();
    // console.log('Item from selection: ', itemFromSelection);


    // get in point of sequence
    const inPoint = await activeSequence.getInPoint();
    const outPoint = await activeSequence.getOutPoint();
    console.log('Current InPoint: ', inPoint.seconds, ' sec, OutPoint: ', outPoint.seconds, ' sec');

    // get video track 
    let videoTrackNumber = 0; // default to first track if not found
    for (let i = 0; i < videoTrackCount; i++) {
        const track = await activeSequence.getVideoTrack(i);

        // match track name with var videoTrackName
        const trackName = await track.name;
        if (trackName === videoTrackName) {
            videoTrackNumber = i;
            console.log(`Found video track: ${trackName} at index ${videoTrackNumber}`);
        }
    }

    const videoTrack = await activeSequence.getVideoTrack(videoTrackNumber);
    console.log('Video track: ', videoTrack);

    const videoTrackItems = await videoTrack.getTrackItems(1, false);
    console.log('Video track items: ', videoTrackItems);

    // get video component chain
    // const videoComponentChain = await videoTrackItems[0].getComponentChain();
    // console.log('Video component chain: ', videoComponentChain);


    // get start time of each video track item
    for (const item of videoTrackItems) {
        const itemName = await item.getName();
        const startTime = await item.getStartTime();
        const endTime = await item.getEndTime();
        // console.log('Clip: ', itemName, ' Start time: ', startTime.seconds, ' sec, End time: ', endTime.seconds, ' sec');

        // return the item which has its start time before the inpoint and its end time after the inpoint
        if (startTime.seconds <= inPoint.seconds && endTime.seconds >= inPoint.seconds) {
            console.log('export name to take from item: ', itemName);


            const baseItemName = itemName.replace(/\.[^/.]+$/, "");
            const newItemName = `${baseItemName}_extracted`;
            console.log('New export name: ', newItemName);

            // set output path according to sequence name
            const outputPath = `${exportBasePath}${sep}${newItemName}.mov`;
            console.log(`Output path set to: ${outputPath}`);

            // create output folder if it does not exist
            // try {
            //     // Try to get the folder entry
            //     const folderEntry = await localFileSystem.getEntryWithUrl(exportBasePath);
            //     if (!folderEntry.isFolder) {
            //         throw new Error(`${exportBasePath} exists but is not a folder.`);
            //     }
            //     // Folder exists
            //     // return folderEntry;
            // } catch (e) {
            //     // Folder does not exist, create it
            //     const newFolderEntry = await localFileSystem.createEntryWithUrl(exportBasePath, { type: types.folder });
            //     console.log(`Created output directory: ${newFolderEntry.nativePath}`);
            //     // return newFolderEntry;
            // }

            // call export function
            const exportFunction = await exportWithPreset(activeSequence, outputPath, presetPath, exportArea);
            console.log('Returned value: ', exportFunction);
            break;
        }
        else {
            console.log('No clip found in in/out point range');
        }
    }

}
module.exports = { exportSequenceSelection };