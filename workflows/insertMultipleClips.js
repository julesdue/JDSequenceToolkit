// @ts-nocheck
const { executeCompoundAction } = require('../lib/executeCompoundAction.js');

const ppro = require("premierepro");

/**
 * Inserts every movie clip from the selected bin into the active sequence, one after another,
 * starting at the current playhead (CTI) position.
 * For each clip: the in point is placed at a percentage of the clip's total duration, and the
 * out point is set exactly `clipLengthSeconds` later. The trimmed clip is then inserted at the
 * end of the previously inserted clips on video track 0 / audio track 0.
 *
 * @param {Object} folderItem - FolderItem from the project panel selection (already cast)
 * @param {number} clipLengthSeconds - Duration (in seconds) to use for every inserted clip
 * @param {number} startPercent - Percentage (0-100) of each clip's duration to use as the in point
 * @returns {Promise<{inserted: number, skipped: number}>}
 */
async function insertMultipleClips(folderItem, clipLengthSeconds, startPercent) {
    const folderName = folderItem.name;
    console.log(`insertMultipleClips — folder: ${folderName}, clip length: ${clipLengthSeconds}s, start: ${startPercent}%`);

    const project = await ppro.Project.getActiveProject();

    const activeSequence = await project.getActiveSequence();
    if (!activeSequence) {
        alert('No active sequence.\nPlease open a sequence in the timeline first.');
        return { inserted: 0, skipped: 0 };
    }

    // collect media items from folder
    // NOTE: FolderItem.getItems() order is API-defined, not guaranteed to match the
    // Project panel's visible sort — so we explicitly sort by name (natural order) to
    // match Premiere's default Name-sorted bin view.
    const rawItems = await folderItem.getItems();
    const mediaItems = [];
    for (const item of rawItems) {
        const clipItem = ppro.ClipProjectItem.cast(item);
        if (clipItem && (await clipItem.getContentType()) === ppro.Constants.ContentType.MEDIA) {
            mediaItems.push(clipItem);
        }
    }
    mediaItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    console.log(`Found ${mediaItems.length} media items in: ${folderName}`);

    if (mediaItems.length === 0) {
        alert(`No video files found in bin "${folderName}".\nMake sure the bin contains media clips.`);
        return { inserted: 0, skipped: 0 };
    }

    // start inserting at the playhead (CTI) position in the active sequence
    const playerPosition = await activeSequence.getPlayerPosition();
    let currentOffset = playerPosition.seconds;

    let insertedCount = 0;
    let skippedCount = 0;

    for (const clipItem of mediaItems) {
        console.log(`Processing: ${clipItem.name}`);

        // total duration of the source media (full, untrimmed length)
        // NOTE: despite the type defs, Media.duration resolves as a Promise<TickTime> at runtime
        const media = await clipItem.getMedia();
        const mediaDurationTick = await media.duration;
        const mediaDuration = mediaDurationTick ? mediaDurationTick.seconds : NaN;

        if (!(mediaDuration > 0)) {
            console.warn(`⚠️ Skipping "${clipItem.name}" — invalid media duration`);
            skippedCount++;
            continue;
        }

        let clipInSeconds = mediaDuration * (startPercent / 100);
        let clipOutSeconds = clipInSeconds + clipLengthSeconds;

        // clamp to the available media range, keeping the requested clip length
        if (clipOutSeconds > mediaDuration) {
            clipOutSeconds = mediaDuration;
            clipInSeconds = clipOutSeconds - clipLengthSeconds;
        }
        if (clipInSeconds < 0) {
            clipInSeconds = 0;
        }

        if (clipOutSeconds - clipInSeconds <= 0) {
            console.warn(`⚠️ Skipping "${clipItem.name}" — not enough media for a ${clipLengthSeconds}s clip`);
            skippedCount++;
            continue;
        }

        const clipInPoint = ppro.TickTime.createWithSeconds(clipInSeconds);
        const clipOutPoint = ppro.TickTime.createWithSeconds(clipOutSeconds);

        // set the source clip's in/out points before inserting it
        await executeCompoundAction(project,
            () => clipItem.createSetInOutPointsAction(clipInPoint, clipOutPoint),
            'Set clip in/out'
        );

        const insertTime = ppro.TickTime.createWithSeconds(currentOffset);
        await executeCompoundAction(project, () => {
            const editor = ppro.SequenceEditor.getEditor(activeSequence);
            return editor.createInsertProjectItemAction(
                ppro.ProjectItem.cast(clipItem),
                insertTime,
                0, 0, false
            );
        }, 'Insert clip');

        console.log(`✅ Inserted "${clipItem.name}" at ${currentOffset}s (source ${clipInSeconds.toFixed(2)}s–${clipOutSeconds.toFixed(2)}s)`);
        currentOffset += (clipOutSeconds - clipInSeconds);
        insertedCount++;
    }

    console.log(`Done — inserted ${insertedCount} clip(s), skipped ${skippedCount}`);
    return { inserted: insertedCount, skipped: skippedCount };
}

module.exports = { insertMultipleClips };
