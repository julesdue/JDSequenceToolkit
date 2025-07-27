// import modules
const { getSelectedProjectItems } = require('../src/getSelectedProjectItems.js');
const { findProjectFolderByName } = require('../src/findProjectFolderByName.js');
const { findProjectItemsByName } = require('../src/findProjectItemsByName.js');

// global objects
const ppro = require("premierepro");
const uxp = require("uxp");

async function createSequencesFromFolder(sep, folderName, blackFrameName) {
    // Log start of function
    console.log('createSequencesFromFolder called');
    console.log(`Bin name: ${folderName}, Black frame name: ${blackFrameName}`);


    // Get the current project using UXP API
    const project = await ppro.Project.getActiveProject();
    console.log('Active project: ', project);
    


    // search for the bin by name
    let folderObject;
    try {
        folderObject = await findProjectFolderByName(folderName);
        console.log('Found folder object: ', folderObject);
    } catch (err) {
        console.error(`Error finding folder "${folderName}":`, err);
        return;
    }

    // search for the black frame by name
    let blackFrameObject;
    try {
        blackFrameObject = await findProjectItemsByName(blackFrameName);
        console.log(`Found blackFrame object: ${blackFrameObject.name}`);
    } catch (err) {
        console.error(`Error finding black frame "${blackFrameName.name}":`, err);
        if (ppro.logError) {
            ppro.logError(`Error finding black frame "${blackFrameName.name}": ${err && err.message ? err.message : err}`);
        }
        return;
    }


    // get children item of my folder
    const movies = await folderObject.getItems();
    console.log(`Found ${movies.length} items in folder: ${folderName}`);

    // content type has to be media
    const mediaItems = [];
    for (const item of movies) {
        const clipItem = ppro.ClipProjectItem.cast(item);
        if (clipItem) {
            const contentType = await clipItem.getContentType();
            if (contentType === ppro.Constants.ContentType.MEDIA && contentType !== ppro.Constants.ContentType.SEQUENCE) {
                mediaItems.push(clipItem);
            }
        }
    }
    console.log(`${mediaItems.length} of them are type media`);
    mediaItems.forEach(item => {
        console.log(`Media projectItem: ${item.name}`);
    });


    // Loop to create sequences
    let createdCount = 0;
    for (let i = 0; i < mediaItems.length; i++) {
        const projItemFile = mediaItems[i];
        if (projItemFile && !projItemFile.name.endsWith('_dnx')) {
            console.log(`Processing file: ${projItemFile.name}`);

            // Get clip interpretation (frame rate)

            // CURRENT STATUS
            const interp = await projItemFile.getFootageInterpretation();
            const fps = interp.frameRate;
            console.log(`Clip: ${projItemFile.name} | FPS: ${fps}`);

            // Match preset filenames
            let fpsPreset;
            const fpsNum = parseFloat(fps);
            if (fpsNum >= 23 && fpsNum < 24) {
                fpsPreset = '23976';
            } else if (fpsNum >= 29 && fpsNum < 30) {
                fpsPreset = '2997';
            } else if (Math.abs(fpsNum - 24) < 0.1) {
                fpsPreset = '24';
            } else if (Math.abs(fpsNum - 25) < 0.1) {
                fpsPreset = '25';
            } else if (Math.abs(fpsNum - 30) < 0.1) {
                fpsPreset = '30';
            } else {
                fpsPreset = fpsNum.toString().replace(/[,\.]/g, '');
            }

            // Build preset path (use path.join in UXP)
            const { join } = require('uxp').storage.localFileSystem;
            const presetPath = `${payloadsPath}KiPro_FHD_8Ch_${fpsPreset}fps.sqpreset`;
            console.log(`Using preset: ${presetPath}`);

            // Sequence name
            const seqName = projItemFile.name.replace(/\.[^.]+$/, '_dnx');
            console.log(`Attempting to create sequence: ${seqName}`);

            // Check if sequence already exists
            const sequences = await project.getSequences();
            if (sequences.some(seq => seq.name === seqName)) {
                console.log(`Sequence already exists in project: ${seqName}, skipping.`);
                continue;
            }

            // Create the sequence with the specified preset
            const newSeq = await project.createSequence(seqName, presetPath);
            console.log(`Created sequence: ${newSeq.name} with preset: ${presetPath}`);

            // Insert the clip into the sequence
            const offset = 14; // seconds
            await newSeq.videoTracks[0].insertClip(projItemFile, offset);
            console.log(`${projItemFile.name} added to sequence: ${newSeq.name}`);

            // Add the black frame at the start if it exists
            if (projItemBlackFrame) {
                await newSeq.videoTracks[0].insertClip(projItemBlackFrame, 0);
                console.log(`Black frame added to sequence: ${newSeq.name}`);
            }

            // Move the sequence to the bin
            await newSeq.moveToBin(bin);
            console.log(`Moved sequence: ${newSeq.name} to bin: ${bin.name}`);

            createdCount++;
            console.log('Finished processing file: ' + projItemFile.name);
        }
    }
    console.log(`Created ${createdCount} sequences for files in bin: ${folderName}`);
}

module.exports = { createSequencesFromFolder };
