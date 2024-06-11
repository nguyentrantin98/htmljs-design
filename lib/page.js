import { Html } from "./utils/html";
import { Utils } from "./utils/utils";
import { ComponentFactory } from "./utils/componentFactory";
import { EditableComponent } from "./editableComponent";
import { EditForm } from "./editForm";
import React from "react";
import ReactDOM from "react-dom";
import { Component } from "./models/component";

export class Page {
    /**
     * @type {Component}
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

    Render() {
        Html.Take(this.Meta.ParentElement ?? document.body);
        this.Element = Html.Context;
        const reactElement = React.createElement(this.Meta.Layout, { page: this });
        ReactDOM.render(reactElement, this.Element);
        if (this.Meta.Javascript && !Utils.isNullOrWhiteSpace(this.Meta.Javascript)) {
            try {
                const fn = new Function(this.Meta.Javascript);
                const obj = fn.call(null, this.EditForm);
                for (const prop in obj) {
                    this[prop] = obj[prop].bind(this);
                }
            } catch (e) {
                console.log(e.message);
            }
        }
        this.SplitChild(this.Element.children, this.Meta.Name ?? "")
    }
    /**
     * 
     * @param {HTMLElement[]} hTMLElements 
     * @param {string} section 
     * @returns 
     */
    SplitChild(hTMLElements, section = "") {
        for (const eleChild of hTMLElements) {
            if (!Utils.isNullOrWhiteSpace(section)) {
                eleChild.setAttribute(section, "");
            }
            if (eleChild.dataset.name !== undefined) {
                const ui = this.Meta.Components.find(x => x.FieldName === eleChild.dataset.name);
                eleChild.removeAttribute("data-name");
                if (!ui || ui.Hidden) {
                    continue;
                }

                const component = ComponentFactory.GetComponent(ui, this.EditForm, eleChild);
                if (component == null) return;
                // @ts-ignore
                if (component.IsListView) {
                    // @ts-ignore
                    this.EditForm.ListViews.push(component);
                }
                component.ParentElement = eleChild;
                component.Render()
                if (component instanceof EditableComponent) {
                    component.Disabled = ui.Disabled || this.Disabled || component.Disabled;
                }
                if (component.Element) {
                    if (ui.ChildStyle) {
                        const current = Html.Context;
                        Html.Take(component.Element).Style(ui.ChildStyle);
                        Html.Take(current);
                    }
                    if (ui.ClassName) {
                        component.Element.classList.add(ui.ClassName);
                    }

                    if (ui.Row === 1) {
                        component.ParentElement?.parentElement?.classList?.add("inline-label");
                    }
                }
                if (ui.Focus) {
                    component.Focus();
                }
            }
            if (eleChild.dataset.click !== undefined) {
                const eventName = eleChild.dataset.click;
                eleChild.removeAttribute("data-click");
                eleChild.addEventListener(EventType.Click, async () => {
                    let method = null;
                    method = this[eventName];
                    let task = null;
                    try {
                        await method.apply(this.EditForm, [this]);
                    } catch (ex) {
                        console.log(ex.message);
                        console.log(ex.stack);
                        throw ex;
                    }
                });
            }

            if (eleChild.children.length > 0) {
                this.SplitChild(eleChild.children, section);
            }
        }
    }
}