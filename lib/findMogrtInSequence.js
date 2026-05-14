const ppro = require('premierepro');

async function findMogrtInSequence(sequence, project) {
  try {
    if (!sequence) throw new Error('Sequence is null or undefined');

    const videoTrackCount = await sequence.getVideoTrackCount();
    console.log(`  Scanning ${videoTrackCount} video tracks`);

    // First pass: find all MOGRTs and their parameters
    const mogrtCandidates = [];

    for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
      const track = await sequence.getVideoTrack(trackIdx);
      if (!track) continue;

      const clips = await track.getTrackItems(1, false);
      const clipCount = clips ? clips.length : 0;

      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = clips[clipIdx];
        if (!clip) continue;

        const clipName = (typeof clip.getName === 'function') ? await clip.getName() : '(unnamed)';
        console.log(`\n  Clip [${trackIdx}][${clipIdx}]: "${clipName}"`);

        // Identify MOGRT by media path
        if (typeof clip.getProjectItem === 'function') {
          try {
            const projectItem = await clip.getProjectItem();
            if (projectItem) {
              const clipItem = ppro.ClipProjectItem.cast(projectItem);
              const mediaPath = await clipItem.getMediaFilePath();

              if (mediaPath && (mediaPath.endsWith('.aegraphic') || mediaPath.endsWith('.mogrt'))) {
                console.log(`    📹 MOGRT detected: ${mediaPath.split('\\').pop()}`);
                const result = await scanMogrtComponents(clip, trackIdx, clipIdx);
                if (result && result.componentParams) {
                  mogrtCandidates.push({
                    clip,
                    projectItem: clipItem,
                    ...result,
                    paramNames: result.componentParams.map(p => p.name)
                  });
                  console.log(`    📊 Parameters found: ${result.componentParams.map(p => p.name).join(', ')}`);
                }
              }
            }
          } catch (_) {}
        }
      }
    }

    if (mogrtCandidates.length === 0) {
      console.log('\n❌ No MOGRT with parameters found in sequence');
      return null;
    }

    console.log(`\n📋 Found ${mogrtCandidates.length} MOGRT(s) with parameters`);

    // Return the first MOGRT found (or implement smarter selection if needed)
    const selected = mogrtCandidates[0];
    console.log(`✅ Selected MOGRT from clip [${selected.trackIndex}][${selected.clipIndex}]: ${selected.paramNames.join(', ')}`);
    return selected;
  } catch (err) {
    console.error('findMogrtInSequence error:', err);
    return null;
  }
}

async function scanMogrtComponents(clip, trackIdx, clipIdx) {
  if (typeof clip.getComponentChain !== 'function') return null;

  const chain = await clip.getComponentChain();

  // Retry loop for the v26 component count bug (CLAUDE.md gotcha #1)
  let count = 0;
  const maxRetries = 20;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    count = await chain.getComponentCount();
    if (count > 1) break; // Expect at least 2 components on a real MOGRT
    if (attempt < maxRetries - 1) {
      console.log(`    ⏳ Component count = ${count}, retrying (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(r => setTimeout(r, 250));
    }
  }

  console.log(`    📦 Total components: ${count}`);

  // Skip standard effect components — look for the MOGRT-specific component (Graphic Parameters / Grafikparameter)
  const skipNames = ['motion', 'opacity', 'time remapping', 'deckkraft', 'bewegung', 'zeit-neuzuordnung', 'überblendmodus'];

  // First pass: log all components for visibility
  const allComponents = [];
  for (let i = 0; i < count; i++) {
    const comp = await chain.getComponentAtIndex(i);
    const name = await comp.getDisplayName();
    allComponents.push({ comp, name });
    console.log(`    Component ${i}: "${name}"`);
  }

  // Second pass: find the MOGRT graphic parameters component
  for (const { comp, name } of allComponents) {
    const isSkipped = skipNames.some(s => name.toLowerCase().includes(s));
    if (isSkipped) {
      console.log(`      (skipped: "${name}")`);
      continue;
    }

    const params = await scanComponentParams(comp);
    if (params && params.length > 0) {
      console.log(`      ✅ Found ${params.length} parameters in "${name}"`);
      params.forEach(p => console.log(`        - ${p.name}`));
      return { component: comp, componentParams: params, trackIndex: trackIdx, clipIndex: clipIdx };
    } else {
      console.log(`      (no parameters in "${name}")`);
    }
  }

  return null;
}

async function scanComponentParams(comp) {
  const count = await comp.getParamCount();
  const params = [];

  for (let i = 0; i < count; i++) {
    try {
      const param = await comp.getParam(i);
      const startKF = await param.getStartValue();
      const value = startKF?.value?.value;
      params.push({ param, name: param.displayName, value, index: i });
    } catch (_) { break; }
  }

  return params.length > 0 ? params : null;
}

module.exports = { findMogrtInSequence };