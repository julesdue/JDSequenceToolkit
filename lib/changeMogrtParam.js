const ppro = require('premierepro');

async function changeMogrtParam(param, newValue) {
  try {
    if (!param || newValue === undefined) {
      console.error('changeMogrtParam: Missing required arguments (param, newValue)');
      return false;
    }

    const project = await ppro.Project.getActiveProject();

    let valueToSet = newValue;

    // Check if param stores JSON (MOGRT text params)
    try {
      const startKF = await param.getStartValue();
      const currentVal = startKF?.value?.value;
      if (currentVal && typeof currentVal === 'string') {
        const parsed = JSON.parse(currentVal);
        if (parsed && typeof parsed === 'object' && parsed.text !== undefined) {
          parsed.text = String(newValue);
          valueToSet = JSON.stringify(parsed);
        }
      }
    } catch (_) {}

    const kfEntry = param.createKeyframe(valueToSet);
    const action = param.createSetValueAction(kfEntry);

    await project.lockedAccess(async () => {
      project.executeTransaction((compoundAction) => {
        compoundAction.addAction(action);
      });
    });

    return true;
  } catch (err) {
    console.error('changeMogrtParam error:', err);
    return false;
  }
}

module.exports = { changeMogrtParam };