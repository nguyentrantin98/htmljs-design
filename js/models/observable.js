/**  @typedef {import("../editableComponent.js").default} EditableComponent */

/** @class ObservableArgs */
export default class ObservableArgs {
    /** @type {string} -Event type */
    EvType;
    /** @type {EditableComponent} -Event type */
    Com;
    /** @type {any} */
    NewData;
    /** @type {any} */
    OldData;
    /** @type {any} */
    NewMatch;
    /** @type {any} */
    OldMatch;
    /** @type {any} */
    NewEntity;
    /** @type {any} */
    OldEntity;
    /** @type {string} */
    FieldName;
}