/**
 * @typedef {import('./observable.js').default}  ObservableArgs
 */
export class Action {
    hasTrigger = false;
    /** @type {Array<(item: ObservableArgs) => void>} handler - An array of event handler functions. */
    handler = [];
    constructor() {
    }
    /**
     * @param {{ (): void; (item: import("./observable.js").default): void; }} handler
     */
    add(handler) {
        this.handler.push(handler);
    }
    /**
     * 
     * @param {ObservableArgs | any} observable 
     */
    Invoke(observable) {
        this.hasTrigger = true;
        this.handler?.forEach(h => h(observable));
    }

    /**
     * @param {any | import("./observable.js").default} [observable]
     */
    invoke(observable) {
        this.hasTrigger = true;
        this.handler?.forEach(h => h(observable));
    }
}