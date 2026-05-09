async function findMogrtInSequence(sequence) {
  try {
    if (!sequence) {
      throw new Error('Sequence is null or undefined');
    }

    const videoTrackCount = sequence.getVideoTrackCount();

    for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
      const track = sequence.getVideoTrack(trackIdx);
      if (!track) continue;

      const clipCount = track.clips.length;
      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = track.clips[clipIdx];
        if (!clip) continue;

        try {
          const chain = clip.getComponentChain();
          for (let compIdx = 0; compIdx < chain.numComponents; compIdx++) {
            const component = chain.getComponentAtIndex(compIdx);
            if (component.displayName === 'Motion Graphics') {
              console.log(`✅ Found MOGRT clip: V${trackIdx + 1} clip ${clipIdx} - "${clip.name || 'Unnamed'}"`);
              return { clip, component, trackIndex: trackIdx, clipIndex: clipIdx };
            }
          }
        } catch (err) {
          // Skip clips that don't have component chain
          continue;
        }
      }
    }

    console.log('⚠️  No MOGRT clip found in sequence');
    return null;
  } catch (err) {
    console.error('❌ findMogrtInSequence error:', err);
    return null;
  }
}

module.exports = { findMogrtInSequence };
