/**
 * executeCompoundAction.js
 *
 * Executes an action within a locked transaction, grouping it as a single undo step.
 * Wraps project.lockedAccess() and executeTransaction() for batch operations.
 *
 * Usage:
 *   const action = param.createSetValueAction(keyframe, false);
 *   executeCompoundAction(project, action);
 */

/**
 * Execute action within compound transaction (single undo step)
 * @param {Object} project - Premiere project object
 * @param {Object} action - Action object to execute (e.g., from param.createSetValueAction)
 */
// execute action OUTSIDE lockedAccess
async function executeCompoundAction(project, action) {
    try {
        await project.executeAction(action);
    } catch (err) {
        console.error(`Error executing compound action: ${err}`);
        throw err;
    }
}

module.exports = { executeCompoundAction };