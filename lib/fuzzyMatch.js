/**
 * fuzzyMatch.js
 *
 * Performs fuzzy string matching using Levenshtein distance algorithm.
 * Finds the best match for a target string from a list of candidates.
 * Requires distance <= 3 or exact substring match to return a result.
 *
 * Usage:
 *   const best = fuzzyMatch("Titel", ["Title", "Subtitle", "Category"]);
 *   console.log(best); // "Title"
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance (lower = more similar)
 */
function levenshteinDistance(str1, str2) {
  str1 = str1.toLowerCase().replace(/[\s_-]+/g, '');
  str2 = str2.toLowerCase().replace(/[\s_-]+/g, '');

  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Find best fuzzy match from candidate list
 * @param {string} target - String to match
 * @param {Array<string>} candidates - List of candidates to search
 * @returns {string|null} Best matching candidate or null if no good match found
 */
function fuzzyMatch(target, candidates) {
  if (!candidates || candidates.length === 0) return null;

  let bestMatch = null;
  let bestScore = Infinity;

  candidates.forEach(candidate => {
    const distance = levenshteinDistance(target, candidate);
    if (distance < bestScore) {
      bestScore = distance;
      bestMatch = candidate;
    }
  });

  // Only return if similarity is reasonable (distance <= 3 or exact substring match)
  if (bestScore <= 3 || target.toLowerCase().includes(bestMatch.toLowerCase())) {
    console.log(`✅ Fuzzy match: "${target}" → "${bestMatch}" (distance: ${bestScore})`);
    return bestMatch;
  }

  console.log(`⚠️  No good fuzzy match for "${target}" (best distance: ${bestScore})`);
  return null;
}

module.exports = { fuzzyMatch, levenshteinDistance };
