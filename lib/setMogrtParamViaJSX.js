const ppro = require('premierepro');
const { canUseExecuteScript, getExecuteScriptRunner } = require('./canUseExecuteScript.js');

function escapeJSXString(str) {
  // Escape special characters for JSX string embedding
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

async function setMogrtParamViaJSX(trackIdx, clipIdx, paramName, newValue) {
  try {
    const available = await canUseExecuteScript();
    if (!available) {
      return { ok: false, detail: 'executeScript not available' };
    }

    const runner = getExecuteScriptRunner();
    if (!runner) {
      return { ok: false, detail: 'executeScript runner not initialized' };
    }

    const escapedParamName = escapeJSXString(paramName);
    const escapedValue = escapeJSXString(String(newValue));

    const jsx = `
      (function() {
        try {
          var seq = app.project.activeSequence;
          if (!seq) return "err:no active sequence";

          var clip = seq.videoTracks[${trackIdx}].clips[${clipIdx}];
          if (!clip) return "err:clip not found at [${trackIdx}][${clipIdx}]";

          var comp = clip.getMGTComponent();
          if (!comp) return "err:clip has no MOGRT component";

          var param = comp.properties.getParamForDisplayName("${escapedParamName}");
          if (!param) return "err:parameter '${escapedParamName}' not found";

          var existing = param.getValue();
          var finalVal;

          // Try to parse as JSON and update text key
          try {
            var obj = JSON.parse(existing);
            if (typeof obj === 'object' && obj !== null) {
              // Try 'text' first, then 'textEditValue'
              if ('text' in obj) {
                obj.text = "${escapedValue}";
              } else if ('textEditValue' in obj) {
                obj.textEditValue = "${escapedValue}";
              } else {
                obj.text = "${escapedValue}";
              }
              finalVal = JSON.stringify(obj);
            } else {
              finalVal = "${escapedValue}";
            }
          } catch (parseErr) {
            finalVal = "${escapedValue}";
          }

          param.setValue(finalVal, true);
          return "ok:" + finalVal;
        } catch (e) {
          return "err:" + e.message;
        }
      })();
    `;

    const result = await runner.fn(jsx);
    const resultStr = String(result);

    if (resultStr.startsWith('ok:')) {
      return { ok: true, detail: resultStr.substring(3) };
    } else if (resultStr.startsWith('err:')) {
      return { ok: false, detail: resultStr.substring(4) };
    } else {
      return { ok: false, detail: `unexpected response: ${resultStr}` };
    }
  } catch (e) {
    console.error('setMogrtParamViaJSX error:', e);
    return { ok: false, detail: e.message };
  }
}

module.exports = { setMogrtParamViaJSX };
