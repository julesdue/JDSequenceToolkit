const ppro = require('premierepro');
const { canUseExecuteScript } = require('./canUseExecuteScript.js');
const { setMogrtParamViaJSX } = require('./setMogrtParamViaJSX.js');

async function changeMogrtParam(param, newValue, opts) {
  try {
    if (!param || newValue === undefined) {
      console.error('changeMogrtParam: Missing required arguments (param, newValue)');
      return false;
    }

    // JSX path: if executeScript is available and options provided
    if (opts?.trackIdx !== undefined && opts?.clipIdx !== undefined && opts?.paramName) {
      const canUseJsx = await canUseExecuteScript();
      if (canUseJsx) {
        const result = await setMogrtParamViaJSX(
          opts.trackIdx,
          opts.clipIdx,
          opts.paramName,
          newValue
        );
        if (result.ok) {
          console.log(`changeMogrtParam: JSX path succeeded for "${opts.paramName}"`);
          return true;
        } else {
          console.warn(`changeMogrtParam: JSX path failed (${result.detail}), falling back to UXP`);
        }
      }
    }

    // UXP path: traditional component-chain mutation
    const project = await ppro.Project.getActiveProject();

    let valueToSet = newValue;

    // Check if param stores JSON (MOGRT text params)
    try {
      const startKF = await param.getStartValue();
      const currentVal = startKF?.value?.value;
      if (currentVal && typeof currentVal === 'string') {
        const parsed = JSON.parse(currentVal);
        if (parsed && typeof parsed === 'object' && (parsed.text !== undefined || parsed.textEditValue !== undefined)) {
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