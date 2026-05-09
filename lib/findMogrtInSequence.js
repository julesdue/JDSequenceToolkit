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
      if (!track) continue;

      const clips = await track.getTrackItems(1, false);
      const clipCount = clips ? clips.length : 0;
      console.log(`    Track V${trackIdx + 1}: ${clipCount} clips`);

      for (let clipIdx = 0; clipIdx < clipCount; clipIdx++) {
        const clip = clips[clipIdx];
        if (!clip) continue;

        console.log(`\n      📋 Clip ${clipIdx}:`);
        console.log(`        Name: ${clip.name || '(unnamed)'}`);
        console.log(`        Type: ${clip.constructor.name}`);

        // Log all enumerable properties
        console.log(`        Properties:`);
        for (const key in clip) {
          try {
            const value = clip[key];
            const type = typeof value;
            if (type !== 'function') {
              console.log(`          ${key}: ${type === 'object' ? '[object]' : value}`);
            }
          } catch (e) {
            // Skip properties that throw
          }
        }

        // Log all methods
        const methods = [];
        for (const key in clip) {
          if (typeof clip[key] === 'function') {
            methods.push(key);
          }
        }
        console.log(`        Methods (${methods.length}): ${methods.slice(0, 15).join(', ')}${methods.length > 15 ? '...' : ''}`);

        // Try to call various methods and log their results
        const methodsToTry = ['getComponentChain', 'getMetadata', 'getProperties', 'getName', 'getType'];
        for (const method of methodsToTry) {
          if (typeof clip[method] === 'function') {
            try {
              let result = clip[method]();
              // Await if it's a Promise
              if (result instanceof Promise) {
                result = await result;
              }
              console.log(`        ${method}() = ${result === null ? 'null' : result === undefined ? 'undefined' : typeof result === 'object' ? `[${result.constructor.name}]` : result}`);

              // Special handling for component chain
              if (method === 'getComponentChain' && result) {
                const chain = result;
                console.log(`          Chain numComponents: ${chain.numComponents}`);

                // Try to iterate through components even if numComponents is undefined
                console.log(`          Trying to get components...`);
                let foundComponent = false;
                for (let i = 0; i < 10; i++) {  // Try up to 10 indices
                  try {
                    const comp = chain.getComponentAtIndex(i);
                    if (!comp) {
                      console.log(`            [${i}] null - stopping`);
                      break;
                    }
                    console.log(`            [${i}] ${comp.displayName}`);
                    if (comp.displayName === 'Motion Graphics') {
                      console.log(`✅ Found MOGRT!`);
                      return { clip, component: comp, trackIndex: trackIdx, clipIndex: clipIdx };
                    }
                    foundComponent = true;
                  } catch (e) {
                    console.log(`            [${i}] error: ${e.message}`);
                    break;
                  }
                }
                if (!foundComponent) {
                  console.log(`            (no components found)`);
                }
              }
            } catch (e) {
              console.log(`        ${method}() threw: ${e.message}`);
            }
          }
        }
      }
    }

    console.log('\n⚠️  Finished scanning all clips');
    return null;
  } catch (err) {
    console.error('❌ findMogrtInSequence error:', err);
    return null;
  }
}

module.exports = { findMogrtInSequence };
