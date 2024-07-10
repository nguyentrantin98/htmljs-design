import { Component } from "./models/component.js";
import { EditableComponent } from "./editableComponent.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
export class HtmlCode extends EditableComponent {
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
    }

    Render() {
        this.Element = Html.Take(this.ParentElement).Div.GetContext();
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: submitEntity,
            ComId: this.Meta.Id,
        };
        Client.Instance.SubmitAsync({
            Url: "/api/feature/report",
            IsRawString: true,
            JsonData: JSON.stringify(entity, this.getCircularReplacer(), 2),
            Method: "POST"
        }).then(data => {
            this.Element.innerHTML = Utils.GetHtmlCode(this.Meta.Template, data.updatedItem);
        })
    }

    UpdateView(force = false, dirty = null, componentNames) {
        this.Render();
    }
}