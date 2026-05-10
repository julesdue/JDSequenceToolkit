const fs = require('fs');

/**
 * Checks if a directory path exists; creates it (recursively) if it does not.
 * UXP fs is callback-based — wraps lstat/mkdir in Promises.
 * @param {string} dirPath - Absolute path to the output directory
 * @returns {Promise<{ created: boolean }>} Whether the directory was newly created
 * @throws {Error} If the path is empty or directory creation fails
 */
async function ensureOutputPathExists(dirPath) {
    if (!dirPath || !dirPath.trim()) throw new Error('No output path provided');

    const exists = await new Promise((resolve) => {
        fs.lstat(dirPath, (err) => resolve(!err));
    });

    if (exists) {
        console.log(`Output path already exists: ${dirPath}`);
        return { created: false };
    }

    await new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (err) => (err ? reject(err) : resolve(undefined)));
    });
    console.log(`Created output directory: ${dirPath}`);
    return { created: true };
}

module.exports = { ensureOutputPathExists };
