import EditableComponent from "./editableComponent.js";
import { QRCode as QR } from "./structs/qrcode.js";
import { Html } from "./utils/html.js";

/**
 * Represents a barcode component that can be rendered and updated.
 */
export class QRCode extends EditableComponent {
    /**
     * Creates an instance of BarCode.
     * @param {Object} meta - The UI component associated with the barcode.
     * @param {HTMLElement} ele - The parent HTML element for the barcode.
     */
    constructor(meta, ele) {
        super(meta);
        if (!meta) {
            throw new Error("UI is required");
        }
        this.ParentElement = ele;
        this.Meta = meta;
        this.DefaultValue = '';
        this.Value = '';
    }

    /**
     * Renders the barcode into the parent element.
     */
    Render() {
        const ctx = Html.Take(this.ParentElement)
            .Clear()
            .Div.Style(`width:${this.Meta.Width}px;margin:auto`)
            .Id("barcode" + this.Meta.Id);
        // @ts-ignore
        this.Element = ctx;
        this.Value = this.FieldVal;
        new QR("barcode" + this.Meta.Id, {
            text: this.Value,
            width: this.Meta.Width,
            height: this.Meta.Width,
            colorDark: "#000000",
            colorLight: "#ffffff",
        });
    }

    /**
     * Updates the view of the barcode, re-rendering if the value has changed.
     * @param {boolean} [Force=false] - Forces the update regardless of changes.
     * @param {boolean|null} [Dirty=null] - Marks the component as dirty, not used in this method.
     * @param {...string} ComponentNames - Additional components to consider in the update.
     */
    UpdateView(Force = false, Dirty = null, ...ComponentNames) {
        if (this.FieldVal === this.Value) {
            return;
        }
        this.Render();
    }
}
