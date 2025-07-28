// import modules
const { sendToMEwithPreset } = require('../src/sendToAMEwithPreset.js');
const { executeCompoundAction } = require('../src/executeCompoundAction.js');

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

    // get all video tracks
    const videoTrackCount = await activeSequence.getVideoTrackCount();
    
    // video track number
    const videoTrackNumber = 0; // alter if needed // 0 = first track
    



    // get VideoClipTrackItem
    if (videoTrackCount > 0) {
        const videoTrack = await activeSequence.getVideoTrack(videoTrackNumber);
        const VideoClipTrackItems = await videoTrack.getTrackItems(1, false);
        // console.log('[DEBUG] VideoClipTrackItems: ', VideoClipTrackItems);
        
        // Loop through each VideoClipTrackItem and log details
        for (let i = 0; i < VideoClipTrackItems.length; i++) {
            const item = VideoClipTrackItems[i];
            
            // get clip details
            const name = await item.getName();
            const inPoint = await item.getInPoint();
            const duration = await item.getDuration();
            const outPoint = await item.getOutPoint();
            console.log(`Clip ${i}: name=${name}, inPoint=${inPoint.seconds}sec, duration=${duration.seconds}sec, outPoint=${outPoint.seconds}sec`);

            // setting in and out porint is not supported yet
            // sequence.createSetInPointAction(tickTime: TickTime): Action
            // sequence.createSetOutPointAction(tickTime: TickTime): Action
            
            // const currentSequence = await item.getProjectItem();
            // console.log(`Current sequence: ${currentSequence.name}`);
            // const a = await ppro.TickTime.createWithSeconds(300); // or fromTicks, etc.
            // const b = await ppro.TickTime.createWithSeconds(600); // or fromTicks, etc.
            // const actionStartTime = await item.createSetInPointAction(a);
            // const actionEndTime = await item.createSetOutPointAction(b);
            // // console.log('[DEBUG] action: ', actionStartTime);
            // executeCompoundAction(project, actionStartTime);
            // executeCompoundAction(project, actionEndTime);
            // console.log(`[DEBUG] done setting in and out points`);

            // set in and out points for the clip
            // const actionSetInPoint = await item.createSetInPointAction(inPoint);
            
            // const actionSetOutPoint = await item.createSetOutPointAction(outPoint);
            // console.log('action: ', actionSetOutPoint);
            // console.log(`Setting in and out points for clip: ${name}`);
            // executeCompoundAction(project, actionSetZeroPoint);
            // executeCompoundAction(project, actionSetOutPoint);
            // console.log(`Set in and out points for clip: ${name}`);
            break;
        }


    } else {
        console.warn('No video tracks found in active sequence.');
    }

    // get VideoClipTrackItem
    try {
        // const videoTrackIndex = await activeSequence.getVideoTrack(0);
        // console.log('[DEBUG] VideoClipTrackItem created: ', videoTrackIndex);
        // console.log('[DEBUG] VideoClipTrackItem index: ', videoTrackIndex.name);
        // const inPoint = "2";
        // const outPoint = xxx;
        // executeCompoundAction(videoTrackIndex[0], inPoint);
    } catch (e) {
        console.error('Error getting VideoClipTrackItem: ', e);
        return;
    }

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