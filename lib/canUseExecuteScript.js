const ppro = require('premierepro');

let cachedResult = null;
let cachedRunner = null;

// Probe all possible locations where executeScript might live in the UXP API
function findExecuteScriptRunner() {
  // Pattern A: ppro.Application.executeScript (static method)
  if (typeof ppro?.Application?.executeScript === 'function') {
    return { path: 'ppro.Application.executeScript', fn: (jsx) => ppro.Application.executeScript(jsx) };
  }

  // Pattern B: ppro.app.executeScript (instance method)
  if (typeof ppro?.app?.executeScript === 'function') {
    return { path: 'ppro.app.executeScript', fn: (jsx) => ppro.app.executeScript(jsx) };
  }

  // Pattern C: app.executeScript (global app object)
  try {
    if (typeof app !== 'undefined' && typeof app?.executeScript === 'function') {
      return { path: 'app.executeScript', fn: (jsx) => app.executeScript(jsx) };
    }
  } catch (_) {}

  // Pattern D: require("uxp") host
  try {
    const uxp = require('uxp');
    if (typeof uxp?.host?.executeScript === 'function') {
      return { path: 'uxp.host.executeScript', fn: (jsx) => uxp.host.executeScript(jsx) };
    }
  } catch (_) {}

  return null;
}

async function canUseExecuteScript() {
  if (cachedResult !== null) {
    return cachedResult;
  }

  // Dump diagnostic info on first call
  console.log('🔍 canUseExecuteScript probe:');
  console.log('   typeof ppro:', typeof ppro);
  console.log('   typeof ppro.Application:', typeof ppro?.Application);
  console.log('   typeof ppro.Application.executeScript:', typeof ppro?.Application?.executeScript);
  console.log('   typeof ppro.app:', typeof ppro?.app);
  console.log('   typeof ppro.app.executeScript:', typeof ppro?.app?.executeScript);
  try {
    console.log('   typeof global app:', typeof app);
    console.log('   typeof global app.executeScript:', typeof app?.executeScript);
  } catch (e) {
    console.log('   global app: not accessible');
  }

  const runner = findExecuteScriptRunner();
  if (!runner) {
    console.log('   ❌ No executeScript function found in any location');
    cachedResult = false;
    return false;
  }

  console.log(`   ✅ Found executeScript at: ${runner.path}`);

  try {
    const result = await runner.fn('"ok"');
    console.log(`   Smoke test result: ${JSON.stringify(result)}`);
    if (result === 'ok' || String(result).includes('ok')) {
      cachedRunner = runner;
      cachedResult = true;
      return true;
    } else {
      cachedResult = false;
      return false;
    }
  } catch (e) {
    console.warn('   ⚠️  Smoke test threw:', e.message);
    cachedResult = false;
    return false;
  }
}

function getExecuteScriptRunner() {
  return cachedRunner;
}

module.exports = { canUseExecuteScript, getExecuteScriptRunner };
