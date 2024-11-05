import { EditableComponent } from "./editableComponent.js";
import { Html } from "./utils/html.js";
import { Section } from "./section.js";
import { Client } from "./clients/client.js";
import { Utils } from "./utils/utils.js";

export class TabComponent extends EditableComponent {
    /** @type {HTMLSpanElement} */
    BadgeElement;
    /** @type {HTMLLIElement} */
    _li;
    /**
     * 
     * @param {ElementType | string | null | undefined} eleType - Element type of the section
     * @param {HTMLElement | null} ele 
     */
    constructor(ui, ele = null) {
        super(ui);
    }

    get Show() {
        return this._show;
    }

    set Show(value) {
        if (!this._li) {
            return;
        }
        super.Show = value;
        if (value) {
            this._li.classList.add("active");
            this._li.querySelector("a").classList.add("active");
            this.DispatchEvent(this.Meta.Events, "FocusIn", this, this.Entity).then();
        } else {
            this._li.classList.remove("active");
            this._li.querySelector("a").classList.remove("active");
            this.DispatchEvent(this.Meta.Events, "FocusOut", this, this.Entity).then();
        }
    }

    set Badge(value) {
        if (!value || value == 0) {
            this.BadgeElement.textContent = "";
            return;
        }
        this.BadgeElement.textContent = value;
    }

    Render() {
        Html.Take(this.Parent.Ul).Li
            .A.ClassName("nav-link tab-default")
            .I.ClassName(this.Meta.Icon ?? "").End.Span
            .IText(this.Meta.Label ?? this.Meta.Name).Render();
        Html.Instance.End.Span.ClassName("ml-1 badge badge-warning");
        this.BadgeElement = Html.Context;
        this.IsTabComponent = true;
        this.EditForm.TabComponents.push(this);
        if (this.Meta.DisplayBadge) {
            Html.Instance.Text(this.Badge ?? "");
        }
        else {
            this.BadgeElement.style.display = "none";
        }
        this._li = Html.Context.parentElement.parentElement;
        Html.Instance.End.Div.ClassName("desc").IText(this.Meta.Description ?? "").End.Render();
        this._li.addEventListener("click", () => {
            if (this.HasRendered) {
                this.Focus();
            }
            else {
                this.Focus();
                this.RenderTabContent();
            }
        });
        if (this.Meta.Editable) {
            this.RenderTabContent();
        }
        this.CountBadge().then();
    }

    Focus() {
        this.Parent.Children.forEach(element => {
            element.Show = false;
        });
        this.Show = true;
    }

    RenderTabContent() {
        Html.Take(this.Parent.TabContent).Div.ClassName("tab-content").Display(!this.Meta.Editable);
        this.Element = Html.Context;
        Section.RenderSection(this, this.Meta, null, this.EditForm);
        this.HasRendered = true;
    }

    async CountBadge() {
        if (!this.Meta.DisplayBadge || !this.Meta.Components) {
            return;
        }
        var gridView = this.Meta.Components.filter(x => x.ComponentType == "GridView")[0];
        if (!gridView) {
            return;
        }
        let submitEntity = Utils.IsFunction(gridView.PreQuery, true, this);
        const vm = {
            ComId: gridView.Id,
            Params: JSON.stringify(submitEntity),
            OrderBy: (!gridView.OrderBy ? "ds.InsertedDate desc" : gridView.OrderBy),
            Count: true,
            Skip: 0,
            Top: 1,
        };
        const data = await Client.Instance.SubmitAsync({
            NoQueue: true,
            Url: `/api/feature/com`,
            Method: "POST",
            JsonData: JSON.stringify(vm, this.getCircularReplacer(), 2),
        });
        this.Badge = data.count?.toString();
    }
}
