import { PopupEditor } from "../popupEditor.js";
import { Client } from "../clients/client.js";

export class FeatureEditor extends PopupEditor {
    constructor(entity = null) {
        super(entity);
    }

    Render() {
        Client.LoadScript('https://unpkg.com/monaco-editor@0.45.0/min/vs/loader.js').then(() => {
            super.Render();
        })
    }
}
