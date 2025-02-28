import { Html } from "./utils/html";
import { Utils } from "./utils/utils";
import { EditForm } from "./editForm";
import React from "react";
import { createRoot } from 'react-dom/client';
import { Feature } from "./models";

export class Page {
    /**
     * @type {Feature}
     */
    Meta
    /**
     * @type {object}
     */
    Entity
    /**
     * @type {HTMLElement}
     */
    Element
    /**
     * @type {EditForm}
     */
    EditForm
    /**
     * @type {HTMLElement}
     */
    ParentElement

    constructor(meta) {
        this.Meta = meta || {};
    }

    async Render() {
        Html.Take(this.ParentElement ?? this.Meta.ParentElement ?? document.body);
        Html.Instance.Clear();
        Html.Instance.Div.Render();
        this.Element = Html.Context;
        let root = createRoot(this.Element);
        let reactElement = React.createElement(this.Meta.Layout);
        root.render(reactElement);
        await new Promise(resolve => setTimeout(resolve, 0));
        if (this.Meta.Javascript && !Utils.isNullOrWhiteSpace(this.Meta.Javascript)) {
            try {
                let fn = new Function(this.Meta.Javascript);
                let obj = fn.call(null, this.EditForm);
                for (let prop in obj) {
                    this[prop] = obj[prop].bind(this);
                }
            } catch (e) {
                console.log(e.message);
            }
        }
    }
}