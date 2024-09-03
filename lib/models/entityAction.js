/**
 * Represents an action associated with an entity.
 */
class EntityAction {
    /**
     * Creates an instance of EntityAction.
     * @param {string} QueueName - The ID of the entity.
     * @param {Function} action - The action function to execute, which accepts an object as an argument.
     */
    constructor(QueueName, action) {
        /**
         * @type {string}
         * @description The ID of the entity.
         */
        this.QueueName = QueueName;
        /**
         * @type {Function}
         * @description The action function to execute, which accepts an object as an argument.
         */
        this.action = action;
    }

    /**
     * Executes the action with the provided argument.
     * @param {object} arg - The argument to pass to the action function.
     */
    executeAction(arg) {
        if (typeof this.action === 'function') {
            this.action(arg);
        }
    }
}

export default EntityAction;  