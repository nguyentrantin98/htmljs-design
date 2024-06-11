import { TabEditor } from "./tabEditor.js";

export class PopupEditor extends TabEditor {
    constructor(entity) {
        super(entity);
        this.Popup = true;
        this.ParentElement = this.TabEditor ? this.TabEditor.Element : null;
        this.ShouldLoadEntity = false;
    }
}