// global objects
const ppro = require("premierepro");

async function getSelectedProjectItems() {
    console.log('getSelectedProjectItems called');
  
    // get active project
    const project = await ppro.Project.getActiveProject();
    
    const projectSelection = await ppro.ProjectUtils.getSelection(project);
    const projectItems = await projectSelection.getItems();

    return projectItems;

}
module.exports = { getSelectedProjectItems };