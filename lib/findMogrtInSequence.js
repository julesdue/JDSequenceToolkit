/**
 * findMogrtInSequence.js
 *
 * Searches a sequence for Motion Graphics Template (MOGRT) clips.
 * Scans all video tracks and iterates through clips to find the first
 * component with displayName === 'Motion Graphics'.
 *
 * Usage:
 *   const result = await findMogrtInSequence(sequence);
 *   if (result) {
 *     const { clip, component, trackIndex, clipIndex } = result;
 *   }
 */

/**
 * Search sequence for first MOGRT clip
 * @param {Object} sequence - Premiere sequence object
 * @returns {Promise<Object|null>} { clip, component, trackIndex, clipIndex } or null if not found
 */
async function findMogrtInSequence(sequence) {
  try {
    if (!sequence) {
      throw new Error('Sequence is null or undefined');
    }

    const videoTrackCount = await sequence.getVideoTrackCount();
    console.log(`  📊 Scanning ${videoTrackCount} video tracks`);

    for (let trackIdx = 0; trackIdx < videoTrackCount; trackIdx++) {
      const track = await sequence.getVideoTrack(trackIdx);
      if (!track) {
        console.log(`    Track ${trackIdx}: not accessible`);
        continue;
      }

      // Try to get clips from track
      let clips = [];
      if (track.clips) {
        clips = track.clips;
      } else if (typeof track.getTrackItems === 'function') {
        clips = await track.getTrackItems(0, false);
      }

      const clipCount = clips.length || 0;
      console.log(`    Track V${trackIdx + 1}: ${clipCount} clips`);

      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = clips[clipIdx];
        if (!clip) {
          console.log(`      Clip ${clipIdx}: null`);
          continue;
        }

        console.log(`      Clip ${clipIdx}: "${clip.name}"`);

        try {
          const chain = clip.getComponentChain();
          console.log(`        Components: ${chain.numComponents}`);

          for (let compIdx = 0; compIdx < chain.numComponents; compIdx++) {
            const component = chain.getComponentAtIndex(compIdx);
            console.log(`          [${compIdx}] ${component.displayName}`);

            if (component.displayName === 'Motion Graphics') {
              console.log(`✅ Found MOGRT clip: V${trackIdx + 1} clip ${clipIdx} - "${clip.name || 'Unnamed'}"`);
              return { clip, component, trackIndex: trackIdx, clipIndex: clipIdx };
            }
          }
        } catch (err) {
          console.log(`        Error reading components: ${err.message}`);
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
