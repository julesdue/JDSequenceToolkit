/**
 * changeMogrtParam.js
 *
 * Modifies a Motion Graphics Template parameter via the action pattern.
 * Creates a keyframe with the new value and executes it as an undoable action.
 *
 * Usage:
 *   const success = await changeMogrtParam(clip, param, newValue);
 */

const ppro = require("premierepro");

/**
 * Update MOGRT parameter value (undoable)
 * @param {Object} clip - Video clip containing the MOGRT component
 * @param {Object} param - MOGRT parameter object (from component.getParamAtIndex)
 * @param {*} newValue - New parameter value (type must match parameter)
 * @returns {Promise<boolean>} true if successful, false on error
 */
async function changeMogrtParam(clip, param, newValue) {
  try {
    if (!clip || !param || newValue === undefined) {
      console.error("changeMogrtParam: Missing required arguments (clip, param, newValue)");
      return false;
    }

    const project = ppro.app.getCurrentProject();

    const keyframe = param.createKeyframe(newValue);
    const action = param.createSetValueAction(keyframe, false);

    await project.executeAction(action);

    console.log(`✅ MOGRT parameter updated successfully`);
    return true;
  } catch (err) {
    console.error(`❌ changeMogrtParam error: ${err}`);
    return false;
  }
}

module.exports = { changeMogrtParam };
