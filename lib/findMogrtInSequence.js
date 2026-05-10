const ppro = require('premierepro');

async function findMogrtInSequence(sequence, project) {
  try {
    if (!sequence) throw new Error('Sequence is null or undefined');

    const videoTrackCount = await sequence.getVideoTrackCount();
    console.log(`  📊 Scanning ${videoTrackCount} video tracks`);

    for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
      const track = await sequence.getVideoTrack(trackIdx);
      if (!track) continue;

      const clips = await track.getTrackItems(1, false);
      const clipCount = clips ? clips.length : 0;
      console.log(`    Track V${trackIdx + 1}: ${clipCount} clips`);

      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = clips[clipIdx];
        if (!clip) continue;

        const clipName = (typeof clip.getName === 'function') ? await clip.getName() : '(unnamed)';
        console.log(`\n      📋 Clip ${clipIdx}: "${clipName}"`);

        // Try to identify MOGRT by media path
        if (typeof clip.getProjectItem === 'function') {
          try {
            const projectItem = await clip.getProjectItem();
            if (projectItem) {
              const clipItem = ppro.ClipProjectItem.cast(projectItem);
              const mediaPath = await clipItem.getMediaFilePath();
              console.log(`          mediaPath: "${mediaPath}"`);

              if (mediaPath && (mediaPath.endsWith('.aegraphic') || mediaPath.endsWith('.mogrt'))) {
                console.log(`          ✅ Confirmed MOGRT by path`);

                // Try clip's component chain — use chain.components collection
                if (typeof clip.getComponentChain === 'function') {
                  const chain = clip.getComponentChain();
                  const resolvedChain = chain instanceof Promise ? await chain : chain;
                  if (resolvedChain) {
                    const componentResult = await scanChainComponents(resolvedChain);
                    if (componentResult) {
                      console.log(`          ✅ Found MOGRT component via chain.components`);
                      return { clip, projectItem: clipItem, component: componentResult, trackIndex: trackIdx, clipIndex };
                    }
                  }
                }

                // No component found — return clip only
                return { clip, projectItem: clipItem, component: null, trackIndex: trackIdx, clipIndex };
              }
            }
          } catch (e) {
            console.log(`          getProjectItem error: ${e.message}`);
          }
        }
      }
    }

    console.log('\n⚠️  Finished scanning all clips - no MOGRT found');
    return null;
  } catch (err) {
    console.error('❌ findMogrtInSequence error:', err);
    return null;
  }
}

async function scanChainComponents(chain) {
  // Try chain.components collection (numItems + array indexing)
  if (chain.components && typeof chain.components.numItems !== 'undefined') {
    const count = typeof chain.components.numItems === 'number'
      ? chain.components.numItems
      : await chain.components.numItems;
    console.log(`          chain.components.numItems: ${count}`);

    for (let i = 0; i < count; i++) {
      try {
        const comp = chain.components[i];
        if (!comp) continue;
        let name;
        try { name = comp.displayName; } catch (_) { name = ''; }
        if (!name) { try { name = comp.name; } catch (_) {} }
        console.log(`            Component [${i}]: "${name}"`);

        // Check comp.properties collection
        if (comp.properties && typeof comp.properties.numItems !== 'undefined') {
          const pCount = typeof comp.properties.numItems === 'number'
            ? comp.properties.numItems
            : await comp.properties.numItems;
          console.log(`              properties.numItems: ${pCount}`);
          if (pCount > 0) {
            for (let pi = 0; pi < pCount; pi++) {
              try {
                const p = comp.properties[pi];
                if (!p) continue;
                let dn;
                try { dn = p.displayName; } catch (_) { try { dn = p.name; } catch (_) { dn = ''; } }
                console.log(`              param[${pi}]: "${dn}"`);
              } catch { break; }
            }
            return comp;
          }
        }
      } catch { break; }
    }
  }

  return null;
}

module.exports = { findMogrtInSequence };