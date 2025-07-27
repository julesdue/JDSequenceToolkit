async function findProjectFolderByName(folderName) {
    
    // get active project
    const project = await ppro.Project.getActiveProject();    
    const rootItem = await project.getRootItem();

    // Helper function to recursively search for the folder
    async function searchFolder(item) {
        if (item.name === folderName && typeof item.getItems === 'function') {
            return item;
        }
        if (typeof item.getItems === 'function') {
            const children = await item.getItems();
            for (const child of children) {
                const found = await searchFolder(child);
                if (found) return found;
            }
        }
        return undefined;
    }

    return await searchFolder(rootItem);
}
module.exports = { findProjectFolderByName };