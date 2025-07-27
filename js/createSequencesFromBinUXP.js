// import modules
const { getSelectedProjectItems } = require('../src/getSelectedProjectItems.js');
const { findProjectFolderByName } = require('../src/findProjectFolderByName.js');
const { getClipProjectItems } = require('../src/getClipProjectItems.js');

// global objects
const app = require("premierepro");
const ppro = require("premierepro");
const uxp = require("uxp");

async function createSequencesFromBinUXP(binName, blackFrameName, payloadsPath, sep) {
    // Log start of function
    console.log('createSequencesFromBinUXP called');
    console.log(`Bin name: ${binName}, Black frame name: ${blackFrameName}`);



    // Get the current project using UXP API
    const project = await app.Project.getActiveProject();
    if (!project) {
        console.error('No active project found.');
        return;
    }
    console.log('Project object acquired: ', project);
    








    const sequence = await project.getActiveSequence();
    console.log('Active sequence: ', sequence);

    const rootItem = await project.getRootItem();
    console.log('Root item (should be of type FolderItem): ', rootItem);

    const rootChildren = await rootItem.getItems();
    console.log('rootChildren [projectItem]: ', rootChildren); // Array of FolderItem or ProjectItem objects


    // Find the black frame project item by name among bin's children
    let projItemBlackFrame = null;
    for (let i = 0; i < rootChildren.length; i++) {
        const child = rootChildren[i];
        if (child.name === blackFrameName) {
            projItemBlackFrame = child;
            break;
        }
    }
    if (!projItemBlackFrame) {
        console.error(`ERROR: Black frame item not found in bin: ${blackFrameName}`);
        return;
    }
    console.log('Black frame object: ', projItemBlackFrame);



    const rootChildrenFolder = await rootItem.getItems();
    console.log('rootChildrenFolder: ', rootChildrenFolder); // Array of FolderItem or ProjectItem objects
    // for (let i = 0; i < rootChildrenFolder.length; i++) {
    //     const castedItem = rootChildrenFolder[i].cast(FolderItem);
    //     console.log(`FolderItem ${i}: ${castedItem.name}`);
    // }

    // You need to provide a 'project' object here
    const folder = await findProjectFolderByName("test");
    console.log('DEBUG: found folder: ', folder);

    // call this function getClipProjectItem
    const selectedProjectItems = await getSelectedProjectItems();
    console.log('DEBUG: first selected projectitem: ', selectedProjectItems[0]);

    // const fold = selectedProjectItems[0].cast(FolderItem);
    // fold.

    const rootChildren2 = await rootItem.getRootItem();
    console.log('DEBUG: rootChildren of rootChi ldren: ', rootChildren2);

    // loop through root children to find the bin (match by name only, since type is not present)
    let bin = null;
    for (let i = 0; i < rootChildren.length; i++) {
        const child = rootChildren[i];
        if (child.name === binName) {
            bin = child;
            break;
        }
    }
    if (!bin) {
        console.error(`ERROR: Bin not found: ${binName}`);
        return;
    }
    console.log('Bin object: ', bin);









    const movieFiles = await bin.getItems();
    console.log(`Found ${movieFiles.length} items in bin: ${binName}`);

    // Loop to create sequences
    let createdCount = 0;
    for (let i = 0; i < movieFiles.length; i++) {
        const projItemFile = movieFiles[i];
        if (projItemFile && !projItemFile.name.endsWith('_dnx')) {
            console.log(`Processing file: ${projItemFile.name}`);

            // Get clip interpretation (frame rate)
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
    console.log(`Created ${createdCount} sequences for files in bin: ${binName}`);
}

module.exports = { createSequencesFromBinUXP };
