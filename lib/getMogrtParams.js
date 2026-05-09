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
