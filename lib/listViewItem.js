import { Section } from "./section.js";
import { Html } from "./utils/html.js";
import Decimal from "decimal.js";
import {
    Action, ComponentType, PatchDetail, PatchVM, CustomEventType,
    ObservableArgs, EventType, Component
} from "./models/";
import { Utils } from "./utils/utils.js";
import { ComponentFactory } from "./utils/componentFactory.js";
import { Label } from "./label.js";
import { EditableComponent } from "./editableComponent.js";
import { Client } from "./clients/client.js";
import { Toast } from "./toast.js";
import { Button } from "./button.js";
import { ElementType } from './models/elementType.js';

/**
 * @typedef {import('./section.js').ListViewSection} ListViewSection
 * @typedef {import('./listView.js').ListView} ListView
 * Represents a list view item.
 * @extends Section
 */
export class ListViewItem extends Section {
    IsRow = true;
    /**
     * Creates an instance of ListViewItem.
     * @param {ElementType} [elementType=ElementType.tr] - The type of HTML element.
     */
    constructor(elementType = ElementType.tr) {
        super(elementType);
        // Initialize properties
        /** @type {ListViewSection} */
        this.ListViewSection = null;
        /** @type {ListView} */
        this.ListView = null;
        this.PreQueryFn = null;
        this._selected = false;
        this._focused = false;
        this._emptyRow = false;
        this.RowNo = 0;
        this.FocusEvent = new Action();
        this.GroupRow = false;
        this._focusAwaiter = 0;
        /** @type {PatchDetail[]} */
        this.PatchModel = [];
        this.ShowMessage = true;
        this.IsListViewItem = true;
    }

    /**
     * Gets or sets whether the item is selected.
     * @type {boolean}
     */
    get Selected() {
        return this._selected;
    }
    GroupSection;
    set Selected(value) {
        this._selected = value;
        this.SetSelected(value);
        const id = this.EntityId;
        const selectedIds = this.ListView.SelectedIds;
        if (value) {
            if (!selectedIds.includes(id)) {
                selectedIds.push(id);
            }
        } else {
            const index = selectedIds.indexOf(id);
            if (index !== -1) {
                selectedIds.splice(index, 1);
            }
        }
    }

    static NotCellText = ["Button", "Image", "Checkbox"];
    static EmptyRowClass = "empty-row";
    static SelectedClass = "__selected__";
    static FocusedClass = "focus";
    static HoveringClass = "hovering";
    static GroupRowClass = "group-row";

    /**
     * Handles focus event.
     * @param {boolean} [value=null] - The new focus state.
     * @param {boolean} [triggerEvent=true] - Whether to trigger the focus event.
     * @returns {boolean} The focus state.
     */
    set Focused(value) {
        if (value === null) return this._focused;
        this._focused = value;
        if (this._focused) {
            this.ListView.LastListViewItem = this;
            this.Element.classList.add(ListViewItem.FocusedClass);
            this.Element.focus();
        } else {
            this.Element.classList.remove(ListViewItem.FocusedClass);
        }
        return this._focused;
    }

    get Focused() {
        return this._focused;
    }

    /**
     * Sets the selected state of the element.
     * @param {boolean} value - The selected state.
     */
    SetSelected(value) {
        if (!this.Element) {
            return;
        }
        if (value) {
            this.Element.classList.add(ListViewItem.SelectedClass);
        } else {
            this.Element.classList.remove(ListViewItem.SelectedClass);
        }
    }

    /**
     * Gets or sets whether the item represents an empty row.
     * @type {boolean}
     */
    get EmptyRow() {
        return this._emptyRow;
    }

    set EmptyRow(value) {
        this._emptyRow = value;
        this.FilterChildren().forEach(x => x.EmptyRow = value);
        this.AlwaysValid = value;
        if (this.Element == null) return;
        if (value) {
            this.Element.classList.add(ListViewItem.EmptyRowClass);
        } else {
            this.Element.classList.remove(ListViewItem.EmptyRowClass);
        }
    }

    /**
     * Renders the item.
     */
    Render() {
        // @ts-ignore
        this.ListView = this.ListView ?? this.FindClosest(x => x.IsListView);
        this.Meta = this.Meta ?? this.ListView.Meta;
        super.Render();
        if (this._selected) {
            this.Element.classList.add(ListViewItem.SelectedClass);
        }
        Html.Instance.Take(this.Element)
            .Event(EventType.Click, this.RowItemClick.bind(this))
            .Event(EventType.DblClick, this.RowDblClick.bind(this))
            .Event(EventType.FocusIn, () => {
                if (this.Meta.CanAdd) {
                    this.ListView.EmptySection.Children.ForEach(x => {
                        if (x.Focused) {
                            x.Focused = false;
                        }
                    });
                }
                this.ListView.AllListViewItem.ForEach(x => {
                    if (x.Focused) {
                        x.Focused = false;
                    }
                });
                this.Focused = true;
            })
            .Event(EventType.FocusOut, this.RowFocusOut.bind(this))
            .Event(EventType.MouseEnter, this.MouseEnter.bind(this))
            .Event(EventType.MouseLeave, this.MouseLeave.bind(this));
    }

    /**
     * @param {any} success
     */
    AfterSaveHandler(success) {
        if (!success) {
            this.EntityId = null;
        }
    }

    /**
     * Renders row data.
     * @param {Component[]} headers - The list of table headers.
     * @param {object} row - The row data.
     * @param {number} [index=null] - The index of the row.
     * @param {boolean} [emptyRow=false] - Whether the row is empty.
     */
    RenderRowData(headers, row, index = null, emptyRow = false) {
        if (index !== null) {
            if (index >= this.Element.parentElement.children.length || index < 0) {
                index = 0;
            }
            this.Element.parentElement.insertBefore(this.Element, this.Element.parentElement.children[index]);
        }
        const fn = Utils.IsFunction(this.Meta.Renderer);
        if (!fn) {
            headers.filter(header => !header.Hidden).forEach(header => {
                this.RenderTableCell(row, header, this.Element);
            });
        }
    }

    /**
     * Renders a table cell.
     * @param {object} rowData - The row data.
     * @param {Component} header - The table header component.
     * @param {HTMLElement} [cellWrapper=null] - The wrapper element for the cell.
     */

    masterDataComponent = ["Dropdown", "Select2", "MultipleSearchEntry", "SearchEntry"];

    RenderTableCell(rowData, header, cellWrapper = null) {
        if (!header.FieldName) {
            return;
        }
        if (this.masterDataComponent.includes(header.ComponentType)) {
            header.LocalData = header.LocalData;
        }
        var com = ((header.CanWrite && header.Editable)
            || (!header.Editable && header.ComponentType == "Button")) ? ComponentFactory.GetComponent(header, this.EditForm, null, header.CanWrite) : new Label(header);
        if (!com) return;
        com.Id = header.Id;
        com.Name = header.FieldName;
        com.Entity = rowData;
        com.ParentElement = cellWrapper || Html.Context;
        this.AddChild(com);
        if (this.Disabled || header.Disabled) {
            com.SetDisabled(true);
        }
        if (com.Element && header.ChildStyle) {
            com.Element.style.cssText = header.ChildStyle;
        }
        com.UserInput.add(arg => this.UserInputHandler(arg, com));
    }

    /**
     * Handles user input event.
     * @param {ObservableArgs} arg - The observable arguments.
     * @param {EditableComponent} component - The editable component.
     */
    UserInputHandler(arg, component) {
        if (component.Disabled) {
            return;
        }
        if (component.ComponentType == "Input" || component.ComponentType == "Textarea") {
            if (arg.EvType == EventType.Abort || arg.EvType == EventType.Change || arg.EvType == EventType.Blur) {
                if (component.Disabled) {
                    return;
                }
                this.ListView.RowChangeHandler(component.Entity, this, arg, component).then(() => {
                    this.ListView.RealtimeUpdateAsync(this, arg).then();
                })
            }
        }
        else {
            this.ListView.RowChangeHandler(component.Entity, this, arg, component).then(() => {
                if (component.ComponentType != "Button" && arg.EvType == EventType.Change) {
                    if (component.Disabled) {
                        return;
                    }
                    this.ListView.RealtimeUpdateAsync(this, arg).then();
                }
            });
        }
    }

    /**
     * Updates or creates a patch.
     * @param {boolean} [showMessage=true] - Whether to show a message.
     * @returns {Promise<boolean>} A promise that resolves to true if successful, otherwise false.
     */
    async PatchUpdateOrCreate(showMessage = true) {
        if (!this.Dirty) {
            return false;
        }
        return new Promise((resolve) => {
            const patchModel = this.GetPatchEntity();
            if (patchModel.Changes.length == 1) {
                return;
            }
            this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforePatchUpdate, this.Entity, patchModel, this)
                .then(() => {
                    this.ShowMessage = showMessage;
                    this.ValidateAsync().then(isValid => {
                        if (!isValid) return;
                        Client.Instance.PatchAsync(patchModel).then(rs => {
                            this.PatchUpdateCb(rs);
                            resolve(rs.updatedItem[0]);
                        });
                    });
                });
        });
    }

    PatchUpdateCb(data) {
        if (data && data.status == 200) {
            Toast.Success("Save data success");
            this.EntityId = data.updatedItem[0][this.IdField];
            this.Dirty = false;
            this.EmptyRow = false;
        }
        if (this.Entity[this.IdField].startsWith("-")) {
            this.Entity[this.IdField] = data.updatedItem[0][this.IdField];
        }
        this.UpdateView(true);
        this.AfterSaved?.invoke(data);
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterPatchUpdate, this.Entity, this).then();
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Children.forEach(/**@param {EditableComponent} child **/ child => {
            child.Entity = this.Entity;
            child.PrepareUpdateView(force, dirty, componentNames);
            child.UpdateView(force, dirty, componentNames);
        });
    }

    /**
     * Retrieves the patch entity.
     * @returns {PatchVM} The patch entity.
     */
    GetPatchEntity() {
        const shouldGetAll = this.EntityId === null;
        var dirtyPatch = [];
        if (this.EntityId.startsWith("-")) {
            Object.getOwnPropertyNames(this.Entity).forEach(x => {
                if (this.Entity[x] instanceof Array || (this.Entity[x] instanceof Object && !(this.Entity[x] instanceof Decimal))) {
                    return;
                }
                var val = "";
                if (this.Entity[x] instanceof Boolean) {
                    if (this.Entity[x]) {
                        val = "1";
                    }
                    else {
                        val = "0";
                    }
                }
                else {
                    val = this.Entity[x];
                }
                let patchDetail = new PatchDetail();
                patchDetail.Label = x;
                patchDetail.Field = x;
                patchDetail.OldVal = null;
                patchDetail.Value = val;
                var component = this.Children.find(y => y.Meta.FieldName == x)
                if (component) {
                    let text = component.GetValueText();
                    let actText = Utils.isNullOrWhiteSpace(text) ? 'N/A' : text;
                    let oldText = Utils.isNullOrWhiteSpace(component.OriginalText) ? 'N/A' : component.OriginalText;
                    if (actText != oldText) {
                        patchDetail.HistoryValue = `${component.Meta.Label}: ${oldText} => ${actText}`;
                    }
                }
                dirtyPatch.push(patchDetail);
            })
            dirtyPatch = dirtyPatch.filter(x => x.Value);
        }
        else {
            dirtyPatch = this.FilterChildren(
                child => child instanceof EditableComponent && !(child instanceof Button) &&
                    (shouldGetAll || child.Dirty) && child.Meta && child.Meta.FieldName.trim().length > 0
            ).flatMap(child => {
                let listDetail = [];
                if (typeof child['PatchDetail'] === 'function') {
                    listDetail = child['PatchDetail'].call(child);
                } else {
                    let actValue = child.FieldVal;
                    if (actValue instanceof Boolean) {
                        if (this.Entity[x]) {
                            actValue = "1";
                        }
                        else {
                            actValue = "0";
                        }
                    }
                    if (actValue == null || actValue.toString().trim().length === 0) {
                        actValue = null;
                    }
                    let patchDetail = new PatchDetail();
                    patchDetail.Label = child.Meta.FieldName;
                    patchDetail.Field = child.Meta.FieldName;
                    patchDetail.OldVal = null;
                    patchDetail.Value = actValue;
                    if (child) {
                        let text = child.GetValueText();
                        let actText = Utils.isNullOrWhiteSpace(text) ? 'N/A' : text;
                        let oldText = Utils.isNullOrWhiteSpace(child.OriginalText) ? 'N/A' : child.OriginalText;
                        if (actText != oldText) {
                            patchDetail.HistoryValue = `${child.Meta.Label}: ${oldText} => ${actText}`;
                        }
                    }
                    dirtyPatch.push(patchDetail);
                    listDetail = [patchDetail];
                }
                return listDetail;
            }).filter((value, index, self) => self.findIndex(t => t.Field === value.Field) === index);
            this.AddIdToPatch(dirtyPatch);
        }
        if (dirtyPatch.length == 1) {
            dirtyPatch = [];
            Object.getOwnPropertyNames(this.Entity).forEach(x => {
                if (this.Entity[x] instanceof Array || (this.Entity[x] instanceof Object && !(this.Entity[x] instanceof Decimal))) {
                    return;
                }
                var val = "";
                if (this.Entity[x] instanceof Boolean) {
                    if (this.Entity[x]) {
                        val = "1";
                    }
                    else {
                        val = "0";
                    }
                }
                else {
                    val = this.Entity[x];
                }
                let patchDetail = new PatchDetail();
                patchDetail.Label = x;
                patchDetail.Field = x;
                patchDetail.OldVal = null;
                patchDetail.Value = val;
                var component = this.Children.find(y => y.Meta.FieldName == x)
                if (component) {
                    let text = component.GetValueText();
                    let actText = Utils.isNullOrWhiteSpace(text) ? 'N/A' : text;
                    let oldText = Utils.isNullOrWhiteSpace(component.OriginalText) ? 'N/A' : component.OriginalText;
                    if (actText != oldText) {
                        patchDetail.HistoryValue = `${component.Meta.Label}: ${oldText} => ${actText}`;
                    }
                }
                dirtyPatch.push(patchDetail);
            })
            dirtyPatch = dirtyPatch.filter(x => x.Value);
        }
        this.PatchModel.push(...dirtyPatch);
        // @ts-ignore
        return {
            Changes: dirtyPatch,
            Table: this.ListView.Meta.RefName,
            Delete: [],
            Detail: []
        };
    }

    /**
     * Handles double click event on a row.
     * @param {Event} e - The event object.
     */
    RowDblClick(e) {
        e.stopPropagation();
        this.ListView.DblClick?.invoke(this);
        this.DispatchEvent(this.Meta.Events, EventType.DblClick, this, this.Entity).then();
    }

    /**
     * Handles row item click event.
     * @param {Event} e - The event object.
     */
    RowItemClick(e) {
        e.stopPropagation();
        const ctrl = e.CtrlOrMetaKey();
        const shift = e.ShiftKey();
        /** @type {HTMLElement} */
        // @ts-ignore
        const target = e.target;
        const focusing = this.FirstOrDefault(x => x.Element === target || x.ParentElement.contains(target)) !== null;
        this.HotKeySelectRow(ctrl, shift, focusing);
        if (!e.ShiftKey()) {
            this.ListView.RowClick?.invoke(this.Entity);
        }
        this.ListView.LastListViewItem = this;
        this.Focus = true;
        this.DispatchEvent(this.Meta.Events, EventType.Click, this, this.Entity).then();
    }

    /**
     * Handles hotkey selection of rows.
     * @param {boolean} ctrl - Whether the control key is pressed.
     * @param {boolean} shift - Whether the shift key is pressed.
     * @param {boolean} focusing - Whether the row is focusing.
     */
    HotKeySelectRow(ctrl, shift, focusing) {
        if (this.EmptyRow) {
            return;
        }
        if (this.ListView.VirtualScroll) {
            if (ctrl || shift) {
                this.Selected = !this._selected;
                if (this._selected) {
                    this.ListView.SelectedIndex = this.Children.indexOf(this);
                }
            }
            if (shift) {
                const allListView = this.ListView.AllListViewItem;
                if (this.ListView.LastShiftViewItem === null) {
                    this.ListView.LastShiftViewItem = this;
                    this.ListView.LastIndex = this.RowNo;
                }
                let _lastIndex = this.ListView.LastIndex;
                let currentIndex = this.RowNo;
                if (_lastIndex > currentIndex) {
                    let temp = _lastIndex;
                    _lastIndex = currentIndex;
                    currentIndex = temp;
                }
                if (this.ListView.VirtualScroll && currentIndex > _lastIndex) {
                    const sql = this.ListView.GetSql(_lastIndex - 1, currentIndex - _lastIndex + 1, true);
                    Client.Instance.GetIds(sql).then(selectedIds => {
                        if (this.Selected) {
                            selectedIds.filter(x => !this.ListView.SelectedIds.includes(x)).forEach(x => this.ListView.SelectedIds.push(x));
                        } else {
                            selectedIds.forEach(x => {
                                const index = this.ListView.SelectedIds.indexOf(x);
                                if (index !== -1) {
                                    this.ListView.SelectedIds.splice(index, 1);
                                }
                            });
                        }
                        this.SetSeletedListViewItem(allListView, _lastIndex, currentIndex);
                        this.ListView.LastShiftViewItem = null;
                    });
                } else {
                    this.SetSeletedListViewItem(allListView, _lastIndex, currentIndex);
                }
            }
        } else {
            if (!ctrl && !shift) {
                if (this.ListView.SelectedIds.length <= 1) {
                    this.ListView.ClearSelected();
                    this.Selected = !this._selected;
                    if (this._selected) {
                        this.ListView.SelectedIndex = this.ListView.Children.indexOf(this);
                    }
                }
                return;
            }
            this.Selected = !this._selected;

            if (!shift && !ctrl && this._selected) {
                this.ListView.SelectedIndex = this.ListView.Children.indexOf(this);
            }
            if (shift) {
                const allListView = this.ListView.AllListViewItem;
                const selected = allListView.find(x => x.Selected);
                let _lastIndex = allListView.indexOf(selected);
                var currentIndex = this.ListView.Children.indexOf(this);
                if (currentIndex > _lastIndex) {
                    let temp = currentIndex;
                    currentIndex = _lastIndex;
                    _lastIndex = temp;
                }
                for (let i = _lastIndex; i <= currentIndex; i++) {
                    /** @type {ListViewItem} */
                    // @ts-ignore
                    let listViewItem = this.ListView.Children[i];
                    if (listViewItem instanceof ListViewItem) {
                        listViewItem.Selected = true;
                    }
                }
            }
        }
    }

    /**
     * Sets selected list view items.
     * @param {ListViewItem[]} allListView - The list of all list view items.
     * @param {number} _lastIndex - The last index.
     * @param {number} currentIndex - The current index.
     */
    SetSeletedListViewItem(allListView, _lastIndex, currentIndex) {
        const start = allListView[0].RowNo > _lastIndex ? allListView[0].RowNo : _lastIndex;
        const items = this.ListView.AllListViewItem.filter(x => x.RowNo >= start && x.RowNo <= currentIndex);
        if (!this.ListView.VirtualScroll) {
            this.ListView.SelectedIds = items.map(x => x.EntityId);
        }
        items.forEach(item => {
            const id = item.EntityId;
            if (this.ListView.SelectedIds.includes(id)) {
                item.Selected = this.Selected;
            } else {
                item.Selected = false;
            }
        });
    }
    /**
     * Handles row focus out event.
     */
    RowFocusOut() {
        this.Focus = false;
        return this.DispatchCustomEvent(this.Meta.Events, CustomEventType.RowFocusOut, this.Entity);
    }

    /**
     * Handles mouse enter event.
     */
    MouseEnter() {
        this.Element.classList.add(ListViewItem.HoveringClass);
        return this.DispatchCustomEvent(this.ListView.Meta.Events, CustomEventType.RowMouseEnter, this.Entity);
    }

    /**
     * Handles mouse leave event.
     */
    MouseLeave() {
        this.Element.classList.remove(ListViewItem.HoveringClass);
        return this.DispatchCustomEvent(this.ListView.Meta.Events, CustomEventType.RowMouseLeave, this.Entity);
    }

    /**
     * Gets or sets whether to show a message.
     * @type {boolean}
     */
    get ShowMessage() { return this._showMessage; }
    set ShowMessage(value) { this._showMessage = value; }

    /**
     * Validates asynchronously.
     * @returns {Promise<boolean>} A promise that resolves to true if all validations pass, otherwise false.
     */
    ValidateAsync() {
        return new Promise((ok, err) => {
            const allValid = this.FilterChildren(
                x => x.Children.length === 0,
                x => x.AlwaysValid
            ).ForEachAsync(x => x.ValidateAsync());
            allValid.then(res => {
                const allOk = res.every(x => x.IsValid);
                ok(allOk);
                if (!allOk && this.ShowMessage) {
                    const message = res.filter(x => !x.IsValid)
                        .map(x => Object.values(x.ValidationResult).Combine(null, Utils.BreakLine))
                        .Combine(null, Utils.BreakLine);
                    Toast.Warning(message);
                }
            }).catch(err);
        });
    }
}

