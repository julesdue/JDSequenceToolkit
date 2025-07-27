async function getClipProjectItems() {

    // get active project
    const project = await ppro.Project.getActiveProject();

    const rootItem = await project.getRootItem();
    const projectItems = await rootItem.getItems();

    let result = [];
    let stack = [...projectItems];

    while (stack.length > 0) {
        const projectItem = stack.pop();
        const clipProjectItem = ppro.ClipProjectItem.cast(projectItem);
        if (
            clipProjectItem &&
            (await clipProjectItem.getContentType()) === ppro.Constants.ContentType.MEDIA
        ) {
            result.push(clipProjectItem);
        } else {
            const folderProjectItem = ppro.FolderItem.cast(projectItem);
            if (folderProjectItem) {
                let items = await folderProjectItem.getItems();
                stack.push(...items);
            }
        }
    }

    if (result.length === 0) {
        log("No media project items found.", "red");
        return [];
    }
    return result;
}
module.exports = { getClipProjectItems };