// @ts-nocheck
/**
 * executeCompoundAction.js
 *
 * Executes actions as a single undo step via lockedAccess → executeTransaction.
 * The builder callback runs inside the lock, which is required for APIs like
 * SequenceEditor.createInsertProjectItemAction().
 *
 * Usage:
 *   await executeCompoundAction(project, () => editor.createInsertProjectItemAction(...), 'Label');
 *   await executeCompoundAction(project, () => [action1, action2], 'Label');
 */

/**
 * @param {Object} project - Active Premiere project
 * @param {() => Object|Object[]} buildActions - Sync callback that returns action(s) — runs inside lockedAccess
 * @param {string} [undoString] - Label shown in Premiere's undo history
 */
async function executeCompoundAction(project, buildActions, undoString = 'Action') {
    await project.lockedAccess(() => {
        project.executeTransaction((compoundAction) => {
            const result = buildActions();
            const list = Array.isArray(result) ? result : [result];
            for (const action of list) {
                compoundAction.addAction(action);
            }
        }, undoString);
    });
}

module.exports = { executeCompoundAction };
