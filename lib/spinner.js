import { Html } from "./utils/html";

export class Spinner {
    /** @type {Spinner} */
    static _instance = null;
    /** @type {HTMLElement} */
    static _span = null;
    /** @type {HTMLElement} */
    static _backdrop = null;
    static _hiddenAwaiter = null;
    constructor() {

    }

    static Init() {
        if (this._instance !== null) {
            return;
        }

        this._instance = new Spinner();
        Html.Take(document.body).Div.ClassName("backdrop-spinner").Style("background: transparent !important;");
        this._backdrop = Html.GetContext();
        Html.Div.ClassName("loader");
        this._span = Html.GetContext();
        this._span.style.display = "none";
        this._backdrop.style.display = "none";
    }

    static AppendTo() {
        if (!this._span) {
            return;
        }
        this._span.style.display = "";
        this._backdrop.style.display = "";
    }

    static Hide() {
        if (this._span) {
            this._span.style.display = "none";
            this._backdrop.style.display = "none";
        }
    }
}
