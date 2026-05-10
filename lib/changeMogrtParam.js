const ppro = require('premierepro');

async function changeMogrtParam(clip, param, newValue) {
  try {
    if (!clip || !param || newValue === undefined) {
      console.error("changeMogrtParam: Missing required arguments (clip, param, newValue)");
      return false;
    }

    const project = ppro.app.getCurrentProject();

    let valueToSet = newValue;

    // Check if param value is JSON (MOGRT text params store styling in JSON)
    try {
      const currentValue = param.getValue();
      if (currentValue) {
        const parsed = typeof currentValue === 'string' ? JSON.parse(currentValue) : currentValue;
        if (parsed && typeof parsed === 'object' && parsed.text !== undefined) {
          parsed.text = String(newValue);
          valueToSet = JSON.stringify(parsed);
          console.log(`  MOGRT param is JSON-based, updating .text field`);
        }
      }
    } catch (_) {
      // Not JSON, use plain value
    }

    const keyframe = param.createKeyframe(valueToSet);
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