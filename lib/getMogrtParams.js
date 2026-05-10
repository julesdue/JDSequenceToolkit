async function getMogrtParams(source) {
  try {
    if (!source) throw new Error('Source is null or undefined');

    const params = [];

    // Path A: source.properties collection (numItems + array access)
    if (source.properties && typeof source.properties.numItems !== 'undefined') {
      const count = typeof source.properties.numItems === 'number'
        ? source.properties.numItems
        : await source.properties.numItems;
      console.log(`  Using source.properties collection (${count} items)`);
      for (let i = 0; i < count; i++) {
        try {
          const param = source.properties[i];
          if (!param) continue;
          let displayName;
          try { displayName = param.displayName; } catch (_) { displayName = ''; }
          if (!displayName) { try { displayName = param.name; } catch (_) {} }
          console.log(`    param[${i}]: "${displayName}"`);
          params.push({ index: i, displayName: displayName || `param_${i}`, param });
        } catch { break; }
      }
      console.log(`✅ Extracted ${params.length} MOGRT parameters`);
      return params;
    }

    // Path B: MGT Component with properties.getParamForDisplayName
    if (source.properties && typeof source.properties.getParamForDisplayName === 'function') {
      console.log(`  Using MGT properties model`);
      const displayNames = source.properties.getDisplayNames
        ? await source.properties.getDisplayNames()
        : null;
      if (displayNames && typeof displayNames.forEach === 'function') {
        displayNames.forEach(name => {
          const param = source.properties.getParamForDisplayName(name);
          params.push({ index: -1, displayName: name, param });
          console.log(`    MGT param: "${name}"`);
        });
      }
      console.log(`✅ Extracted ${params.length} MOGRT parameters`);
      return params;
    }

    // Path C: Standard Component with getParam(index)
    for (let i = 0; i < 200; i++) {
      try {
        let param = source.getParam(i);
        if (param instanceof Promise) param = await param;
        if (param === null || param === undefined) continue;
        let displayName;
        try { displayName = await param.displayName; } catch (_) { displayName = ''; }
        if (!displayName) { try { displayName = param.name; } catch (_) {} }
        console.log(`    param[${i}]: "${displayName}"`);
        params.push({ index: i, displayName: displayName || `param_${i}`, param });
      } catch {
        break;
      }
    }

    console.log(`✅ Extracted ${params.length} MOGRT parameters`);
    return params;
  } catch (err) {
    console.error('❌ getMogrtParams error:', err);
    return [];
  }
}

module.exports = { getMogrtParams };