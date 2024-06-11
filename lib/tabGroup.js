import EditableComponent from "./editableComponent.js";
import { Section } from "./section.js";
import { Html } from "./utils/html.js";

export class TabGroup extends EditableComponent {
    ListViewType;
    Ul;
    TabContent;
    ShouldCountBage;
    HasRendered;
    TabGroupElement;
    constructor(ui, ele = null) {
        super(ui);
        this.ListViewType = ["ListView", "GroupListView", "GridView", "GroupGridView"];
        /** @type {HTMLUListElement} */
        this.Ul = null;
        /** @type {HTMLDivElement} */
        this.TabContent = null;
        this.ShouldCountBage = false;
        this.HasRendered = false;
        this.TabGroup = true;
    }

    Render() {
        Html.Take(this.ParentElement).Div.ClassName("tab-group")
            .ClassName(this.Meta.IsVertialTab ? "tab-vertical" : "tab-horizontal");
        this.TabGroupElement = Html.Context;
        Html.Instance.Div.ClassName("headers-wrapper").Ul.ClassName("nav-config  nav nav-tabs nav-tabs-bottom mb-0");
        this.Ul = Html.Context;
        Element = this.Ul.parentElement;
        Html.Instance.End.End.Render();
        if (this.EditForm.ButtonFrozen != null && !this.EditForm.IsLoadButtonFrozen) {
            Section.RenderGroupContent(this.Parent, this.EditForm.ButtonFrozen, this.EditForm.writePermission, this.EditForm.width);
            this.EditForm.IsLoadButtonFrozen = true;
        }
        Html.Instance.Div.ClassName("tabs-content");
        this.TabContent = Html.Context;
    }
}