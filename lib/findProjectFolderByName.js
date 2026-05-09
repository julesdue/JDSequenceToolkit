/**
 * findProjectFolderByName.js
 *
 * Recursively searches the project folder hierarchy for a bin/folder by exact name match.
 * Casts results to FolderItem type for safe type checking.
 *
 * Usage:
 *   const folder = await findProjectFolderByName("Media Bin");
 *   const items = await folder.getItems();
 */

// global objects
const ppro = require("premierepro");

/**
 * Find project folder by exact name match (recursive search)
 * @param {string} folderName - Exact name of folder to find
 * @returns {Promise<Object>} FolderItem object or null if not found
 * @throws {Error} If no FolderItem found or search fails
 */
async function findProjectFolderByName(folderName) {
    try {
        console.log(`findProjectFolderByName called with folderName: ${folderName}`);
        // get active project
        const project = await ppro.Project.getActiveProject();
        const rootItem = await project.getRootItem();
        // Helper function to recursively search for the folder
        async function searchFolder(rootItem) {
            const items = await rootItem.getItems();
            // Check each item in the folder
            for (const item of items) {
                if (item.name === folderName) {
                    console.log(`Found folder: ${item.name}`);
                    const folderItem = ppro.FolderItem.cast(item);
                    if (folderItem) {
                        return folderItem; // Return as FolderItem
                    } else {
                        return null; // Found by name, but not a FolderItem
                    }
                }
                const subFolder = ppro.FolderItem.cast(item);
                if (subFolder) {
                    const found = await searchFolder(subFolder);
                    if (found) {
                        return found; // Return if found in subfolder
                    }
                }
            }
            return null; // Return null if not found
        }
        const result = await searchFolder(rootItem);
        if (!result) {
            throw new Error(`No FolderItem found with name: ${folderName}`);
        }
        return result;
    } catch (err) {
        console.error('Error in findProjectFolderByName:', err);
        return null;
    }
}
module.exports = { findProjectFolderByName };