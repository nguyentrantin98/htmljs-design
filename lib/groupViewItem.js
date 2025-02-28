import { ListViewItem } from "./listViewItem.js";


export class GroupViewItem extends ListViewItem {
    static #ChevronDown = "fa-square";
    static #ChevronRight = "fa-check-square";

    #showChildren = true;
    #showChildren1 = true;
    #parentItem;
    #childrenItems = [];
    #groupText;

    /**
     * @param {import("./models/elementType.js").ElementType} elementType
     */
    constructor(elementType) {
        super(elementType);
        this.GroupRow = true;
        this.#childrenItems = [];
    }
    Key;
    Render() {
        super.Render();
        this.Element.classList.add(ListViewItem.GroupRowClass);
    }

    get Selected() { return false; }
    set Selected(value) { this._selected = false; }

    get ParentItem() { return this.#parentItem; }
    set ParentItem(value) { this.#parentItem = value; }

    get ChildrenItems() { return this.#childrenItems; }
    set ChildrenItems(value) { this.#childrenItems = value; }

    get GroupText() { return this.#groupText; }
    set GroupText(value) { this.#groupText = value; }

    /**
     * @param {string} text
     */
    AppendGroupText(text) {
        if (!this.#groupText) return;
        this.#groupText.innerHTML = this.#groupText.firstElementChild.outerHTML + text;
    }

    SetGroupText(text) {
        if (!this.#groupText) return;
        this.#groupText.innerHTML = text;
    }

    get ShowChildren() { return this.#showChildren; }
    set ShowChildren(value) {
        this.#showChildren = value;
        this.#childrenItems.forEach(x => x.Show = value);
    }

    get ShowChildren1() { return this.#showChildren1; }
    set ShowChildren1(value) {
        this.#showChildren1 = value;
        this.#childrenItems.forEach(x => x.Selected = value);
        if (!value) {
            this._chevron.ReplaceClass(GroupViewItem.#ChevronRight, GroupViewItem.#ChevronDown);
        } else {
            this._chevron.ReplaceClass(GroupViewItem.#ChevronDown, GroupViewItem.#ChevronRight);
        }
    }
}
