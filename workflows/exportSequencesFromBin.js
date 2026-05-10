const { sendToMEwithPreset } = require('../lib/sendToAMEwithPreset.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');
const { ensureOutputPathExists } = require('../lib/ensureOutputPathExists.js');

const ppro = require("premierepro");

/**
 * @param {string} sep - OS path separator
 * @param {Object} folderItem - FolderItem from the project panel selection (already cast)
 * @param {string} exportBasePath - Absolute path to the output directory
 * @returns {Promise<{exported: number, failed: number}>}
 */
async function exportSequencesFromBin(sep, folderItem, exportBasePath) {
    console.log(`exportSequencesFromBin — folder: ${folderItem.name}, path: ${exportBasePath}`);

    const { created } = await ensureOutputPathExists(exportBasePath);
    if (created) console.log(`Created missing output directory: ${exportBasePath}`);

    // cast each bin item and filter to sequences only (same pattern as createSequencesFromBin)
    const rawItems = await folderItem.getItems();
    const sequences = [];
    let mediaCount = 0;
    for (const item of rawItems) {
        const clipItem = ppro.ClipProjectItem.cast(item);
        if (!clipItem) continue;
        const contentType = await clipItem.getContentType();
        if (contentType === ppro.Constants.ContentType.SEQUENCE) {
            const seq = await clipItem.getSequence();
            if (seq) sequences.push({ name: clipItem.name, sequence: seq });
        } else if (contentType === ppro.Constants.ContentType.MEDIA) {
            mediaCount++;
        }
    }

    console.log(`Found ${sequences.length} sequence(s) and ${mediaCount} media item(s) in bin: ${folderItem.name}`);
    if (sequences.length === 0) return { exported: 0, failed: 0 };

    const presetPath = await getPresetPath('KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr');
    if (!presetPath) {
        console.error('Could not load preset path — aborting export');
        return { exported: 0, failed: sequences.length };
    }
    console.log(`Preset path resolved to: ${presetPath}`);

    const exportFull = true;
    let exportedCount = 0;
    let failedCount = 0;

    for (const { name, sequence } of sequences) {
        const outputPath = `${exportBasePath}${sep}${name}.mov`;
        console.log(`Queuing: ${name} → ${outputPath}`);
        const success = await sendToMEwithPreset(sequence, outputPath, presetPath, exportFull);
        if (success) {
            exportedCount++;
        } else {
            console.error(`Failed to queue: ${name}`);
            failedCount++;
        }
    }

    console.log(`Done — queued ${exportedCount}/${sequences.length} sequence(s) to AME`);
    return { exported: exportedCount, failed: failedCount };
}

module.exports = { exportSequencesFromBin };
