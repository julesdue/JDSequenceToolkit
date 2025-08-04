// import modules
const { getSelectedProjectItems } = require('../src/getSelectedProjectItems.js');
const { findProjectFolderByName } = require('../src/findProjectFolderByName.js');
const { findProjectItemsByName } = require('../src/findProjectItemsByName.js');
const { executeCompoundAction } = require('../src/executeCompoundAction.js');


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
    
    // get project root
    const rootItem = await project.getRootItem();
    console.log('Root FolderItems: ', rootItem);

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
    const ListOfMovieFiles = await folderObject.getItems();
    console.log(`Found ${ListOfMovieFiles.length} items in folder: ${folderName}`);

    // chehck if all items are type of media
    const mediaItems = [];
    for (const item of ListOfMovieFiles) {
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


    //


    // return;

    // Loop to create sequences
    let createdCount = 0;
    for (let i = 0; i < mediaItems.length; i++) {
        const projItemFile = mediaItems[i];
        if (projItemFile && !projItemFile.name.endsWith('_dnx')) {
            console.log(`Processing file: ${projItemFile.name}`);

            
            // get footage interprator of current project item
            const FootageInterpretor = await projItemFile.getFootageInterpretation();
            const fps = FootageInterpretor.getFrameRate();
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
            // const { join } = require('uxp').storage.localFileSystem;
            const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}kipromanager${sep}payloads${sep}KiPro_FHD_8Ch_${fpsPreset}fps.sqpreset`;
            console.log(`Using preset: ${presetPath}`);


            // cleanup sequence name
            const seqName = projItemFile.name.replace(/\.[^.]+$/, '_dnx');
            console.log(`Attempting to create sequence: ${seqName}`);

            // Check if sequence already exists
            const sequences = await project.getSequences();
            if (sequences.some(seq => seq.name === seqName)) {
                console.log(`Sequence already exists in project: ${seqName}, skipping.`);
                continue;
            }

            // Create the sequence with the specified preset
            // should be createSequenceWithPresetPath() because createSequence() is deprecated, but createSequenceWithPresetPath() doesn't work
            const newSeq = await project.createSequence(seqName, presetPath);
            // const newSeq = await project.createSequenceWithPresetPath(seqName, presetPath);            
            console.log(`Created sequence: ${newSeq.name} with preset: ${presetPath}`);

            // move newly created sequence to the bin
            // get project item of the new sequence
            const NewSeqProjectItem = await newSeq.getProjectItem();
            // create action to execute
            const actionMoveNewSeq = await rootItem.createMoveItemAction(NewSeqProjectItem, folderObject);
            executeCompoundAction(project, actionMoveNewSeq);
            console.log(`Moved sequence: ${NewSeqProjectItem.name} to bin: ${folderObject.name}`);

            // get the sequence editor
            const sequenceEditor = ppro.SequenceEditor.getEditor(newSeq);
            console.log('Sequence editor acquired: ', sequenceEditor);

            // Insert the clip into the sequence
            const offset = await ppro.TickTime.createWithSeconds(7);
            const clipProjectItemFile = ppro.ClipProjectItem.cast(projItemFile); // ensure correct type
            if (!clipProjectItemFile) {
                console.error(`Failed to cast project item to ClipProjectItem: ${projItemFile.name}`);
                continue;
            }


            // start action to insert clip
            // const actionInsertClip = await sequenceEditor.createInsertProjectItemAction(projItemFile, offset, 0, 0, true);
            // executeCompoundAction(project, actionInsertClip);
            // console.log(`Inserted clip: ${projItemFile.name} at offset: ${offset} seconds`);

            // const clipProjectItem = ppro.ClipProjectItem.cast(projItemFile);
            // if (!clipProjectItem) {
            //     console.error('Not a ClipProjectItem:', projItemFile);
            //     continue;
            // }

            // Insert the clip into the sequence at the start
            await project.lockedAccess(async () => {
                await project.executeTransaction(async (compoundAction) => {
                    const actInsertProjItem = await sequenceEditor.createInsertProjectItemAction(
                        clipProjectItemFile,
                        offset, // Insert with 
                        0, // Video track index
                        0, // Audio track index
                        true // Overwrite
                    );
                    compoundAction.addAction(actInsertProjItem);
                });
            });
            console.log(`Inserted clip: ${clipProjectItemFile.name} at offset: 0 seconds`);


            // Insert the black frame into the sequence at the start
            const projItemBlackFrame = ppro.ClipProjectItem.cast(blackFrameObject);
            if (projItemBlackFrame) {
                await project.lockedAccess(async () => {
                    await project.executeTransaction(async (compoundAction) => {
                        const actInsertBlackFrame = await sequenceEditor.createInsertProjectItemAction(
                            projItemBlackFrame,
                            0, // Insert at start
                            0, // Video track index
                            0, // Audio track index
                            true // Overwrite
                        );
                        compoundAction.addAction(actInsertBlackFrame);
                    });
                });
                console.log(`Inserted black frame: ${projItemBlackFrame.name} at offset: 0 seconds`);
            } else {
                console.warn('Black frame project item could not be cast.');
            }
            
            
            // await newSeq.videoTracks[0].insertClip(projItemFile, offset);
            // console.log(`${projItemFile.name} added to sequence: ${newSeq.name}`);

            return;
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
