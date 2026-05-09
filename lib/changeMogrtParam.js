const ppro = require("premierepro");

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
