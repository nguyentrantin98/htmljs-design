import { Spinner } from "./spinner.js";
import { EditableComponent } from "./editableComponent.js";
import { Component } from "./models/component.js";
import { Html } from "./utils/html.js";

/**
 * Represents a button component that can be rendered and managed on a web page.
 */
export class Button extends EditableComponent {
    IsButton = true;
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
     */
    constructor(ui, ele = null) {
        super(ui);
        /** @type {Component} */
        this.Meta = ui;
        this.ButtonEle = ele;
        this._textEle = null;
    }

    /**
     * Renders the button component into the DOM.
     */
    Render() {
        if (!this.ButtonEle) {
            if (!this.ParentElement) throw new Error("ParentElement is required");
            Html.Take(this.ParentElement).Button.Render();
            this.Element = this.ButtonEle = Html.Context;
        } else {
            this.Element = this.ButtonEle;
        }

        Html.Take(this.Element)
            .ClassName(this.Meta.ClassName)
            .Event("click", () => this.DispatchClick())
            .Style(this.Meta.Style);

        if (this.Meta.Icon) {
            Html.Icon(this.Meta.Icon).End.Text(" ").Render();
        }

        Html.Span.ClassName("caption").IText(this.Meta.Label || "", this.EditForm.Meta.Label);
        this._textEle = Html.Context;

        this.Element.closest("td")?.addEventListener("keydown", e => this.ListViewItemTab(e));
        this.DOMContentLoaded?.invoke();
    }

    /**
     * Dispatches the click event, handles UI changes for click action.
     */
    DispatchClick() {
        if (this.Meta.OnClick) {
            this.Meta.OnClick.call();
            return;
        }

        if (this.Disabled || this.Element.hidden) {
            return;
        }
        this.Disabled = true;
        try {
            Spinner.AppendTo();
            this.DispatchEvent(this.Meta.Events, "click", this, this.Entity).then(() => {
                this.Disabled = false;
                Spinner.Hide();
            });
        } finally {
            window.setTimeout(() => {
                this.Disabled = false;
            }, 2000);
        }
    }

    /**
     * Gets the value text from the button component.
     * @returns {string} The text value of the component.
     */
    GetValueText() {
        if (!this.Entity || !this.Name) {
            return this._textEle.textContent;
        }
        return this.FieldVal?.toString();
    }
}
