// import modules
const { getSelectedProjectItems } = require('../lib/getSelectedProjectItems.js');
const { findProjectFolderByName } = require('../lib/findProjectFolderByName.js');
const { findProjectItemsByName } = require('../lib/findProjectItemsByName.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');

// global objects
const ppro = require("premierepro");
const uxp = require("uxp");

async function createSequencesFromFolder(sep, folderName, blackFrameName, mogrtName) {
    console.log('createSequencesFromFolder called');
    console.log(`Bin name: ${folderName}, Black frame name: ${blackFrameName}, MOGRT name: ${mogrtName}`);

    const project = await ppro.Project.getActiveProject();
    console.log('Active project: ', project);

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
        console.error(`Error finding black frame "${blackFrameName}":`, err);
        return;
    }

    // search for the MOGRT by name
    let mogrtObject;
    if (mogrtName) {
        try {
            mogrtObject = await findProjectItemsByName(mogrtName);
            console.log(`Found MOGRT object: ${mogrtObject.name}`);
        } catch (err) {
            console.warn(`Warning: MOGRT "${mogrtName}" not found:`, err);
            mogrtObject = null;
        }
    }

    // get children of folder
    const ListOfMovieFiles = await folderObject.getItems();
    console.log(`Found ${ListOfMovieFiles.length} items in folder: ${folderName}`);

    // filter to media items only
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

    // Loop to create sequences
    let createdCount = 0;
    for (let i = 0; i < mediaItems.length; i++) {
        const projItemFile = mediaItems[i];
        if (projItemFile && !projItemFile.name.endsWith('_dnx')) {
            console.log(`Processing file: ${projItemFile.name}`);

            // get footage interpretation
            const FootageInterpretor = await projItemFile.getFootageInterpretation();
            const fps = FootageInterpretor.getFrameRate();
            console.log(`Clip: ${projItemFile.name} | FPS: ${fps}`);

            // match preset filename
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

            // load preset path
            const presetFileName = `KiPro_FHD_8Ch_${fpsPreset}fps.sqpreset`;
            const presetPath = await getPresetPath(presetFileName);
            if (!presetPath) {
                console.error(`Could not load preset for ${fpsPreset}fps - skipping file`);
                continue;
            }
            console.log(`Using preset: ${presetPath}`);

            // build sequence name
            const seqName = projItemFile.name.replace(/\.[^.]+$/, '_dnx');
            console.log(`Attempting to create sequence: ${seqName}`);

            // check if sequence already exists
            const sequences = await project.getSequences();
            if (sequences.some(seq => seq.name === seqName)) {
                console.log(`Sequence already exists in project: ${seqName}, skipping.`);
                continue;
            }

            // create the sequence
            await project.createSequence(seqName, presetPath);
            console.log(`Created sequence: ${seqName} with preset: ${presetPath}`);

            // re-fetch sequence by name immediately (returned object goes stale)
            const allSequences = await project.getSequences();
            const newSeq = allSequences.find(seq => seq.name === seqName);
            if (!newSeq) {
                console.error(`❌ Failed to re-fetch sequence after creation: ${seqName}`);
                continue;
            }

            // move sequence to bin
            try {
                // re-fetch folder fresh (original goes stale after createSequence)
                const freshFolder = await findProjectFolderByName(folderName);
                console.log('freshFolder:', freshFolder);
                console.log('freshFolder.name:', freshFolder?.name);

                const freshFolderItem = ppro.FolderItem.cast(freshFolder);
                console.log('freshFolderItem after cast:', freshFolderItem);

                if (!freshFolderItem) {
                    console.error('❌ FolderItem cast failed — freshFolder is not a FolderItem');
                } else {
                    let moveAction;
                    await project.lockedAccess(() => {
                        const seqProjItem = newSeq.getProjectItem();
                        console.log('seqProjItem:', seqProjItem, 'type:', typeof seqProjItem);
                        console.log('freshFolderItem:', freshFolderItem, 'type:', typeof freshFolderItem);
                        moveAction = rootItem.createMoveItemAction(seqProjItem, freshFolderItem);
                    });

                    if (moveAction) {
                        await project.executeAction(moveAction);
                        console.log(`✅ Moved sequence to bin: ${folderName}`);
                    }
                }
            } catch (moveError) {
                console.warn(`⚠️ Could not move sequence to bin: ${moveError}. Sequence created but not moved.`);
            }

            // cast clip to ClipProjectItem
            const clipProjectItemFile = ppro.ClipProjectItem.cast(projItemFile);
            if (!clipProjectItemFile) {
                console.error(`❌ Failed to cast project item to ClipProjectItem: ${projItemFile.name}`);
                continue;
            }

            // insert clips into sequence
            try {
                const videoTrackCount = await newSeq.getVideoTrackCount();
                console.log(`Video track count: ${videoTrackCount}`);

                if (videoTrackCount > 0) {

                    // ✅ Pre-resolve TickTime BEFORE lockedAccess (it's sync, not async)
                    const timeZero = ppro.TickTime.createWithSeconds(0);

                    // ✅ Build actions synchronously inside lockedAccess — NO async, NO await inside
                    let builtActions = [];

                    await project.lockedAccess(() => {
                        const sequenceEditor = ppro.SequenceEditor.getEditor(newSeq);
                        const actions = [];
                        console.log('Sequence editor acquired inside locked access');
                        console.log('timeZero type:', typeof timeZero, 'value:', timeZero);

                        // Black frame
                        if (blackFrameName) {
                            const projItemBlackFrame = ppro.ClipProjectItem.cast(blackFrameObject);
                            if (projItemBlackFrame) {
                                try {
                                    console.log('Black frame - trying insertion');
                                    const act = sequenceEditor.createInsertProjectItemAction(
                                        projItemBlackFrame, timeZero
                                    );
                                    if (act) {
                                        actions.push(act);
                                        console.log(`✅ Queued black frame: ${projItemBlackFrame.name}`);
                                    }
                                } catch (e) { console.error('❌ Black frame action error:', e); }
                            } else {
                                console.warn('⚠️ Black frame cast failed');
                            }
                        }

                        // Main clip
                        try {
                            console.log('Clip - trying insertion');
                            const actClip = sequenceEditor.createInsertProjectItemAction(
                                clipProjectItemFile, timeZero
                            );
                            if (actClip) {
                                actions.push(actClip);
                                console.log(`✅ Queued clip: ${clipProjectItemFile.name}`);
                            }
                        } catch (e) { console.error('❌ Clip action error:', e); }

                        // MOGRT
                        if (mogrtObject && mogrtName) {
                            const projItemMogrt = ppro.ClipProjectItem.cast(mogrtObject);
                            if (projItemMogrt) {
                                try {
                                    console.log('MOGRT - trying insertion');
                                    const actMogrt = sequenceEditor.createInsertProjectItemAction(
                                        projItemMogrt, timeZero
                                    );
                                    if (actMogrt) {
                                        actions.push(actMogrt);
                                        console.log(`✅ Queued MOGRT: ${projItemMogrt.name}`);
                                    }
                                } catch (e) { console.error('❌ MOGRT action error:', e); }
                            } else {
                                console.warn('⚠️ MOGRT cast failed — mogrtObject is not a ClipProjectItem');
                            }
                        }

                        builtActions = actions;
                    });

                    // ✅ Execute all actions OUTSIDE lockedAccess
                    if (builtActions.length > 0) {
                        const compound = new ppro.CompoundAction("Insert clips");
                        builtActions.forEach(act => compound.addAction(act));
                        await project.executeAction(compound);
                        console.log(`✅ Executed ${builtActions.length} clip insertion(s) into: ${seqName}`);
                    } else {
                        console.warn('⚠️ No actions were built — nothing inserted into sequence');
                    }

                } else {
                    console.error(`❌ Sequence has no video tracks`);
                }
            } catch (generalError) {
                console.error(`❌ Error in clip insertion: ${generalError}`);
            }

            createdCount++;
            console.log('Finished processing file: ' + projItemFile.name);
        }
    }
    console.log(`Created ${createdCount} sequences for files in bin: ${folderName}`);
}

module.exports = { createSequencesFromFolder };

