// import modules
const { sendToMEwithPreset } = require('../lib/sendToAMEwithPreset.js');
const { executeCompoundAction } = require('../lib/executeCompoundAction.js');

// global objects
const ppro = require("premierepro");

/**
 * Export each clip on the selected video track(s) as separate AME render jobs.
 * For each clip: set sequence in/out points to clip's timeline start/end, queue to AME.
 *
 * @param {string} sep - OS path separator
 * @param {string} clipExtractPath - Output folder path
 * @param {number} videoTrackIndex - 0-based index of the video track to export from
 * @param {boolean} exportEntireStack - If true, export all video tracks; if false, only the selected track
 */
async function exportBulkExtractedClips(sep, clipExtractPath, videoTrackIndex, exportEntireStack) {
    console.log(`[1/5] exportBulkExtractedClips called — track index: ${videoTrackIndex}, output: ${clipExtractPath}`);

    // Get the current project
    const project = await ppro.Project.getActiveProject();
    if (!project) {
        console.error('[1/5] No active project found.');
        return { exported: 0, failed: 0, error: 'No active project' };
    }

    // Get the active sequence
    const activeSequence = await project.getActiveSequence();
    if (!activeSequence) {
        console.error('[1/5] No active sequence found.');
        return { exported: 0, failed: 0, error: 'No active sequence' };
    }
    console.log(`[1/5] Project and sequence acquired: "${activeSequence.name}"`);

    // Validate track index
    const videoTrackCount = await activeSequence.getVideoTrackCount();
    console.log(`[2/5] Video track count: ${videoTrackCount}`);
    if (videoTrackCount === 0 || videoTrackIndex >= videoTrackCount) {
        console.error(`[2/5] Track index ${videoTrackIndex} out of range (count: ${videoTrackCount})`);
        return { exported: 0, failed: 0, error: `Track index ${videoTrackIndex} out of range` };
    }

    // Save current mute states of all video tracks
    const originalMuteStates = [];
    for (let i = 0; i < videoTrackCount; i++) {
        const track = await activeSequence.getVideoTrack(i);
        const isMuted = await track.isMuted();
        originalMuteStates.push(isMuted);
    }
    console.log(`[2/5] Saved mute states: ${JSON.stringify(originalMuteStates)}`);

    // Set mute states based on exportEntireStack flag
    if (!exportEntireStack) {
        // Mute all tracks except the selected one
        for (let i = 0; i < videoTrackCount; i++) {
            const track = await activeSequence.getVideoTrack(i);
            await track.setMute(i !== videoTrackIndex);
        }
        console.log(`[2/5] Muted all tracks except track ${videoTrackIndex}`);
    }
    // If exportEntireStack is true, keep all tracks unmuted (original state)

    // Check if sequence has in/out points defined
    let rangeInPoint = null;
    let rangeOutPoint = null;
    try {
        const seqInPoint = await activeSequence.getInPoint();
        const seqOutPoint = await activeSequence.getOutPoint();
        const seqStart = ppro.TickTime.createWithSeconds(0);
        const seqEnd = await activeSequence.getEndTime();

        // Check if in/out points are different from sequence start/end (meaning a range is defined)
        if (seqInPoint.seconds !== seqStart.seconds || seqOutPoint.seconds !== seqEnd.seconds) {
            rangeInPoint = seqInPoint;
            rangeOutPoint = seqOutPoint;
            console.log(`[2/5] Range detected: ${rangeInPoint.seconds}s – ${rangeOutPoint.seconds}s`);
        }
    } catch (e) {
        console.warn('[2/5] Could not read sequence in/out points:', e);
    }

    // Collect all clips to process
    let allClips = [];

    if (exportEntireStack) {
        // Collect clips from all video tracks
        console.log(`[2/5] Collecting clips from all ${videoTrackCount} tracks...`);
        for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
            const track = await activeSequence.getVideoTrack(trackIdx);
            const trackItems = await track.getTrackItems(1, false);
            console.log(`[2/5] Track ${trackIdx}: ${trackItems.length} clip(s)`);
            allClips.push(...trackItems);
        }
    } else {
        // Collect clips from the selected track only
        const videoTrack = await activeSequence.getVideoTrack(videoTrackIndex);
        allClips = await videoTrack.getTrackItems(1, false);
        console.log(`[2/5] Collecting clips from track ${videoTrackIndex}: ${allClips.length} clip(s)`);
    }

    // Filter clips based on in/out range if one is defined
    if (rangeInPoint !== null && rangeOutPoint !== null) {
        const filteredClips = [];
        for (const clip of allClips) {
            const clipStart = await clip.getStartTime();
            const clipEnd = await clip.getEndTime();

            // Include clip if it overlaps with the defined range
            if (clipEnd.seconds > rangeInPoint.seconds && clipStart.seconds < rangeOutPoint.seconds) {
                filteredClips.push(clip);
            }
        }
        console.log(`[2/5] Filtered to ${filteredClips.length} clip(s) within range`);
        allClips = filteredClips;
    }

    if (allClips.length === 0) {
        console.warn('[2/5] No clips found.');
        return { exported: 0, failed: 0, error: 'No clips found' };
    }

    // Preset path — adjust version folder if needed
    const presetPath = `D:${sep}JuliansDev${sep}AdobePremierePro${sep}jdsequencetoolkit${sep}payloads${sep}v26${sep}ALPINALE_Extracts_QT_h264_medium_quality.epr`;
    console.log(`[3/5] Preset path: ${presetPath}`);

    // exportArea = false → AME uses sequence in/out points (not work area)
    const exportArea = false;

    let exported = 0;
    let failed = 0;

    // Loop through each clip, set sequence in/out, queue to AME
    for (let i = 0; i < allClips.length; i++) {
        const item = allClips[i];

        // getStartTime/getEndTime are sequence-timeline positions (what we want for in/out markers)
        let startTime = await item.getStartTime();
        let endTime = await item.getEndTime();
        const clipName = await item.getName();

        // For clips at range boundaries, use the range in/out instead of clip start/end
        if (rangeInPoint !== null && i === 0) {
            // First clip: use range in-point as start
            startTime = rangeInPoint;
            console.log(`[4/5] Clip ${i + 1}/${allClips.length}: "${clipName}" — adjusted start (range): ${startTime.seconds}s, end: ${endTime.seconds}s`);
        } else if (rangeOutPoint !== null && i === allClips.length - 1) {
            // Last clip: use range out-point as end
            endTime = rangeOutPoint;
            console.log(`[4/5] Clip ${i + 1}/${allClips.length}: "${clipName}" — start: ${startTime.seconds}s, adjusted end (range): ${endTime.seconds}s`);
        } else {
            console.log(`[4/5] Clip ${i + 1}/${allClips.length}: "${clipName}" — start: ${startTime.seconds}s, end: ${endTime.seconds}s`);
        }

        // Set sequence in/out markers to this clip's timeline range.
        // Use sync lockedAccess callback (not async) to ensure transaction commits before returning.
        try {
            await executeCompoundAction(project, () => [
                activeSequence.createSetInPointAction(startTime),
                activeSequence.createSetOutPointAction(endTime),
            ], 'Set clip in/out');
            console.log(`[4/5] Clip ${i + 1}: sequence in/out set to ${startTime.seconds}s – ${endTime.seconds}s`);
        } catch (e) {
            console.error(`[4/5] Clip ${i + 1}: failed to set in/out points —`, e);
            failed++;
            continue;
        }

        // Build output path using the clip name (sanitise slashes/colons from clip names)
        const safeName = clipName.replace(/[\\/:*?"<>|]/g, '_');
        const outputPath = `${clipExtractPath}${sep}${safeName}.mov`;

        // Wait for Premiere to fully flush the committed in/out state before AME reads it.
        // First clip has no preceding iteration to warm things up, so needs the full delay.
        const delay = i === 0 ? 1000 : 500;
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`[5/5] Clip ${i + 1}: queuing to AME → ${outputPath}`);

        const success = await sendToMEwithPreset(activeSequence, outputPath, presetPath, exportArea);
        if (success) {
            console.log(`[5/5] Clip ${i + 1}: queued successfully`);
            exported++;
        } else {
            console.error(`[5/5] Clip ${i + 1}: failed to queue`);
            failed++;
        }

        // On the last clip, reset sequence in/out markers to full duration
        if (i === allClips.length - 1) {
            try {
                const zeroPoint = ppro.TickTime.createWithSeconds(0);
                const seqEnd = await activeSequence.getEndTime();
                await executeCompoundAction(project, () => [
                    activeSequence.createSetInPointAction(zeroPoint),
                    activeSequence.createSetOutPointAction(seqEnd),
                ], 'Reset sequence in/out');
                console.log('[5/5] Sequence in/out markers reset to full duration.');
            } catch (e) {
                console.warn('[5/5] Could not reset sequence in/out markers:', e);
            }

            try {
                const zeroPoint = ppro.TickTime.createWithSeconds(0);
                await executeCompoundAction(project, () => [
                    activeSequence.createSetInPointAction(zeroPoint),
                    activeSequence.createSetOutPointAction(zeroPoint),
                ], 'Clear selection range');
                console.log('[5/5] Selection range cleared (in/out both set to 0).');
            } catch (e) {
                console.warn('[5/5] Could not clear selection range:', e);
            }

            try {
                await activeSequence.clearSelection();
                console.log('[5/5] Sequence selection cleared.');
            } catch (e) {
                console.warn('[5/5] Could not clear sequence selection:', e);
            }
        }
    }

    // Restore original mute states
    try {
        for (let i = 0; i < videoTrackCount; i++) {
            const track = await activeSequence.getVideoTrack(i);
            await track.setMute(originalMuteStates[i]);
        }
        console.log('[5/5] Restored original mute states.');
    } catch (e) {
        console.warn('[5/5] Could not restore mute states:', e);
    }

    console.log(`[5/5] Done — queued: ${exported}, failed: ${failed}`);
    return { exported, failed };
}



module.exports = { exportBulkExtractedClips };
