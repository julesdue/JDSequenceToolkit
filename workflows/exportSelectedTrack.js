// import modules
const { exportWithPreset } = require('../lib/exportWithPreset.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');

// global objects
const ppro = require("premierepro");
// const { localFileSystem, types } = require('uxp').storage;


async function exportSelectedTrack(sep, exportBasePath, videoTrackName) {
    console.log('exportSelectedTrack called');

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
    const exportArea = false; // true = working area; false = in/out points

    // get in point of sequence
    const inPoint = await activeSequence.getInPoint();
    const outPoint = await activeSequence.getOutPoint();
    console.log('Current InPoint: ', inPoint.seconds, ' sec, OutPoint: ', outPoint.seconds, ' sec');

    // Load preset path from version-aware resource handler
    const presetPath = await getPresetPath('ALPINALE_Extracts_QT_h264_medium_quality.epr');
    if (!presetPath) {
        console.error('Could not load preset path - aborting export');
        return;
    }
    console.log(`Preset path resolved to: ${presetPath}`);

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

    // get start time of each video track item
    for (const item of videoTrackItems) {
        const itemName = await item.getName();
        const startTime = await item.getStartTime();
        const endTime = await item.getEndTime();

        // return the item which has its start time before the inpoint and its end time after the inpoint
        if (startTime.seconds <= inPoint.seconds && endTime.seconds >= inPoint.seconds) {
            console.log('export name to take from item: ', itemName);


            const baseItemName = itemName.replace(/\.[^/.]+$/, "");
            const newItemName = `${baseItemName}_extracted`;
            console.log('New export name: ', newItemName);

            // set output path according to sequence name
            const outputPath = `${exportBasePath}${sep}${newItemName}.mov`;
            console.log(`Output path set to: ${outputPath}`);

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
module.exports = { exportSelectedTrack };
