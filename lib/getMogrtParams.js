/**
 * getMogrtParams.js
 *
 * Extracts all editable parameters from a Motion Graphics Template component.
 * Iterates through component parameters and returns their display names and references.
 *
 * Usage:
 *   const params = getMogrtParams(component);
 *   params.forEach(p => console.log(p.displayName));
 */

/**
 * Extract all MOGRT parameters from a component
 * @param {Object} component - Motion Graphics component (from clip.getComponentChain)
 * @returns {Array<Object>} Array of { index, displayName, param } objects
 */
function getMogrtParams(component) {
  try {
    if (!component) {
      throw new Error('Component is null or undefined');
    }

    const params = [];
    for (let i = 0; i < component.numParams; i++) {
      const param = component.getParamAtIndex(i);
      params.push({
        index: i,
        displayName: param.displayName,
        param: param
      });
    }

    console.log(`✅ Extracted ${params.length} MOGRT parameters from component "${component.displayName}"`);
    params.forEach(p => console.log(`  - ${p.displayName}`));
    return params;
  } catch (err) {
    console.error('❌ getMogrtParams error:', err);
    return [];
  }
}

module.exports = { getMogrtParams };
