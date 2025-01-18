import { Client, EditableComponent, Feature, Html, ComponentExt, TabEditor, ChromeTabs } from "../../lib";
import EventType from "../../lib/models/eventType.js";
import { ElementType } from "../../lib/models/elementType.js";
export class MenuComponent extends EditableComponent {
    CurrentHref;
    /**
     * Creates an instance of the MenuComponent.
     * @param {Component} meta - The UI component.
     * @param {HTMLElement} ele - The HTML element.
     */
    constructor(meta, ele) {
        super(meta, ele);
        this.CurrentHref = window.location.hash;
        if (this.CurrentHref.startsWith("#/")) {
            this.CurrentHref = (this.GetFeatureNameFromUrl()).pathname;
        }
    }
    /**
   * @returns {string | null}
        */
    GetFeatureNameFromUrl() {
        let hash = window.location.hash; // Get the full hash (e.g., '#/chat-editor?Id=-00612540-0000-0000-8000-4782e9f44882')

        if (hash.startsWith("#/")) {
            hash = hash.replace("#/", ""); // Remove the leading '#/'
        }

        if (!hash.trim() || hash == undefined) {
            return null; // Return null if the hash is empty or undefined
        }

        let [pathname, queryString] = hash.split("?"); // Split the hash into pathname and query string
        let params = new URLSearchParams(queryString); // Parse the query string into a URLSearchParams object
        if (pathname.includes("/")) {
            let segments = pathname.split("/");
            pathname = segments[segments.length - 1] || segments[segments.length - 2];
        }
        return {
            pathname: pathname || null,  // Pathname (e.g., 'chat-editor')
            params: Object.fromEntries(params.entries()) // Query parameters (e.g., { Id: '-00612540-0000-0000-8000-4782e9f44882' })
        };
    }
    /**
     * @type {Feature[]}
     */
    Features;
    Render() {
        new Promise(() => {
            Client.Instance.SubmitAsync({
                Url: `/api/feature/getMenu`,
                IsRawString: true,
                Method: "GET"
            }).then(features => {
                this.BuildFeatureTree(features);
                this.RenderMenu(this.Features);
            });
        });
    }

    BuildFeatureTree(features) {
        const dic = features.filter(f => f.IsMenu).reduce((acc, f) => {
            acc[f.Id] = f;
            return acc;
        }, {});

        Object.values(dic).forEach(menu => {
            if (menu.ParentId !== null && dic.hasOwnProperty(menu.ParentId)) {
                const parent = dic[menu.ParentId];
                if (parent.InverseParent === undefined || parent.InverseParent === null) {
                    parent.InverseParent = [];
                }
                parent.InverseParent.push(menu);
            }
        });

        Object.values(dic).forEach(menu => {
            if (menu.InverseParent) {
                menu.InverseParent.sort((a, b) => a.Order - b.Order);
            }
        });

        this.Features = features.filter(f => f.ParentId === null && f.IsMenu).sort((a, b) => a.Order - b.Order);
    }
    /**
     * Renders the menu using the provided features.
     * @param {Feature[]} features - The array of Feature objects.
     */
    RenderMenu(features) {
        Html.Take(".sidebar-content");
        Html.Instance.Clear();
        /**
         * @param {Feature[]} features
         */
        Html.Instance.Ul.ForEach(features,
            /**
            * @param {Feature} item
            */
            (item) => {
                if (item.IsGroup) {
                    Html.Instance.Li.ClassName("menu-category");
                    Html.Instance.Event(EventType.ContextMenu, (e) => this.MenuItemContextMenu(e, item));
                    Html.Instance.Span.IText(item.Label).End.End.Render();
                }
                else {
                    var check = item.InverseParent && item.InverseParent.length > 0;
                    Html.Instance.Li.Render();
                    Html.Instance.Event(EventType.ContextMenu, (e) => this.MenuItemContextMenu(e, item));
                    if (check) {
                        if (item.InverseParent.some(x => x.Name == this.CurrentHref)) {
                            Html.Instance.ClassName("open");
                            Html.Instance.ClassName("active");
                        }
                    }
                    Html.Instance.A.DataAttr("page", item.Name).ClassName(check ? "main-menu has-dropdown" : "link");
                    if (!check) {
                        if (this.CurrentHref == item.Name) {
                            Html.Instance.ClassName("active");
                        }
                    }
                    Html.Instance.Event(EventType.Click, (e) => this.MenuItemClick(e, item)).I.ClassName(item.Icon).End.Span.IText(item.Label).End.Render();
                    Html.Instance.EndOf(ElementType.a);
                    if (check) {
                        this.RenderMenuItems(item.InverseParent);
                    }
                    Html.Instance.End.Render();
                }
            });
    }
    /**
    * @param {Feature} menuItems
    */
    RenderMenuItems(menuItems) {
        Html.Instance.Ul.ClassName("sub-menu").Style(`max-height: ${menuItems.length * 44}px;`).ForEach(menuItems,
            /**
            * @param {Feature} item
            */
            (item) => {
                var check = item.InverseParent != null && item.InverseParent.Count > 0;
                Html.Instance.Li.Render();
                Html.Instance.Event(EventType.ContextMenu, (e) => this.MenuItemContextMenu(e, item));
                if (!check) {
                    if (this.CurrentHref == item.Name) {
                        Html.Instance.ClassName("active");
                    }
                }
                if (check) {
                    if (item.InverseParent.some(x => x.Name == this.CurrentHref)) {
                        Html.Instance.ClassName("open");
                        Html.Instance.ClassName("active");
                    }
                }
                Html.Instance.A.DataAttr("page", item.Name).ClassName(check ? "main-menu has-dropdown" : "link");
                Html.Instance.Event(EventType.Click, (e) => this.MenuItemClick(e, item)).I.ClassName(item.Icon).End.Span.IText(item.Label).End.Render();
                Html.Instance.EndOf(ElementType.a);
                if (check) {
                    this.RenderMenuItems(item.InverseParent);
                }
                Html.Instance.End.Render();
            });
        Html.Instance.EndOf(ElementType.ul);
    }
    /**
     * @param {Event} e 
     * @param {Feature} feature
     */
    MenuItemClick(e, feature) {
        /**
         * @type {HTMLElement}
         */
        e.preventDefault();
        e.stopPropagation();
        var a = e.target;
        if (!(a instanceof HTMLAnchorElement)) {
            a = a.closest("a");
        }
        /**
         * @type {HTMLElement}
         */
        var li = a.closest(ElementType.li);
        this.HideAll(a.closest("ul"), li);
        li.classList.add("active");
        if (feature.InverseParent) {
            li.classList.toggle("open");
            var nestedUl = li.querySelector('ul');
            nestedUl.style.maxHeight = 44 * feature.InverseParent.length + "px";
            return;
        }
        var tab = ChromeTabs.tabs.find(x => x.content && x.content.Meta.Name == feature.Name);
        if (tab) {
            tab.content.Focus();
            return;
        }
        ComponentExt.InitFeatureByName(feature.Name, true).then();
    }
    /**
     * @param {Event} e 
     * @param {Feature} feature
     */
    MenuItemContextMenu(e, feature) {
        e.preventDefault();
        e.stopPropagation();
    }
    /**
     * @param {HTMLElement} current
     */
    HideAll(current, ele) {
        if (!current) {
            current = document.body;
        }
        var activea = current.querySelectorAll("li.active");
        activea.forEach(x => {
            if (x != ele) {
                x.classList.remove("active");
                x.classList.remove("open");
            }
        });
    }
}