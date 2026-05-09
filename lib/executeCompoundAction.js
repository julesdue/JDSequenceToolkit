// execute action
function executeCompoundAction(project, action) {
    
    try {
        project.lockedAccess(() => {
            project.executeTransaction((compoundAction) => {
                compoundAction.addAction(action);
            });
        });
    } catch (err) {
        console.log(`Error: ${err}`);
    }
}

module.exports = { executeCompoundAction };