import { EditableComponent } from "./editableComponent.js";
import { Label } from "./label.js";
import { ListView } from "./listView.js";
import { Numbox } from "./numbox.js";
import { Html } from "./utils/html.js";
/**
 * @typedef {import('./listView.js').ListView} ListView
 */

/**
 * Class representing pagination options.
 */
export class PaginationOptions {
    /**
     * Create pagination options.
     * @param {number} Total - Total number of items.
     * @param {number} PageSize - Number of items per page.
     * @param {number} Selected - Currently selected page index.
     * @param {number} PageIndex - Index of the current page.
     * @param {number} PageNumber - Number representation of the current page.
     * @param {number} CurrentPageCount - Current count of pages.
     * @param {number} StartIndex - Start index of the pagination.
     * @param {number} EndIndex - End index of the pagination.
     * @param {Function} ClickHandler - Function to handle click events on page navigation.
     */
    constructor(Total, PageSize, Selected, PageIndex, PageNumber, CurrentPageCount, StartIndex, EndIndex, ClickHandler) {
        this.Total = Total;
        this.PageSize = PageSize;
        this.Selected = Selected;
        this.PageIndex = PageIndex;
        this.PageNumber = PageNumber;
        this.CurrentPageCount = CurrentPageCount;
        this.StartIndex = StartIndex;
        this.EndIndex = EndIndex;
        this.ClickHandler = ClickHandler;
        this.Disabled = false;
    }
}

/**
 * Class representing a paginator.
 */
export class Paginator extends EditableComponent {
    /** @type {ListView} */
    // @ts-ignore
    Parent;
    /**
     * Create a paginator.
     * @param {PaginationOptions} paginationOptions - Options for pagination.
     */
    constructor(paginationOptions) {
        super(null, null);
        if (!paginationOptions) throw new Error("paginationOptions is required");
        this.Entity = paginationOptions;
        this.Options = paginationOptions;
        this.Options.StartIndex = this.Options.StartIndex || 1;
        this.Element = null;
        this.PopulateDirty = false;
        this.AlwaysValid = true;
    }

    /**
     * Render the paginator into the DOM.
     */
    Render() {
        Html.Take(this.Parent.Element).Div.ClassName("grid-toolbar paging").Label.IText("Pagination").End.Render();
        this.Element = Html.Context;
        var startIndex = new Label({ FieldName: "StartIndex" });
        var endIndex = new Label({ FieldName: "EndIndex" });
        var total = new Label({ FieldName: "Total" });
        var pageNum = new Numbox({ FieldName: "PageNumber" });
        pageNum.AlwaysValid = true;
        pageNum.SetSeclection = false;
        if (!this.Parent.VirtualScroll) {
            var pageSize = new Numbox({ FieldName: "PageSize" })
            pageSize.SetSeclection = false;
            this.AddChild(pageSize);
            pageSize.Element.addEventListener("change", this.ReloadListView);
            Html.Instance.End.Render();
        }
        Html.Instance.Div.Style("display: flex;").Render();
        this.AddChild(startIndex);
        Html.Instance.Text("-");
        this.AddChild(endIndex);
        Html.Instance.IText(" of ");
        this.AddChild(total);
        if (!this.Parent.VirtualScroll) {
            Html.Take(this.Element).Ul.ClassName("pagination").Li.Text("❮").Event("click", this.PrevPage.bind(this)).End.Render();
            this.AddChild(pageNum);
            pageNum.Element.addEventListener("change", () => {
                this.Options.PageIndex = this.Options.PageNumber - 1;
                this.ReloadListView();
            });
            Html.Instance.End.Li.Text("❯").Event("click", this.NextPage.bind(this)).End.Render();
        }
    }

    /**
     * Create a number input linked to a specified property.
     * @param {string} propertyName - Name of the property that this input represents.
     * @returns {HTMLInputElement} - The created input element.
     */
    CreateNumberInput(propertyName) {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.Options[propertyName];
        input.addEventListener('change', () => {
            this.Options[propertyName] = parseInt(input.value);
            this.ReloadListView();
        });
        return input;
    }

    /**
     * Create a label for displaying data.
     * @param {string} propertyName - Name of the property to display.
     * @param {string} [format] - Optional format string.
     * @returns {HTMLLabelElement} - The created label element.
     */
    CreateLabel(propertyName, format = "") {
        const label = document.createElement('label');
        label.textContent = format ? format.replace("{0:n0}", this.Options[propertyName].toLocaleString()) : this.Options[propertyName];
        return label;
    }

    /**
     * Handle the event for navigating to the next page.
     */
    NextPage() {
        const pages = Math.ceil(this.Options.Total / this.Options.PageSize);
        if (this.Options.PageNumber >= pages) return;

        this.Options.PageIndex++;
        if (this.Options.ClickHandler) this.Options.ClickHandler(this.Options.PageIndex, null);
        this.ReloadListView();
    }

    /**
     * Handle the event for navigating to the previous page.
     */
    PrevPage() {
        if (this.Options.PageIndex <= 0) return;

        this.Options.PageIndex--;
        if (this.Options.ClickHandler) this.Options.ClickHandler(this.Options.PageIndex, null);
        this.ReloadListView();
    }

    /**
     * Reload the list view. This is a placeholder for actual implementation.
     */
    ReloadListView() {
        // This method should trigger a refresh of the parent list view, dependent on specific implementation.
        if (this.Parent instanceof ListView) {
            this.Parent.ActionFilter();
        }
    }
}
