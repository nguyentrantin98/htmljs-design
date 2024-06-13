import { Client } from "../../lib/clients/client.js";
import { EditableComponent } from "../../lib/editableComponent.js";
import { Feature } from "../../lib/models/feature.js";
import { Html } from "../../lib/utils/html.js";
import EventType from "../../lib/models/eventType.js";
import { ComponentExt } from "../../lib/utils/componentExt.js";
import { TabEditor } from "../../lib/tabEditor.js";
import { ElementType } from "../../lib/models/elementType.js";

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
        Html.Instance.Clear();
        /**
         * @param {Feature[]} features
         */
        Html.Instance.Ul.ClassName("nav nav-pills nav-sidebar flex-column nav-child-indent").ForEach(features,
            /**
            * @param {Feature} item
            */
            (item, index) => {
                if (item.IsGroup) {
                    Html.Instance.Li.ClassName("nav-header").Title(item.Label).End.Render();
                }
                else {
                    var featureParam = window.location.pathname.replace("/", "").replace("-", " ");
                    var check = item.InverseParent && item.InverseParent.length > 0;
                    Html.Instance.Li.ClassName("nav-item");
                    if (check) {
                        if (item.InverseParent.Any(x => x.Name == featureParam)) {
                            Html.Instance.ClassName("menu-open");
                        }
                    }
                    Html.Instance.A.DataAttr("page", item.Name).ClassName("nav-link");
                    if (!check) {
                        if (featureParam == item.Name) {
                            Html.Instance.ClassName("active");
                        }
                    }
                    Html.Instance.Event(EventType.Click, (e) => this.MenuItemClick(e, item.Name).bind(this))
                        .Icon(item.Icon).ClassName("nav-icon").End.Div.IText(item.Label).End.Render();
                    if (check) {
                        Html.Instance.I.ClassName("right fas fa-angle-left").End.Render();
                    }
                    Html.Instance.EndOf(ElementType.a).Render();
                    if (check) {
                        RenderMenuItems(item.InverseParent.ToList(), true);
                    }
                    Html.Instance.EndOf(ElementType.li).Render();
                }
            });
    }

    /**
    * @param {Feature} menuItems
    */
    RenderMenuItems(menuItems, nested = false) {
        Html.Instance.Ul.ClassName("nav nav-treeview").ForEach(menuItems,
            /**
            * @param {Feature} item
            */
            (item, index) => {
                var featureParam = Window.Location.PathName.Replace("/", "").Replace("-", " ");
                var check = item.InverseParent != null && item.InverseParent.Count > 0;
                Html.Instance.Li.ClassName("nav-item");
                if (check) {
                    if (item.InverseParent.some(x => x.Name == featureParam)) {
                        Html.Instance.ClassName("menu-open");
                    }
                }
                Html.Instance.A.DataAttr("page", item.Name).ClassName("nav-link");
                if (!check) {
                    if (featureParam == item.Name) {
                        Html.Instance.ClassName("active");
                    }
                }
                Html.Instance.Event(EventType.Click, (e) => this.MenuItemClick(e, item.Name).bind(this))
                    .Icon(item.Icon).ClassName("nav-icon").End.Div.IText(item.Label).End.Render();
                if (check) {
                    Html.Instance.I.ClassName("right fas fa-angle-left").End.Render();
                }
                Html.Instance.EndOf(ElementType.a).Render();
                if (check) {
                    this.RenderMenuItems(item.InverseParent, true);
                }
                Html.Instance.EndOf(ElementType.li).Render();
            });
    }

    /**
     * @param {Event} e 
     * @param {string} featureName
     */
    MenuItemClick(e, featureName) {
        e.preventDefault();
        var tab = TabEditor.Tabs.find(x => x.Meta.Name == featureName);
        if (tab) {
            tab.Focus();
            return;
        }
        ComponentExt.InitFeatureByName(featureName, true).Done();
    }
}