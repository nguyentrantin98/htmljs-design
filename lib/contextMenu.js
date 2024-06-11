import { Html } from "./utils/html.js";
import EditableComponent from "./editableComponent.js";
import { ComponentExt } from "./utils/componentExt.js";

/**
 * Represents a context menu item.
 */
export class ContextMenuItem {
    Ele = null;
    Icon = '';
    Style = '';
    Text = '';
    /**
     * The click event handler of the item.
     * @type {Function}
     */
    Click = null;
    Disabled = false;
    Parameter = null;
    /**
     * The sub-menu items of the item.
     * @type {ContextMenuItem[]}
     */
    MenuItems = [];
}

/**
 * Represents a context menu.
 */
export class ContextMenu extends EditableComponent {
    PElement = null;
    Top = 0;
    Left = 0;
    _selectedContextMenuItem = null;
    _selectedItem = null;
    IsRoot = false;
    _selectedIndex = -1;
    /**
     * The menu items of the menu.
     * @type {ContextMenuItem[]}
     */
    MenuItems = [];
    _active = 'active';
    static _instance = null;
    IsSingleton = true;
    /**
     * Gets the singleton instance of the menu.
     * @type {ContextMenu}
     */
    static get Instance() {
        if (!this._instance) {
            // @ts-ignore
            this._instance = new ContextMenu();
            this._instance.MenuItems = [];
        }
        this._instance.PElement = null;
        return this._instance;
    }

    /**
     * Renders the menu.
     */
    Render() {
        if (this.Element == null) {
            Html.Take(this.PElement ?? document.body).Ul.ClassName("context-menu");
            this.Element = Html.Instance.Context;
        }
        if (this.PElement == null && this.Element != null) {
            document.body.appendChild(this.Element);
        }
        if (this.PElement != null && this.Element != null) {
            this.PElement.appendChild(this.Element);
        }
        this.Element = this.Element;
        this.Element.addEventListener("focusout", () => this.Dispose());
        this.Element.addEventListener("keydown", (e) => this.HotKeyHandler(e));
        Html.Take(this.Element).Clear().TabIndex(-1).Floating(this.Top, this.Left);
        this.ParentElement = this.Element.ParentElement;
        this.RenderMenuItems(this.MenuItems);
        window.setTimeout(() => {
            if (this.Element != null) {
                this.Element.style.display = "block";
                this.Element.focus();
                this.AlterPosition();
            }
        }, 50);
    }

    /**
     * Renders the menu items.
     * @param {ContextMenuItem[]} items - The menu items to render.
     * @param {number} level - The level of the menu items.
     */
    RenderMenuItems(items, level = 0) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item) {
                continue;
            }
            Html.Instance.Li.Style(item.Style).Render();
            item.Ele = Html.Context;
            if (i == 0 && level == 0 && (items[i].MenuItems == null || items[i].MenuItems.length == 0)) {
                this._selectedIndex = i;
                this.SetSelectedItem(Html.Context);
            }
            if (item.Disabled) {
                Html.Instance.Attr("disabled", "disabled");
            } else {
                Html.Instance.Event("click", (e) => this.MenuItemClickHandler(e, item));
            }
            Html.Instance.Icon(item.Icon).End.Span.IText(item.Text).End.Render();
            if (item.MenuItems != null && item.MenuItems.length > 0) {
                Html.Instance.Ul.Render();
                this.RenderMenuItems(item.MenuItems, level + 1);
                Html.Instance.End.Render();
            }
            Html.Instance.End.Render();
        }
    }

    /**
     * Sets the selected item.
     * @param {HTMLElement} ele - The HTML element to set as selected.
     */
    SetSelectedItem(ele) {
        this._selectedItem = ele;
        this._selectedItem.classList.add(this._active);
    }

    /**
     * Handles the click event of a menu item.
     * @param {Event} e - The click event.
     * @param {ContextMenuItem} item - The clicked menu item.
     */
    MenuItemClickHandler(e, item) {
        e.stopPropagation();
        if (!item || !item.Click) {
            return;
        }
        item.Click(item.Parameter);
        this.Element.dispatchEvent(new Event('focusout'));
    }

    /**
     * Handles the hotkey event.
     * @param {Event} e - The hotkey event.
     */
    HotKeyHandler(e) {
        e.preventDefault();
        if (!this.Element || !this.Element.children || this.Element.children.length === 0) {
            return;
        }
        const children = this._selectedItem ? this._selectedItem.parentElement.children : this.Element.children;
        const code = e.KeyCode();
        switch (code) {
            case 27:
                this.Dispose();
                break;
            case 37:
                if (this.IsRoot || !this._selectedItem || !this._selectedItem.parentElement) {
                    return;
                }
                Array.from(this._selectedItem.parentElement.children).forEach(x => x.classList.remove(this._active));
                this._selectedItem = this._selectedItem.parentElement;
                break;
            case 38:
                e.preventDefault();
                e.stopPropagation();
                Array.from(children).forEach(x => x.classList.remove(this._active));
                this._selectedIndex = this._selectedIndex > 0 ? this._selectedIndex - 1 : children.length - 1;
                this.SetSelectedItem(children[this._selectedIndex]);
                break;
            case 39:
                const ul = this._selectedItem ? this._selectedItem.lastElementChild : null;
                if (!ul || !ul.children || ul.children.length === 0) {
                    return;
                }
                Array.from(ul.children).forEach(x => x.classList.remove(this._active));
                this.SetSelectedItem(ul.firstElementChild);
                break;
            case 40:
                e.preventDefault();
                e.stopPropagation();
                Array.from(children).forEach(x => x.classList.remove(this._active));
                this._selectedIndex = this._selectedIndex < children.length - 1 ? this._selectedIndex + 1 : 0;
                this.SetSelectedItem(children[this._selectedIndex]);
                break;
            case 13:
                if (!this._selectedItem && this.Element.firstElementChild instanceof HTMLElement) {
                    this.SetSelectedItem(this.Element.firstElementChild);
                }
                this.MenuItemClickHandler(e, this.MenuItems.find(x => x.Ele === this._selectedItem));
                break;
        }
    }

    /**
     * Alters the position of the menu.
     */
    AlterPosition() {
        this.Floating(this.Top, this.Left);
        const clientRect = this.Element.getBoundingClientRect();
        const outOfViewPort = this.Element.OutOfViewport();
        if (outOfViewPort.Bottom) {
            this.Element.style.top = `${this.Top - clientRect.height}px`;
        }
        if (outOfViewPort.Right) {
            this.Element.style.left = `${this.Left - clientRect.width}px`;
            this.Element.style.top = `${this.Top}px`;
        }
        const updatedOutOfViewPort = this.Element.OutOfViewport();
        if (updatedOutOfViewPort.Bottom) {
            this.Element.style.top = `${this.Top - clientRect.height}px`;
            this.Element.style.top = `${this.Top - clientRect.height - this.Element.clientHeight}px`;
        }
    }
    time;
    Dispose() {
        window.clearTimeout(this.time);
        this.time = window.setTimeout(() => {
            if (this.Element != null) {
                this.Element.remove();
                this.Element = null;
            }
        }, 100);
    }

    Floating(top, left) {
        this.Element.style.position = 'fixed';
        this.Element.style.top = `${top}px`;
        this.Element.style.left = `${left}px`;
    }
}