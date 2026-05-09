/**
 * sendToAMEwithPreset.js
 *
 * Queues a sequence for export to Adobe Media Encoder (queue mode).
 * Unlike exportWithPreset (immediate), this adds to AME's render queue.
 * Checks AME installation before attempting export.
 *
 * Usage:
 *   const success = await sendToMEwithPreset(
 *     sequence,
 *     "/path/to/output.mov",
 *     "#file:payloads/v26/preset.epr"
 *   );
 */

// global objects
const ppro = require("premierepro");

/**
 * Queue sequence export to Adobe Media Encoder (queue mode)
 * @param {Object} sequence - Premiere sequence object
 * @param {string} outputPath - Output file path
 * @param {string} presetPath - Plugin file URL to preset (e.g., "#file:payloads/v26/preset.epr")
 * @param {Object} exportArea - Export area object (optional)
 * @returns {Promise<boolean>} true if queued successfully, false on error
 */
async function sendToMEwithPreset(sequence, outputPath, presetPath, exportArea) {
    console.log('sendToMEwithPreset called');

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
    const exportType = constants.ExportType.QUEUE_TO_AME;
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
module.exports = { sendToMEwithPreset };