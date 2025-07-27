// exportSequencesToMEUXP.js
// UXP version of exportSequencesToME using Premiere Pro UXP APIs
// See: https://developer.adobe.com/premiere-pro/uxp/ppro_reference/

/**
 * Attempts to export sequences in a bin to Media Encoder using UXP APIs.
 * @param {string} binName - Name of the bin to process
 * @param {string} exportBasePath - Base path for export
 * @param {string} payloadsPath - Path to the preset payloads
 * @param {string} sep - Path separator (unused in UXP, use path.join)
 */
async function exportSequencesToMEUXP(binName, exportBasePath, payloadsPath, sep) {
    // Log start of function
    console.log('exportSequencesToMEUXP called');

    // Launch Media Encoder using UXP API
    await app.encoder.launchEncoder();
    console.log('Launched Media Encoder');

    // Get the current project using UXP API
    const project = await app.project.getCurrentProject();
    if (!project) {
        console.error('No active project found.');
        return;
    }
    console.log('Project object acquired');

    // Find the bin by name using UXP API
    const bin = await project.findBinByName(binName);
    if (!bin) {
        console.error(`[ME Export] Bin not found: ${binName}`);
        return;
    }

    let exportedCount = 0;
    console.log(`Starting export loop for bin: ${binName}`);
    for (let i = 0; i < bin.children.length; i++) {
        const projItemFile = bin.children[i];
        if (projItemFile && projItemFile.name && projItemFile.name.endsWith('_dnx')) {
            console.log(`Exporting file: ${projItemFile.name}`);
            // Find the sequence object by name using UXP API
            const sequences = await project.getSequences();
            const targetSeq = sequences.find(seq => seq.name === projItemFile.name);
            if (!targetSeq) {
                console.warn(`[ME Export] Could not find sequence object for: ${projItemFile.name}`);
                continue;
            }
            // Set the active sequence
            await project.setActiveSequence(targetSeq);
            const seqName = projItemFile.name;
            // Build preset path (use path.join in UXP if needed)
            const presetPath = `${payloadsPath}KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr`;
            console.log(`[ME Export] Exporting sequence: ${seqName} with preset: ${presetPath}`);
            // Build output path
            const outputPath = `${exportBasePath}${sep}${binName}${sep}${seqName}.mov`;
            console.log(`[ME Export] Sequence: ${seqName} exporting to constructed path: ${outputPath}`);
            // Set export options
            const workArea = 'ENTIRE'; // UXP API may use string or enum
            const removeUponCompletion = false;
            console.log('[ME Export] Preparing to encode sequence');
            // Send to Media Encoder using UXP API
            const jobId = await app.encoder.encodeSequence({
                sequence: targetSeq,
                outputPath,
                presetPath,
                workArea,
                removeUponCompletion
            });
            if (jobId) {
                console.log(`[ME Export] Sent to Media Encoder: ${seqName}`);
                exportedCount++;
            } else {
                console.warn(`[ME Export] Failed to send: ${seqName}`);
            }
        }
    }
    console.log(`[ME Export] Exported ${exportedCount} sequences from bin: ${binName}`);
}

module.exports = { exportSequencesToMEUXP };
