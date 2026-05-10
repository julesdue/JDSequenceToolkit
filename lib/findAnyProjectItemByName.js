// @ts-nocheck
/**
 * findAnyProjectItemByName.js
 *
 * Recursively searches the project for any non-folder item by exact name match.
 * Unlike findProjectItemsByName, does NOT filter by ContentType — use this for
 * MOGRTs or other items that are not ClipProjectItem / ContentType.MEDIA.
 *
 * Usage:
 *   const item = await findAnyProjectItemByName("my_mogrt");
 */

const ppro = require("premierepro");

/**
 * @param {string} name - Exact name of item to find
 * @returns {Promise<Object>} Raw project item (not cast to any subtype)
 */
async function findAnyProjectItemByName(name) {
    const project = await ppro.Project.getActiveProject();
    const rootItem = await project.getRootItem();

    async function search(item, result = []) {
        const folder = ppro.FolderItem.cast(item);
        if (folder) {
            const children = await folder.getItems();
            for (const child of children) {
                await search(child, result);
            }
        } else if (item.name === name) {
            result.push(item);
        }
        return result;
    }

    const topLevel = await rootItem.getItems();
    const found = [];
    for (const item of topLevel) {
        await search(item, found);
    }

    if (found.length === 1) return found[0];
    if (found.length > 1) throw new Error(`Multiple items found with name: ${name}`);
    throw new Error(`No item found with name: ${name}`);
}

module.exports = { findAnyProjectItemByName };
