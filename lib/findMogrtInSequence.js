const ppro = require('premierepro');

async function findMogrtInSequence(sequence, project) {
  try {
    if (!sequence) throw new Error('Sequence is null or undefined');

    const videoTrackCount = await sequence.getVideoTrackCount();
    console.log(`  Scanning ${videoTrackCount} video tracks`);

    for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
      const track = await sequence.getVideoTrack(trackIdx);
      if (!track) continue;

      const clips = await track.getTrackItems(1, false);
      const clipCount = clips ? clips.length : 0;

      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = clips[clipIdx];
        if (!clip) continue;

        const clipName = (typeof clip.getName === 'function') ? await clip.getName() : '(unnamed)';
        console.log(`\n  Clip ${clipIdx}: "${clipName}"`);

        // Identify MOGRT by media path
        if (typeof clip.getProjectItem === 'function') {
          try {
            const projectItem = await clip.getProjectItem();
            if (projectItem) {
              const clipItem = ppro.ClipProjectItem.cast(projectItem);
              const mediaPath = await clipItem.getMediaFilePath();

              if (mediaPath && (mediaPath.endsWith('.aegraphic') || mediaPath.endsWith('.mogrt'))) {
                const result = await scanMogrtComponents(clip, trackIdx, clipIdx);
                if (result) {
                  return { clip, projectItem: clipItem, ...result };
                }
                return { clip, projectItem: clipItem, component: null, componentParams: null, trackIndex: trackIdx, clipIndex: clipIdx };
              }
            }
          } catch (_) {}
        }
      }
    }

    console.log('\nNo MOGRT found in sequence');
    return null;
  } catch (err) {
    console.error('findMogrtInSequence error:', err);
    return null;
  }
}

async function scanMogrtComponents(clip, trackIdx, clipIdx) {
  if (typeof clip.getComponentChain !== 'function') return null;

  const chain = await clip.getComponentChain();
  const count = await chain.getComponentCount();

  for (let i = 0; i < count; i++) {
    const comp = await chain.getComponentAtIndex(i);
    const name = await comp.getDisplayName();

    // Skip Motion/Opacity/etc — look for the MOGRT-specific component
    const skipNames = ['motion', 'opacity', 'time remapping'];
    const isSkipped = skipNames.some(s => name.toLowerCase().includes(s));
    if (isSkipped) continue;

    const params = await scanComponentParams(comp);
    if (params && params.length > 0) {
      return { component: comp, componentParams: params, trackIndex: trackIdx, clipIndex: clipIdx };
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