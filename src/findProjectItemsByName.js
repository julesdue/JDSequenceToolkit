// global objects
const ppro = require("premierepro");

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