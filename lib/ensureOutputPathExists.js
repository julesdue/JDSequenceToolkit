const storage = require('uxp').storage;

/**
 * Checks if a directory path exists; creates it (recursively) if it does not.
 * Uses UXP storage.localFileSystem since UXP fs callbacks are unreliable for stat/mkdir.
 * @param {string} dirPath - Absolute path to the output directory
 * @returns {Promise<{ created: boolean }>} Whether the directory was newly created
 * @throws {Error} If the path is empty or directory creation fails
 */
async function ensureOutputPathExists(dirPath) {
    if (!dirPath || !dirPath.trim()) throw new Error('No output path provided');

    const lfs = /** @type {any} */ (storage).localFileSystem;

    // Try to get the entry — if it resolves, the folder already exists
    try {
        await lfs.getEntryWithUrl(`file:${dirPath}`);
        console.log(`Output path already exists: ${dirPath}`);
        return { created: false };
    } catch (_) {
        // Entry doesn't exist — create it
    }

    // Walk up to find the nearest existing ancestor, then create downward
    const parts = dirPath.replace(/\\/g, '/').split('/').filter(Boolean);
    let ancestorPath = '';
    let splitIndex = parts.length;

    // Find deepest existing ancestor
    for (let i = parts.length; i > 0; i--) {
        const candidate = (dirPath.startsWith('\\\\') ? '\\\\' : '') + parts.slice(0, i).join('/');
        try {
            await lfs.getEntryWithUrl(`file:${candidate}`);
            ancestorPath = candidate;
            splitIndex = i;
            break;
        } catch (_) {
            // keep walking up
        }
    }

    if (!ancestorPath) throw new Error(`Cannot find any existing ancestor for path: ${dirPath}`);

    // Create each missing folder level one at a time
    /** @type {import('uxp').storage.Folder} */
    let currentFolder = /** @type {any} */ (await lfs.getEntryWithUrl(`file:${ancestorPath}`));
    for (let i = splitIndex; i < parts.length; i++) {
        currentFolder = await currentFolder.createFolder(parts[i]);
        console.log(`Created folder: ${parts[i]}`);
    }

    console.log(`Created output directory: ${dirPath}`);
    return { created: true };
}

module.exports = { ensureOutputPathExists };
