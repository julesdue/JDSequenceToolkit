/**
 * findProjectItemsByName.js
 *
 * Recursively searches the project for media items (clips) by exact name match.
 * Filters for MEDIA type content only. Returns single result or throws on multiple/none found.
 *
 * Usage:
 *   const item = await findProjectItemsByName("black-frame.mov");
 *   console.log(item.name);
 */

// global objects
const ppro = require("premierepro");

/**
 * Find project media item by exact name match (recursive search)
 * @param {string} blackFrameName - Exact name of media item to find
 * @returns {Promise<Object>} Single ClipProjectItem object
 * @throws {Error} If multiple items found, no items found, or search fails
 */
async function findProjectItemsByName(blackFrameName) {
    console.log('findProjectItemsByName called');

    // get active project
    const project = await ppro.Project.getActiveProject();
    const rootItem = await project.getRootItem();

    async function findItemsByName(item, name, result = []) {
        // Check if item is a folder
        const folder = ppro.FolderItem.cast(item);
        if (folder) {
            const items = await folder.getItems();
            for (const child of items) {
                await findItemsByName(child, name, result);
            }
        } else {
            // Check if item is a project item and matches the name
            const projectItem = ppro.ClipProjectItem.cast(item);
            if (
                projectItem &&
                projectItem.name === name &&
                (await projectItem.getContentType()) === ppro.Constants.ContentType.MEDIA
            ) {
                result.push(projectItem);
            }
        }
        return result;
    }

    const items = await rootItem.getItems();
    let foundItems = [];
    for (const item of items) {
        await findItemsByName(item, blackFrameName, foundItems);
    }
    if (foundItems.length === 1) {
        return foundItems[0];
    } else if (foundItems.length > 1) {
        throw new Error(`Multiple ProjectItems found with name: ${blackFrameName}`);
    } else {
        throw new Error(`No ProjectItem found with name: ${blackFrameName}`);
    }
}
module.exports = { findProjectItemsByName };