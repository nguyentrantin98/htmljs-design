import { EditableComponent } from "./editableComponent.js";
import { Html } from "./utils/html.js";
import EventType from "./models/eventType.js";
import { Section } from "./section.js";

export class TabComponent extends EditableComponent {
    BadgeElement;
    Badge;
    /** @type {HTMLLIElement} */
    _li;
    DisplayBadge
    /**
     * 
     * @param {ElementType | string | null | undefined} eleType - Element type of the section
     * @param {HTMLElement | null} ele 
     */
    constructor(ui, ele = null) {
        super(ui);
    }
    #show = false;
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

    Render() {
        Html.Take(this.Parent.Ul).Li
            .A.ClassName("nav-link tab-default")
            .I.ClassName(this.Meta.Icon ?? "").End.Span
            .IText(this.Meta.Label ?? this.Meta.Name).Render();
        Html.Instance.End.Span.ClassName("ml-1 badge badge-warning");
        this.BadgeElement = Html.Context;
        if (this.DisplayBadge) {
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
    }

    Focus() {
        this.Parent.Children.forEach(element => {
            element.Show = false;
        });
        this.Show = true;
    }

    RenderTabContent() {
        Html.Take(this.Parent.TabContent).Div.ClassName("tab-content");
        this.Element = Html.Context;
        Section.RenderSection(this, this.Meta, null, this.EditForm);
        this.HasRendered = true;
    }
}
