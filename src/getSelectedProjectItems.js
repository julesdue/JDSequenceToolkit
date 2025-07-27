async function getSelectedProjectItems() {
  
    // get active project
    const project = await ppro.Project.getActiveProject();
    
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const projectItems = await projectSelection.getItems();

    return projectItems;

}
module.exports = { getSelectedProjectItems };