const { sendToMEwithPreset } = require('../lib/sendToAMEwithPreset.js');
const { getPresetPath } = require('../lib/getVersionAwareResources.js');
const { ensureOutputPathExists } = require('../lib/ensureOutputPathExists.js');

const ppro = require("premierepro");

/**
 * @param {string} sep - OS path separator
 * @param {{name: string, getItems: Function}} folderItem - FolderItem from the project panel selection (already cast)
 * @param {string} exportBasePath - Absolute path to the output directory
 * @returns {Promise<{exported: number, failed: number}>}
 */
async function exportSequencesFromBin(sep, folderItem, exportBasePath) {
    console.log(`exportSequencesFromBin — folder: "${folderItem.name}", path: "${exportBasePath}"`);

    // Step 1: ensure output directory exists
    console.log(`[1/5] Ensuring output path exists: ${exportBasePath}`);
    const { created } = await ensureOutputPathExists(exportBasePath);
    console.log(`[1/5] Output path check done — created: ${created}`);

    // Step 2: fetch raw items from bin
    console.log(`[2/5] Fetching items from bin: ${folderItem.name}`);
    const rawItems = await folderItem.getItems();
    console.log(`[2/5] Raw items returned: ${rawItems ? rawItems.length : 'null/undefined'}`);

    // Step 3: cast and filter to sequences only
    console.log(`[3/5] Casting and filtering items for sequences...`);
    const sequences = [];
    let mediaCount = 0;
    let otherCount = 0;
    for (let i = 0; i < rawItems.length; i++) {
        const item = rawItems[i];
        console.log(`  item[${i}]: attempting ClipProjectItem.cast...`);
        const clipItem = ppro.ClipProjectItem.cast(item);
        if (!clipItem) {
            console.log(`  item[${i}]: cast returned null — skipping`);
            otherCount++;
            continue;
        }
        console.log(`  item[${i}]: cast OK — name: "${clipItem.name}", getting content type...`);
        const contentType = await clipItem.getContentType();
        console.log(`  item[${i}]: contentType = ${contentType}`);
        if (contentType === ppro.Constants.ContentType.SEQUENCE) {
            console.log(`  item[${i}]: is SEQUENCE — fetching sequence object...`);
            const seq = await clipItem.getSequence();
            if (seq) {
                sequences.push({ name: clipItem.name, sequence: seq });
                console.log(`  item[${i}]: sequence added — "${clipItem.name}"`);
            } else {
                console.warn(`  item[${i}]: getSequence() returned null for "${clipItem.name}"`);
            }
        } else if (contentType === ppro.Constants.ContentType.MEDIA) {
            mediaCount++;
        } else {
            otherCount++;
        }
    }
    console.log(`[3/5] Filter done — ${sequences.length} sequence(s), ${mediaCount} media, ${otherCount} other/non-cast`);

    if (sequences.length === 0) {
        console.log(`[3/5] No sequences found — aborting early`);
        return { exported: 0, failed: 0 };
    }

    // Step 4: resolve preset path
    const presetName = 'KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr';
    console.log(`[4/5] Resolving preset path for: ${presetName}`);
    const presetPath = await getPresetPath(presetName);
    if (!presetPath) {
        console.error(`[4/5] Could not resolve preset path — aborting export`);
        return { exported: 0, failed: sequences.length };
    }
    console.log(`[4/5] Preset resolved: ${presetPath}`);

    // Step 5: queue each sequence to AME
    console.log(`[5/5] Queuing ${sequences.length} sequence(s) to AME...`);
    const exportFull = true;
    let exportedCount = 0;
    let failedCount = 0;

    for (const { name, sequence } of sequences) {
        const outputPath = `${exportBasePath}${sep}${name}.mov`;
        console.log(`  Queuing: "${name}" → "${outputPath}"`);
        const success = await sendToMEwithPreset(sequence, outputPath, presetPath, exportFull);
        if (success) {
            exportedCount++;
            console.log(`  ✅ Queued OK: "${name}"`);
        } else {
            failedCount++;
            console.error(`  ❌ Failed to queue: "${name}"`);
        }
    }

    console.log(`[5/5] Done — queued ${exportedCount}/${sequences.length} sequence(s), failed: ${failedCount}`);
    return { exported: exportedCount, failed: failedCount };
}

module.exports = { exportSequencesFromBin };
