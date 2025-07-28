// global objects
const ppro = require("premierepro");

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