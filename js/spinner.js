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
        let existing = document.getElementById("spinner");
        if (!existing) {
            let div = document.createElement("div");
            div.className = "backdrop";
            div.style.background = "transparent !important";
            document.body.appendChild(div);

            let span = document.createElement("span");
            span.className = "spinner";
            div.appendChild(span);

            this._span = span;
            this._backdrop = div;
        } else {
            this._span = existing;
            // @ts-ignore
            this._backdrop = existing.previousElementSibling;
        }
        this._span.style.display = "none";
        this._backdrop.style.display = "none";
    }

    static AppendTo(node, lockScreen = true, autoHide = true, timeout = 7000) {
        if (!this._span) {
            return;
        }
        if (this._span.parentElement === node && this._span.style.display === "") {
            return;
        }
        if (node) {
            node.appendChild(this._span);
        } else {
            document.body.appendChild(this._span);
        }

        this._span.style.display = "";
        if (lockScreen) {
            this._backdrop.style.display = "";
        }
        if (!autoHide) {
            return;
        }
        window.clearTimeout(this._hiddenAwaiter);
        this._hiddenAwaiter = window.setTimeout(() => this.Hide(), timeout);
    }

    static Hide() {
        if (this._span) {
            this._span.style.display = "none";
            this._backdrop.style.display = "none";
        }
    }
}
