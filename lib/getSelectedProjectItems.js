/**
 * getSelectedProjectItems.js
 *
 * Retrieves the currently selected items in the project panel.
 * Wraps ProjectUtils.getSelection() for cleaner workflow integration.
 *
 * Usage:
 *   const items = await getSelectedProjectItems();
 *   console.log(`Selected ${items.length} items`);
 */

// global objects
const ppro = require("premierepro");

/**
 * Get currently selected project items
 * @returns {Promise<Array<Object>>} Array of selected project items
 */
async function getSelectedProjectItems() {
    console.log('getSelectedProjectItems called');

    // get active project
    const project = await ppro.Project.getActiveProject();

    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const projectItems = await projectSelection.getItems();

    return projectItems;

}
module.exports = { getSelectedProjectItems };