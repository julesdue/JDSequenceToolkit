/**
 * exportWithPreset.js
 *
 * Exports a sequence to Adobe Media Encoder (AME) with immediate rendering.
 * Checks AME installation before attempting export. Requires preset file path.
 *
 * Usage:
 *   const success = await exportWithPreset(
 *     sequence,
 *     "/path/to/output.mov",
 *     "#file:payloads/v26/preset.epr"
 *   );
 */

// global objects
const ppro = require("premierepro");

/**
 * Export sequence to Adobe Media Encoder (immediate mode)
 * @param {Object} sequence - Premiere sequence object
 * @param {string} outputPath - Output file path
 * @param {string} presetPath - Plugin file URL to preset (e.g., "#file:payloads/v26/preset.epr")
 * @param {Object} exportArea - Export area object (optional)
 * @returns {Promise<boolean>} true if export succeeded, false on error
 */
async function exportWithPreset(sequence, outputPath, presetPath, exportArea) {
    console.log('exportWithPreset called');

    // get the encoder manager
    const encoderManager = await ppro.EncoderManager.getManager();
    console.log('Encoder Manager: ', encoderManager);

    // Check if Media Encoder is installed
    if (!encoderManager.isAMEInstalled) {
        console.error('Media Encoder is not installed.');
        return;
    }
    console.log('Media Encoder is installed, proceeding with export.');


    // setup vars for export function
    // get the constants for export type
    const constants = ppro.Constants;
    const exportType = constants.ExportType.IMMEDIATELY;
    console.log(`Export type set to: ${exportType}`);


    // Send the sequence to Media Encoder with the specified preset
    const success = await encoderManager.exportSequence(sequence, exportType, outputPath, presetPath, exportArea);
    if (success) {
        console.log(`Sequence ${sequence.name} sent to Media Encoder successfully.`);
        return true;
    } else {
        console.error(`Failed to send sequence ${sequence.name} to Media Encoder.`);
    }
}
module.exports = { exportWithPreset };