// @ts-nocheck
const { findProjectFolderByName } = require('../lib/findProjectFolderByName.js');
const { findProjectItemsByName } = require('../lib/findProjectItemsByName.js');
const { findAnyProjectItemByName } = require('../lib/findAnyProjectItemByName.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');
const { executeCompoundAction } = require('../lib/executeCompoundAction.js');

const ppro = require("premierepro");

const BLACK_FRAME_DURATION = 7; // seconds
const MOGRT_DURATION = 7;       // seconds

/**
 * @param {string} sep - OS path separator
 * @param {Object} folderItem - FolderItem from the project panel selection (already cast)
 * @param {string} blackFrameName - Name of black frame project item, or "" to skip
 * @param {string} mogrtName - Name of MOGRT project item, or "" to skip
 * @returns {Promise<{created: number}>}
 */
async function createSequencesFromBin(sep, folderItem, blackFrameName, mogrtName) {
    const folderName = folderItem.name;
    console.log(`createSequencesFromBin — folder: ${folderName}, black frame: ${blackFrameName}, mogrt: ${mogrtName}`);

    const project = await ppro.Project.getActiveProject();

    // collect media items from folder
    const rawItems = await folderItem.getItems();
    const mediaItems = [];
    for (const item of rawItems) {
        const clipItem = ppro.ClipProjectItem.cast(item);
        if (clipItem && (await clipItem.getContentType()) === ppro.Constants.ContentType.MEDIA) {
            mediaItems.push(clipItem);
        }
    }
    console.log(`Found ${mediaItems.length} media items in: ${folderName}`);

    if (mediaItems.length === 0) {
        alert(`No video files found in bin "${folderName}".\nMake sure the bin contains media clips.`);
        return { created: 0 };
    }

    let createdCount = 0;
    for (const projItemFile of mediaItems) {
        if (projItemFile.name.endsWith('_dnx')) continue;
        console.log(`Processing: ${projItemFile.name}`);

        // resolve sequence preset from clip fps
        const interp = await projItemFile.getFootageInterpretation();
        const fpsNum = parseFloat(interp.getFrameRate());
        let fpsPreset;
        if (fpsNum >= 23 && fpsNum < 24)        fpsPreset = '23976';
        else if (fpsNum >= 29 && fpsNum < 30)   fpsPreset = '2997';
        else if (Math.abs(fpsNum - 24) < 0.1)   fpsPreset = '24';
        else if (Math.abs(fpsNum - 25) < 0.1)   fpsPreset = '25';
        else if (Math.abs(fpsNum - 30) < 0.1)   fpsPreset = '30';
        else                                     fpsPreset = fpsNum.toString().replace(/[,.]/g, '');

        const presetPath = await getPresetPath(`KiPro_FHD_8Ch_${fpsPreset}fps.sqpreset`);
        if (!presetPath) {
            console.error(`No preset for ${fpsPreset}fps — skipping ${projItemFile.name}`);
            continue;
        }

        const seqName = projItemFile.name.replace(/\.[^.]+$/, '_dnx');

        const existing = await project.getSequences();
        if (existing.some(s => s.name === seqName)) {
            console.log(`Already exists: ${seqName} — skipping`);
            continue;
        }

        // create sequence and re-fetch (ref goes stale immediately after creation)
        await project.createSequence(seqName, presetPath);
        const newSeq = (await project.getSequences()).find(s => s.name === seqName);
        if (!newSeq) {
            console.error(`❌ Could not re-fetch sequence: ${seqName}`);
            continue;
        }
        console.log(`Created sequence: ${seqName}`);

        // re-fetch all items — all ProjectItem refs go stale after createSequence
        let freshBlackFrame = null;
        if (blackFrameName) {
            try {
                freshBlackFrame = await findProjectItemsByName(blackFrameName);
            } catch (e) {
                console.error(`❌ Could not find black frame "${blackFrameName}":`, e);
                continue;
            }
        }

        let freshMovieFile;
        try {
            freshMovieFile = await findProjectItemsByName(projItemFile.name);
        } catch (e) {
            console.error(`❌ Could not re-fetch movie file "${projItemFile.name}":`, e);
            continue;
        }

        let freshMogrt = null;
        if (mogrtName) {
            try {
                freshMogrt = await findAnyProjectItemByName(mogrtName);
                console.log(`Re-fetched MOGRT: ${freshMogrt.name}`);
            } catch (e) {
                console.warn(`⚠️ Could not find MOGRT "${mogrtName}":`, e);
            }
        }

        // get V1 before inserts so the reference stays valid across transactions
        const v1 = await newSeq.getVideoTrack(0);

        // track how far along the timeline we are as we insert clips
        let currentOffset = 0;

        // --- insert black frame at time 0 ---
        if (blackFrameName) {
            await executeCompoundAction(project, () => {
                const editor = ppro.SequenceEditor.getEditor(newSeq);
                return editor.createInsertProjectItemAction(
                    ppro.ProjectItem.cast(freshBlackFrame),
                    ppro.TickTime.TIME_ZERO,
                    0, 0, false
                );
            }, 'Insert black frame');

            const itemsAfterBlackFrame = v1.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
            if (itemsAfterBlackFrame[0]) {
                await executeCompoundAction(project,
                    () => itemsAfterBlackFrame[0].createSetEndAction(ppro.TickTime.createWithSeconds(BLACK_FRAME_DURATION)),
                    'Set black frame duration'
                );
                console.log(`✅ Black frame inserted and trimmed to ${BLACK_FRAME_DURATION}s in: ${seqName}`);
            }
            currentOffset += BLACK_FRAME_DURATION;
        }

        // --- insert MOGRT after black frame (or at start if no black frame) ---
        if (freshMogrt) {
            const mogrtStartTime = ppro.TickTime.createWithSeconds(currentOffset);

            await executeCompoundAction(project, () => {
                const editor = ppro.SequenceEditor.getEditor(newSeq);
                // pass raw item directly — MOGRT is not a ClipProjectItem, do not cast
                return editor.createInsertProjectItemAction(
                    freshMogrt,
                    mogrtStartTime,
                    0, 0, false
                );
            }, 'Insert MOGRT');

            const itemsAfterMogrt = v1.getTrackItems(ppro.Constants.TrackItemType.CLIP, false);
            // MOGRT is always the last inserted item
            const mogrtItem = itemsAfterMogrt[itemsAfterMogrt.length - 1];
            if (mogrtItem) {
                const mogrtEnd = currentOffset + MOGRT_DURATION;
                await executeCompoundAction(project,
                    () => mogrtItem.createSetEndAction(ppro.TickTime.createWithSeconds(mogrtEnd)),
                    'Set MOGRT duration'
                );
                console.log(`✅ MOGRT inserted and trimmed to ${MOGRT_DURATION}s in: ${seqName}`);
            }
            currentOffset += MOGRT_DURATION;
        }

        // --- insert movie file after previous clips ---
        const movieStartTime = ppro.TickTime.createWithSeconds(currentOffset);

        // scale-to-frame must be committed before insert, not in the same transaction
        await executeCompoundAction(project,
            () => freshMovieFile.createSetScaleToFrameSizeAction(),
            'Scale movie to frame size'
        );

        await executeCompoundAction(project, () => {
            const editor = ppro.SequenceEditor.getEditor(newSeq);
            return editor.createInsertProjectItemAction(
                ppro.ProjectItem.cast(freshMovieFile),
                movieStartTime,
                0, 0, false
            );
        }, 'Insert movie file');
        console.log(`✅ Movie file inserted at ${BLACK_FRAME_DURATION + MOGRT_DURATION}s in: ${seqName}`);

        // move sequence to the source bin
        // getProjectItem() is async — must be awaited before the sync lockedAccess callback
        try {
            const rootItem = await project.getRootItem();
            // re-fetch sequence — newSeq goes stale after multiple transactions
            const freshSeq = (await project.getSequences()).find(s => s.name === seqName);
            if (!freshSeq) throw new Error(`Sequence not found: ${seqName}`);
            const seqProjItem = await freshSeq.getProjectItem();
            const destFolder = await findProjectFolderByName(folderName);
            const destFolderItem = ppro.FolderItem.cast(destFolder);

            if (!destFolderItem) {
                console.warn(`⚠️ Could not cast destination folder "${folderName}" to FolderItem`);
            } else {
                await executeCompoundAction(project,
                    () => rootItem.createMoveItemAction(seqProjItem, destFolderItem),
                    'Move sequence to bin'
                );
                console.log(`✅ Moved sequence to bin: ${folderName}`);
            }
        } catch (moveErr) {
            console.warn(`⚠️ Could not move sequence to bin: ${moveErr}`);
        }

        createdCount++;
    }

    console.log(`Done — created ${createdCount} sequence(s)`);
    return { created: createdCount };
}

module.exports = { createSequencesFromBin };
