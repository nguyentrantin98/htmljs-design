import { Client } from "../../lib/clients/client.js";
import EditableComponent from "../../lib/editableComponent.js";
import { Feature } from "../../lib/models/feature.js";
import { Html } from "../../lib/utils/html.js";
import EventType from "../../lib/models/eventType.js";
import { ComponentExt } from "../../lib/utils/componentExt.js";
import { TabEditor } from "../../lib/tabEditor.js";

export class MenuComponent extends EditableComponent {
    /**
     * Creates an instance of the MenuComponent.
     * @param {Component} meta - The UI component.
     * @param {HTMLElement} ele - The HTML element.
     */
    constructor(meta, ele) {
        super(meta, ele);
    }

    Render() {
        new Promise(() => {
            Client.Instance.SubmitAsync({
                Url: `/api/feature/getMenu`,
                IsRawString: true,
                Method: "GET",
                AllowAnonymous: true
            }).then(features => {
                this.RenderMenu(features);
            });
        });
    }

    /**
     * Renders the menu using the provided features.
     * @param {Feature[]} features - The array of Feature objects.
     */
    RenderMenu(features) {
        Html.Take("#menu");
        features.forEach(item => {
            Html.Instance.Div.ClassName("parent-item-menu")
                .A.ClassName("menu-item router-link-active menu-padding").Event(EventType.Click, (e) => this.OpenFeature(e, item.Name))
                .Div.ClassName("menu-item__icon")
                .I.ClassName("fal fa-save").End.End
                .Div.ClassName("menu-item__title").IText(item.Label).EndOf(".parent-item-menu");
        });
    }

    /**
     * @param {Event} e 
     * @param {string} featureName
     */
    OpenFeature(e, featureName) {
        e.preventDefault();
        var tab = TabEditor.Tabs.find(x => x.Meta.Name == featureName);
        if (tab) {
            tab.Focus();
            return;
        }
        ComponentExt.InitFeatureByName(featureName, true).Done();
    }
}