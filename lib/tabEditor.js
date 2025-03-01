import { EditForm } from "./editForm.js";
import { EventType, KeyCodeEnum } from "./models/";
import { Html } from "./utils/html.js";
import { GridView } from "./gridView.js";
import { ListView } from "./listView.js";
import { ChromeTabs } from "./chrometab.js";
import { Utils } from "./index.js";

/**
 * Represents a tab editor component, which can manage multiple tabs and their content.
 * @extends {EditForm}
 */
export class TabEditor extends EditForm {
    static get TabContainer() {
        var container = document.getElementById("tab-content");
        if (container == null) {
            container = document.createElement("div").id("tab-content");
            document.body.appendChild(container);
        }
        return container;
    }
    static ActiveTab = () => ChromeTabs.tabs.find(x => x.content.Show);
    static FindTab = (id) => ChromeTabs.tabs.find(x => x.Id === id);
    /** @type {boolean} */
    static ShowTabText;
    static ActiveClass = "active";
    constructor(entity = null) {
        super(entity);
        this.IsTab = true;
        this.PopulateDirty = false;
        this._hotKeyComponents = [];
        this.DataSearchEntry = {};
    }

    /**
     * Gets or sets the visibility of the tab editor.
     * @property
     */
    get Show() {
        return super.Show;
    }

    set Show(value) {
        super.Show = value;
        if (value && !this.Popup && this.IsLargeUp) {
            ChromeTabs.setCurrentTab(this._li, this.Pop);
        }
    }

    /**
     * Renders the component to the DOM.
     */
    Render() {
        if (!this.ParentElement) {
            this.ParentElement = TabEditor.TabContainer;
        }
        if (!this.Popup) {
            this.RenderTab();
        }
        else {
            super.Render();
        }
    }

    get TabTitle() {
        return this.Meta?.Label ?? this.Title;
    }

    /**
     * Renders the tab part of the editor.
     */
    RenderTab() {
        Html.Take(TabEditor.TabContainer).TabIndex(-1).Trigger(EventType.Focus).Div.Event(EventType.KeyDown, (e) => this.HotKeyHandler(e)).Render();
        this.Element = Html.Context;
        this.ParentElement = TabEditor.TabContainer;
        super.Render();
    }

    TriggerMatchHotKey(e, keyCode, shiftKey, ctrlKey, altKey) {
        if (keyCode == null) {
            return;
        }
        let patternList = [];
        if (shiftKey) {
            patternList.push(KeyCodeEnum.Shift);
        }

        if (ctrlKey) {
            patternList.push(KeyCodeEnum.Ctrl);
        }

        if (altKey) {
            patternList.push(KeyCodeEnum.Alt);
        }

        if (keyCode < KeyCodeEnum.Shift) {
            patternList.unshift(keyCode);
        } else if (keyCode > KeyCodeEnum.Alt) {
            patternList.push(keyCode);
        }

        this._hotKeyComponents = this.ChildCom.filter(x => x.IsButton && !Utils.isNullOrWhiteSpace(x.Meta.HotKey));
        this._hotKeyComponents.forEach(com => {
            let parts = com.Meta.HotKey.split(",");
            if (parts.length === 0) {
                return;
            }

            let lastPart = parts[parts.length - 1];
            let configKeys = lastPart.split("-").map(x => {
                let key = KeyCodeEnum[x.trim()];
                return key ? key : null;
            }).filter(x => x != null).sort((a, b) => a - b);
            let isMatch = JSON.stringify(patternList) === JSON.stringify(configKeys);
            if (!isMatch) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            com.Element.click();
            return;
        });
    }

    /**
     * Handles hotkey events for the editor.
     * @param {Event} e - The event object.
     */
    HotKeyHandler(e) {
        const keyCode = e.KeyCodeEnum();
        if (keyCode === KeyCodeEnum.F6) {
            let gridView = this.FindActiveComponent(x => x instanceof GridView).FirstOrDefault();
            if (gridView instanceof GridView) {
                if (gridView && !gridView.AllListViewItem.some(x => x.Selected)) {
                    if (gridView.AllListViewItem.length) {
                        gridView.AllListViewItem[0].Focus();
                    } else {
                        gridView.ListViewSearch.Focus();
                    }
                }
                return;
            }
        }
        const shiftKey = e.ShiftKey();
        const ctrlKey = e.CtrlOrMetaKey();
        const altKey = e.AltKey();
        const defaultKeys = this.DefaultHotKeys(keyCode, shiftKey, ctrlKey, altKey);
        if (defaultKeys) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (keyCode >= KeyCodeEnum.Shift && keyCode <= KeyCodeEnum.Alt) {
            return;
        }

        this.TriggerMatchHotKey(e, keyCode, shiftKey, ctrlKey, altKey);
    }
    /**
     * Checks if the default hotkeys are triggered.
     * @param {boolean} shiftKey - Indicates if the Shift key is pressed.
     * @param {boolean} ctrlKey - Indicates if the Control key is pressed.
     * @param {boolean} altKey - Indicates if the Alt key is pressed.
     * @returns {boolean} - True if a default hotkey is triggered, otherwise false.
     */
    DefaultHotKeys(keyCode, shiftKey, ctrlKey, altKey) {
        if (!keyCode) {
            return false;
        }
        // @ts-ignore
        if (keyCode === KeyCodeEnum.Escape && !shiftKey && !ctrlKey && !altKey) {
            this.DirtyCheckAndCancel();
            return true;
        }
        if (ctrlKey && shiftKey && keyCode === KeyCodeEnum.F) {
            // Trigger search in the grid view
            let listView = this.FindActiveComponent(x => x instanceof ListView).FirstOrDefault();
            if (listView instanceof ListView) {
                if (!listView || !listView.Meta.CanSearch) {
                    return true;
                }
                listView.ListViewSearch.AdvancedSearch(null);
                return true;
            }
        }
        return false;
    }

    Close(event) {
        const intWhich = parseInt(event["which"]?.toString());
        const intButton = parseInt(event["button"]?.toString());
        if (intWhich === 2 || intButton === 1) {
            event.preventDefault();
            this.DirtyCheckAndCancel();
        }
    }

    /**
     * Disposes of the tab editor, removing it from the DOM and focusing on the parent form.
     */
    Dispose() {
        if (!this.Popup && this._li) {
            this.DisposeTab();
        }
        super.Dispose();
    }

    /**
     * Disposes of the tab, removing its association from the list of tabs.
     */
    DisposeTab() {
        if (this.ParentForm) {
            this.ParentForm.focus();
            this.ParentForm = null;
        }
        let existingTabIndex = ChromeTabs.tabs.findIndex(tab => tab.ul === this._li);
        if (existingTabIndex !== -1) {
            ChromeTabs.tabs.splice(existingTabIndex, 1);
        }
        if (ChromeTabs.tabs.length == 0) {
            window.history.pushState({ page: null }, "/#/home", (window.location.origin || ""));
        }
    }

    /**
     * Removes DOM elements associated with the tab editor.
     */
    RemoveDOM() {
        this.Element?.remove();
        this._li?.remove();
        this._backdrop?.remove();
        this._backdropGridView?.remove();
    }

}
