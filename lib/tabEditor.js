import { Client } from "./clients/client.js";
import { EditForm } from "./editForm.js";
import { EventType, KeyCodeEnum } from "./models/";
import { HTML, Html } from "./utils/html.js";
import { LangSelect } from "./utils/langSelect.js";
import { GridView } from "./gridView.js";
import { ListView } from "./listView.js";
import { Button } from "./button.js";
import { ChromeTabs } from "./chrometab.js";

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
    /** @type {TabEditor[]} */
    static Tabs = [];
    static ActiveTab = () => TabEditor.Tabs.find(x => x.Show);
    static FindTab = (id) => TabEditor.Tabs.find(x => x.Id === id);
    /** @type {boolean} */
    static ShowTabText;
    static ActiveClass = "active";
    Popup = false;
    IsTab = true;
    /** @type {HTMLElement} */
    PopupFooter;
    constructor(entity = null) {
        super(entity);
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
        if (value && !this.Popup) {
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
        if (this.Popup) {
            this.RenderPopup();
        } else {
            this.RenderTab();
        }
        this.Focus();
    }

    get TabTitle() {
        return this.Meta?.Label ?? this.Title;
    }

    /**
     * Renders the tab part of the editor.
     */
    RenderTab() {
        Html.Take(TabEditor.TabWrapper);
        this._li = ChromeTabs.addTab({
            title: this.Meta.Title == null ? this.TabTitle : this.Title,
            favicon: this.Meta.Icon == null ? this.Meta.Icon : this.Icon,
            content: this,
        })
        Html.Take(TabEditor.TabContainer).TabIndex(-1).Trigger(EventType.Focus).Div.Event(EventType.KeyDown, (e) => this.HotKeyHandler(e)).Render();
        this.Element = Html.Context;
        this.ParentElement = TabEditor.TabContainer;
        TabEditor.Tabs.push(this);
        super.Render();
    }
    /** @type {HTMLElement} */
    PopUpMenu;

    /**
     * Renders the popup part of the editor.
     */
    RenderPopup() {
        const handler = this.DirtyCheckAndCancel.bind(this);
        Html.Take(this.ParentElement ?? this.Parent?.Element ?? TabEditor.TabContainer)
            .Div.ClassName("backdrop").TabIndex(-1).Trigger(EventType.Focus).Event(EventType.KeyDown, (e) => this.HotKeyHandler(e));
        this._backdrop = Html.Context;
        Html.Instance.Div.ClassName("popup-content").Style(this.Meta.Style).Div.ClassName("popup-title").Span.IText(this.Title);
        this.TitleElement = Html.Context;
        if (Client.Instance.SystemRole) {
            this.TitleElement.addEventListener("contextmenu", (e) => this.SysConfigMenu(e, null, null, null));
        }
        Html.Instance.End.Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event(EventType.Click, handler).End.End.End.Div.ClassName("popup-body");
        this.Element = Html.Context;
        Html.Instance.End.Div.ClassName("popup-footer");
        this.PopUpMenu = Html.Context;
        super.Render();
        if (this._backdrop.OutOfViewport().Top) {
            this._backdrop.scrollIntoView(true);
        }
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

        this._hotKeyComponents = this._hotKeyComponents
            || this.FilterChildren(x => x instanceof Button && x.Meta.HotKey.trim() !== '').map(x => x);
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
            com.Element?.click();
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
        if (e.AltKey() && keyCode === KeyCodeEnum.GraveAccent) {
            if (TabEditor.Tabs.length <= 1) {
                return;
            }
            let index = TabEditor.Tabs.indexOf(this);
            index = index >= TabEditor.Tabs.length - 1 ? 0 : index + 1;
            if (index < 0 || index > TabEditor.Tabs.length) {
                return;
            }

            TabEditor.Tabs[index]?.Focus();
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
        if (ctrlKey && altKey && (keyCode === KeyCodeEnum.LeftArrow || keyCode === KeyCodeEnum.RightArrow)) {
            let index = TabEditor.Tabs.indexOf(this);
            index = keyCode === KeyCodeEnum.LeftArrow ? (index === 0 ? TabEditor.Tabs.length - 1 : index - 1) : (index >= TabEditor.Tabs.length - 1 ? 0 : index + 1);
            if (index < 0 || index > TabEditor.Tabs.length) {
                return false;
            }

            TabEditor.Tabs[index]?.Focus();
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

    /**
     * Focuses the tab editor component, updating the document title and potentially the URL.
     */
    Focus() {
        if (!this.Popup) {
            TabEditor.Tabs.forEach(x => x.Show = false);
            if (this.FeatureName) {
                this.Href = Client.BaseUri + '/' + this.FeatureName + (this.EntityId ? `?Id=${this.EntityId}` : '');
                window.history.pushState(null, LangSelect.Get(this.TabTitle), this.Href);
            }
        }
        this.Show = true;
        document.title = LangSelect.Get(this.TabTitle);
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
        TabEditor.Tabs = TabEditor.Tabs.filter(x => x !== this);
        let existingTabIndex = ChromeTabs.tabs.findIndex(tab => tab.ul === this._li);
        if (existingTabIndex !== -1) {
            ChromeTabs.tabs.splice(existingTabIndex, 1);
        }
        if (ChromeTabs.tabs.length == 0) {
            window.history.pushState({ page: null }, "Home", (window.location.origin || ""));
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
