import { Utils } from "./utils/utils.js";
import { EditableComponent } from "./editableComponent.js";
import { ComponentExt } from './utils/componentExt.js';
import { Html } from "./utils/html.js";
import { Client } from "./clients/";
import { Str } from "./utils/ext.js";
import {
    SqlViewModel, EmailVM, ComponentType, FeaturePolicy, Action, PatchDetail,
    PatchVM, Feature, EventType, Component
} from "./models/";
import { Message } from "./utils/message.js";
import { StringBuilder } from "./utils/stringBuilder.js";
import { ComponentFactory } from "./utils/componentFactory.js";
import { Toast } from "./toast.js";
import { Label } from "./label.js";
import { ConfirmDialog } from "./confirmDialog.js";
import { WebSocketClient } from "./clients/websocketClient.js";
import { ContextMenu } from "./contextMenu.js";
import React from "react";
import { createRoot } from 'react-dom/client';
import Decimal from "decimal.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { GridView } from "./gridView.js";
import { Spinner } from "./spinner.js";
import { LangSelect } from "./utils/langSelect.js";
import { ChromeTabs } from "./chrometab.js";
/**
 * @typedef {import('./listView.js').ListView} ListView
 * Represents an editable form component.
 */
export class EditForm extends EditableComponent {
    /** @type {TabEditor[]} */
    static Tabs = [];
    IsEditForm = true;
    /** @type {EditForm} */
    static LayoutForm;
    /** @type {EditableComponent} */
    OpenFrom;
    /** @type {ListView[]} */
    ListViews = [];
    /** @type {EditableComponent[]} */
    ChildCom = [];
    static ExpiredDate = "ExpiredDate";
    Pop = false;
    static BtnExpired = "btnExpired";
    static BtnSave = "btnSave";
    static BtnSend = "btnSend";
    static BtnApprove = "btnApprove";
    static BtnReject = "btnReject";
    static StatusIdField = "StatusId";
    static BtnCancel = "btnCancel";
    static BtnPrint = "btnPrint";
    static BtnPreview = "btnPreview";
    static SpecialEntryPoint = 'entry';
    Portal = true;
    /** @type {Object} */
    Entity;
    IsLock = false;
    /** @type {Feature} */
    Meta;
    /** @type {Component[]} */
    _allCom = [];
    _li;
    get AllCom() {
        if (this._allCom !== null) return this._allCom;
        if (EditForm.LayoutForm === null) {
            this._allCom = this.Meta.Component.slice(); // Assuming Feature.Component is an array
        } else {
            this._allCom = this.Meta.Component.concat(EditForm.LayoutForm.Meta.Component);
        }
        return this._allCom;
    }

    get FeatureName() {
        return this.Name || this.Meta?.Name;
    }

    // Standard property getter and setter for Href
    get Href() {
        return this.href;
    }

    set Href(value) {
        this.href = value;
    }

    static Portal = false;



    /**
     * Constructor for EditForm.
     * @param {string | null} entity - The entity associated with this form.
     */
    constructor(entity = null) {
        super(null);
        this.urlSearch = new URLSearchParams(window.location.search);
        this.entity = entity;
        this.Meta = new Feature();
    }

    /**
     * Gets patch data from the form entity.
     * @returns {PatchVM} The patch view model.
     */
    GetPatchEntity() {
        const shouldGetAll = this.EntityId == null;
        const details = this.FilterChildren(child => {
            return !(child.IsButton)
                && (shouldGetAll || child.Dirty) && child.Meta != null
                && child.Name != null;
        }, x => x.IsListView || x.AlwaysValid || !x.PopulateDirty);
        const patches = details.SelectMany(child => {
            if (typeof child['GetPatchDetail'] === 'function') {
                return child['GetPatchDetail']();
            }
            const value = Utils.GetPropValue(child.Entity, child.Name);
            /**
             * @type {PatchDetail}
             */
            // @ts-ignore
            const patch = {
                Label: child.ComLabel,
                Field: child.Name,
                OldVal: (child.OldValue != null) ? child.OldValue.toString() : child.OldValue?.toString(),
                Value: (value != null) ? value.toString() : !this.EditForm.Meta.IgnoreEncode ? Utils.EncodeSpecialChar(value?.toString().trim()) : value?.toString().trim(),
            };
            return [patch];
        })
            .DistinctBy(x => x.Field);
        this.AddIdToPatch(details);
        /** @type {PatchVM} */
        // @ts-ignore
        const patchVM = { Changes: patches, Table: this.Meta.EntityName, QueueName: this.QueueName, CacheName: this.CacheName };
        return patchVM;
    }

    async SaveAdd() {
        var rs = await this.SavePatch();
        if (rs) {
            /**
             * @type {GridView[]}
             */
            var data = this.ChildCom.filter(x => x.IsListView && x.Meta.Editable && !x.Meta.IsRealtime);
            /**
            * @type {GridView[]}
            */
            await this.DispatchCustomEvent(this.Meta.Events, "onsaveadd", this, data)
            for (const grid of data) {
                await grid.ReloadData();
            }
            this.UpdateView();
        }
    }

    async SavePatch() {
        if (!this.Dirty) {
            Toast.Warning(Message.NotDirty);
            return false;
        }

        try {
            /**
             * @type {GridView[]}
             */
            var data = this.ChildCom.filter(x => x.IsListView && x.Meta.Editable && !x.Meta.IsRealtime);
            /**
            * @type {GridView[]}
            */
            var gridItem = data.filter(x => x.RowData.Data.length > 0);
            await this.DispatchCustomEvent(this.Meta.Events, "onsave", this, gridItem)
            Spinner.AppendTo(this.Element);
            const valid = await this.IsFormValid();
            if (!valid) {
                Spinner.Hide();
                return false;
            }
            let dirtyPatch = [];
            Object.getOwnPropertyNames(this.Entity).forEach(x => {
                if (this.Entity[x] instanceof Array || (this.Entity[x] instanceof Object && !(this.Entity[x] instanceof Decimal))) {
                    return;
                }

                let val;
                if (typeof this.Entity[x] === "boolean") {
                    val = this.Entity[x] ? "1" : "0";
                } else {
                    val = this.Entity[x];
                }

                let pat = {
                    Label: x,
                    Field: x,
                    OldVal: null,
                    Value: val,
                };
                dirtyPatch.push(pat);
            });

            var deletePatch = [];
            var patchModels = gridItem.map(item => {
                var rowData = item.AllListViewItem.flatMap(x => x.Entity);
                /**
                 * @type {object[]}
                 */
                var itemEntity = rowData.map((de) => {
                    let dirtyPatch = [];
                    Object.getOwnPropertyNames(de).forEach(x => {
                        if (de[x] instanceof Array || (de[x] instanceof Object && !(de[x] instanceof Decimal) && !(de[x] instanceof Date))) {
                            return;
                        }

                        let val;
                        if (typeof de[x] === "boolean") {
                            val = de[x] ? "1" : "0";
                        } else {
                            val = de[x];
                        }

                        let pat = {
                            Label: x,
                            Field: x,
                            OldVal: null,
                            Value: val,
                        };
                        dirtyPatch.push(pat);
                    });
                    return {
                        Changes: dirtyPatch,
                        Table: item.Meta.RefName,
                        ComId: item.Meta.Id
                    }
                });
                if (item.DeleteTempIds && item.DeleteTempIds.length > 0) {
                    deletePatch.push({
                        Table: item.Meta.RefName,
                        Ids: item.DeleteTempIds
                    });
                }
                return itemEntity;
            });
            let patchModel = {
                Changes: dirtyPatch,
                Table: this.Meta.EntityId,
                Detail: patchModels,
                Delete: deletePatch
            };
            const rs = await Client.Instance.PatchAsync(patchModel);
            if (rs.status == 200) {
                var codeEditor = this.ChildCom.filter(x => x.ComponentType == "CodeEditor");
                codeEditor.forEach(async item => {
                    if (rs.updatedItem[0][item.Meta.FieldName] == item.OldValue) {
                        return;
                    }
                    let dirtyPatch1 = [
                        {
                            Label: "Value",
                            Field: "Value",
                            OldVal: null,
                            Value: rs.updatedItem[0][item.Meta.FieldName],
                        },
                        {
                            Label: "OldValue",
                            Field: "OldValue",
                            OldVal: null,
                            Value: item.OldValue,
                        },
                        {
                            Label: this.IdField,
                            Field: this.IdField,
                            OldVal: null,
                            Value: Uuid7.NewGuid(),
                        },
                        {
                            Label: "ComponentId",
                            Field: "ComponentId",
                            OldVal: null,
                            Value: item.Meta.Id
                        },
                        {
                            Label: "RecordId",
                            Field: "RecordId",
                            OldVal: null,
                            Value: this.Entity.Id
                        }
                    ]
                    let patchModel1 = {
                        Changes: dirtyPatch1,
                        Table: item.Meta.RefName,
                    };
                    await Client.Instance.PatchAsync(patchModel1);
                })
                this.Entity = rs.updatedItem[0];
                this.Dirty = false;
                this.UpdateView(true);
                for (const grid of gridItem) {
                    grid.DeleteTempIds = [];
                    var dataItem = rs.Detail.filter(x => x.ComId == grid.Meta.Id)[0].Data;
                    await grid.LoadMasterData(dataItem);
                    grid.RowData.Data = dataItem;
                    for (const item of grid.AllListViewItem) {
                        var entity = dataItem.filter(x => item.EntityId.includes(x.Id))[0];
                        item.Entity = entity;
                        item.UpdateView(true);
                    }
                }
                Spinner.Hide();
                Toast.Success("Update success");
                return true;
            }
            return false;

        } catch (error) {
            Toast.Warning(error.message);
            Spinner.Hide();
            return false;
        }
    }
    /** @type {EditForm[]} */
    TabGroup = [];
    /** @type {import('./section.js')} */
    SectionMd;
    /**
     * Loads and renders features based on the current entity setup.
     * @param {Function} callback - Optional callback to run after loading and rendering.
     */
    async LoadFeatureAndRender(callback = null) {
        this.SectionMd = this.SectionMd || await import('./section.js');
        var feature = await ComponentExt.LoadFeature(this.entity);
        var entity = await this.LoadEntity();
        if (feature.ParentId) {
            var featureParent = await Client.Instance.GetByIdAsync("Feature", [feature.ParentId]);
            ComponentExt.AssignMethods(featureParent.data[0], this);
        }
        if (feature.Script) {
            ComponentExt.AssignMethods(feature, this);
        }
        this.LayoutLoaded(feature, callback, entity);
    }

    Render() {
        if (!this.Meta.Layout) {
            this.LoadFeatureAndRender();
        }
        else {
            if (!this.Element) {
                this.Element = this.ParentElement;
            }
            Html.Take(this.Element);
            Html.Instance.Clear();
            Html.Instance.Div.Render();
            this.Element = Html.Context;
            let root = createRoot(this.Element);
            let reactElement = React.createElement(this.Meta.Layout);
            root.render(reactElement);
            new Promise(resolve => setTimeout(resolve, 0)).then(() => {
                if (this.Meta.Javascript && !Utils.isNullOrWhiteSpace(this.Meta.Javascript)) {
                    try {
                        let fn = new Function(this.Meta.Javascript);
                        let obj = fn.call(null, this.EditForm);
                        for (let prop in obj) {
                            this[prop] = obj[prop].bind(this);
                        }
                    } catch (e) {
                        console.log(e.message);
                    }
                }
                EditForm.SplitChild(this.Element.children, null, this);
            });
            this.Focus();
        }
        this.LastForm = this;
    }
    /**
     * Focuses the tab editor component, updating the document title and potentially the URL.
     */
    Focus() {
        if (!this.Popup) {
            if (!this._li) {
                this._li = ChromeTabs.addTab({
                    title: this.Meta.Title == null ? this.TabTitle : this.Title,
                    favicon: this.Meta.Icon == null ? this.Meta.Icon : this.Icon,
                    content: this,
                })
            }
            EditForm.Tabs.forEach(x => x.Show = false);
            if (this.FeatureName) {
                this.Href = Client.BaseUri + '/#/' + this.FeatureName + (this.EntityId ? `?Id=${this.EntityId}` : '');
                window.history.pushState(null, LangSelect.Get(this.TabTitle), this.Href);
            }
        }
        this.Show = true;
        document.title = LangSelect.Get(this.TabTitle);
    }
    /**
     * 
     * @param {HTMLElement[]} hTMLElements 
     * @param {FeaturePolicy[]} allComPolicies 
     * @param {string} section 
     * @param {EditForm} editForm 
     * @returns 
     */
    static SplitChild(hTMLElements, section = "", editForm = null) {
        for (const eleChild of hTMLElements) {
            if (!Utils.isNullOrWhiteSpace(section)) {
                eleChild.setAttribute(section, "");
            }
            if (eleChild.dataset.name !== undefined) {
                const ui = editForm.Meta.Components.find(x => x.FieldName === eleChild.dataset.name);
                eleChild.removeAttribute("data-name");
                if (!ui || ui.Hidden) {
                    continue;
                }

                const component = ComponentFactory.GetComponent(ui, editForm, eleChild);
                if (component == null) return;
                // @ts-ignore
                if (component.IsListView) {
                    // @ts-ignore
                    editForm.ListViews.push(component);
                }
                component.ParentElement = eleChild;
                component.Entity = editForm.Entity;
                component.Render();
                if (editForm.ChildCom) {
                    const index = editForm.ChildCom.findIndex(x => x.Id === component.Id);
                    if (index !== -1) {
                        editForm.ChildCom[index] = component;
                    } else {
                        editForm.ChildCom.push(component);
                    }
                } else {
                    editForm.ChildCom = [component];
                }
                if (editForm.Children) {
                    const index = editForm.Children.findIndex(x => x.Id === component.Id);
                    if (index !== -1) {
                        editForm.Children[index] = component;
                    } else {
                        editForm.Children.push(component);
                    }
                } else {
                    editForm.Children = [component];
                }
                if (component instanceof EditableComponent) {
                    component.Disabled = ui.Disabled || editForm.Disabled || component.Disabled;
                }
                if (component.Element) {
                    if (ui.ChildStyle) {
                        const current = Html.Context;
                        Html.Take(component.Element).Style(ui.ChildStyle);
                        Html.Take(current);
                    }
                    if (ui.ClassName) {
                        component.Element.classList.add(ui.ClassName);
                    }

                    if (ui.Row === 1) {
                        component.ParentElement?.parentElement?.classList?.add("inline-label");
                    }
                }
                if (ui.Focus) {
                    component.Focus();
                }
            }
            if (eleChild.dataset.click !== undefined) {
                const eventName = eleChild.dataset.click;
                eleChild.removeAttribute("data-click");
                eleChild.addEventListener(EventType.Click, async () => {
                    let method = null;
                    method = editForm[eventName];
                    let task = null;
                    try {
                        await method.apply(this.EditForm, [this]);
                    } catch (ex) {
                        console.log(ex.message);
                        console.log(ex.stack);
                        throw ex;
                    }
                });
            }

            if (eleChild.children.length > 0) {
                EditForm.SplitChild(eleChild.children, section, editForm);
            }
        }
    }
    /**
     * Handles the loaded layout and setups the form with loaded features.
     * @param {Feature} feature - The loaded feature.
     * @param {object} entity - The entity data.
     * @param {Function} loadedCallback - Callback function to execute after loading.
     */
    LayoutLoaded(feature, loadedCallback = null, entity = null) {
        this.SetCurrentUserProperties();
        this.SetFeatureProperties(feature);
        if (entity != null) {
            this.Entity = entity;
        }
        const groupTree = this.BuildTree(feature.ComponentGroup.sort((a, b) => a.Order - b.Order));
        this.Element = this.RenderTemplate(null, feature);
        this.SetFeatureStyleSheet(feature.StyleSheet);
        this.Policies = feature.FeaturePolicies;
        this.RenderTabOrSection(groupTree, this);
        this.InitDOMEvents();
        loadedCallback?.call(null);
        this.DispatchFeatureEvent(feature.Events, EventType.DOMContentLoaded);
        this.Focus();
    }

    /**
     * Initializes DOM events for the form.
     */
    InitDOMEvents() {
        Html.Take(this.Element).TabIndex(-1).Trigger('focus')
            .Event(EventType.FocusIn, () => this.DispatchFeatureEvent(this.Meta.Events, EventType.FocusIn))
            .Event(EventType.FocusOut, () => this.DispatchFeatureEvent(this.Meta.Events, EventType.FocusOut));
        if (!this.Popup) {
            Html.Instance.ClassName("tab-item");
            if (Client.Instance.SystemRole) {
                Html.Instance.Context.addEventListener("contextmenu", (e) => this.SysConfigMenu(e, null, null, null));
            }
        }
    }

    /**
     * Sets the current user properties from the token.
     */
    SetCurrentUserProperties() {
        const token = Client.Token;
        this.currentUserId = token?.UserId;
        this.regionId = token?.RegionId;
        this.centerIds = token?.CenterIds ? token.CenterIds.join(Str.Comma) : Str.Empty;
        this.roleIds = token?.RoleIds ? token.RoleIds.join(Str.Comma) : Str.Empty;
        this.costCenterId = token?.CostCenterId;
        this.roleNames = token?.RoleNames ? token.RoleNames.join(Str.Comma) : Str.Empty;
    }

    BeforeSaved = new Action();
    AfterSaved = new Action();

    /**
     * Updates grids that are independent of the main form's entity.
     * @returns {PatchVM[]} List of Patch View Models.
     */
    UpdateIndependantGridView() {
        const dirtyGrid = this.GetDirtyGrid();
        if (!dirtyGrid.length) {
            return null;
        }
        return dirtyGrid.flatMap(grid => grid.GetPatches());
    }

    /**
     * Gets the list of grids that have unsaved changes.
     * @returns {ListView[]} Array of dirty list views.
     */
    GetDirtyGrid() {
        return this.ListViews
            .filter(grid => grid.Meta.Id && grid.Meta.CanAdd)
            .filter(grid => grid.FilterChildren(child => child.Dirty, child => !child.PopulateDirty).length > 0);
    }

    /**
     * Deletes data from temporary grids.
     */
    DeleteGridView() {
        const dirtyGrid = this.GetDeleteGrid();
        dirtyGrid.forEach(grid => {
            Client.Instance.HardDeleteAsync(grid.DeleteTempIds, grid.Meta.RefName, grid.DataConn, grid.MetaConn)
                .then(deleteSuccess => {
                    if (!deleteSuccess) {
                        Toast.Warning('Error deleting details, please check again');
                        return;
                    }
                    grid.RowAction(row => {
                        if (grid.DeleteTempIds.includes(row.EntityId)) {
                            row.Dispose();
                        }
                    });
                    grid.DeleteTempIds.Clear();
                });
        });
    }

    GetDeleteGrid() {
        return this.ListViews
            .filter(grid => grid.Meta.Id)
            .filter(grid => grid.DeleteTempIds.length > 0);
    }

    /**
     * Builds a tree structure from a list of components.
     * @param {Component[]} componentGroup - The list of components to build the tree from.
     * @returns {Component[]} - The root components of the built tree.
     */
    BuildTree(componentGroup) {
        const componentGroupMap = new Map(componentGroup.map(x => [x.Id, x]));
        let parent;

        for (const item of componentGroup) {
            if (item.IsVerticalTab && this.Element.clientWidth < EditableComponent.SmallScreen) {
                item.IsVerticalTab = false;
            }

            if (!item.ParentId) {
                continue;
            }

            if (!componentGroupMap.has(item.ParentId)) {
                console.log(`The parent key ${item.ParentId} of ${item.FieldName} doesn't exist`);
                continue;
            }

            parent = componentGroupMap.get(item.ParentId);

            if (!parent.Children) {
                parent.Children = [];
            }

            if (!parent.Children.includes(item)) {
                parent.Children.push(item);
            }

            item.Parent = parent;
        }

        for (const item of componentGroup) {
            if (!item.Children || !item.Children.length) {
                continue;
            }

            for (const ui of item.Children) {
                ui.ComponentGroup = item;
            }

            if (item.Children) {
                item.Children = item.Children.sort((a, b) => a.Order - b.Order);
            }
        }

        componentGroup.forEach(x => this.CalcItemInRow(x.Children.slice()));
        const res = componentGroup.filter(x => !x.ParentId);

        if (!res.length) {
            console.log("No component group is root component. Wrong feature name or the configuration is wrong");
        }

        return res;
    }

    /**
     * Calculates the number of items in each row of a component group.
     * @param {Component[]} componentGroup - The list of components in the group.
     */
    CalcItemInRow(componentGroup) {
        let cumulativeColumn = 0;
        let itemInRow = 0;
        let startRowIndex = 0;

        for (let i = 0; i < componentGroup.length; i++) {
            const group = componentGroup[i];
            const parentInnerCol = this.GetInnerColumn(group.Parent);
            const outerCol = this.GetOuterColumn(group);

            if (parentInnerCol <= 0) {
                continue;
            }

            itemInRow++;
            cumulativeColumn += outerCol;

            if (cumulativeColumn % parentInnerCol === 0) {
                let sameRow = i;
                while (sameRow >= startRowIndex) {
                    componentGroup[sameRow].ItemInRow = itemInRow;
                    sameRow--;
                }
                itemInRow = 0;
                startRowIndex = i;
            }
        }
    }

    /**
     * Calculates the appropriate column width based on the component group and screen width.
     * @param {Component} group - The component group to evaluate.
     * @returns {number} The number of columns the component should span.
     */
    GetInnerColumn(group) {
        if (!group) return 0;

        const screenWidth = this.Element.clientWidth;
        let res;

        if (screenWidth < EditableComponent.ExSmallScreen && group.XsCol > 0) {
            res = group.XsCol;
        } else if (screenWidth < EditableComponent.SmallScreen && group.SmCol > 0) {
            res = group.SmCol;
        } else if (screenWidth < EditableComponent.MediumScreen && group.Column > 0) {
            res = group.Column;
        } else if (screenWidth < EditableComponent.LargeScreen && group.LgCol > 0) {
            res = group.LgCol;
        } else if (screenWidth < EditableComponent.ExLargeScreen && group.XlCol > 0) {
            res = group.XlCol;
        } else {
            res = group.XxlCol || group.Column;
        }

        return res || 0;
    }

    /**
     * Calculates the appropriate outer column width based on the component group and screen width.
     * @param {Component} group - The component group to evaluate.
     * @returns {number} The number of columns including the outer margin/padding.
     */
    GetOuterColumn(group) {
        if (!group) return 0;

        const screenWidth = this.Element.clientWidth;
        let res;

        if (screenWidth < EditableComponent.ExSmallScreen && group.XsOuterColumn > 0) {
            res = group.XsOuterColumn;
        } else if (screenWidth < EditableComponent.SmallScreen && group.SmOuterColumn > 0) {
            res = group.SmOuterColumn;
        } else if (screenWidth < EditableComponent.MediumScreen && group.OuterColumn > 0) {
            res = group.OuterColumn;
        } else if (screenWidth < EditableComponent.LargeScreen && group.LgOuterColumn > 0) {
            res = group.LgOuterColumn;
        } else if (screenWidth < EditableComponent.ExLargeScreen && group.XlOuterColumn > 0) {
            res = group.XlOuterColumn;
        } else {
            res = group.XxlOuterColumn || group.OuterColumn;
        }

        return res || 0;
    }

    /**
     * Binds the template with components.
     * @param {HTMLElement} ele - The HTML element to bind.
     * @param {EditableComponent} parent - The parent component.
     * @param {object} entity - The entity object.
     * @param {Function} [factory] - The factory function to create components.
     * @param {Set<HTMLElement>} [visited] - The set of visited elements.
     */
    BindingTemplate(ele, parent, entity = null, factory = null, visited = new Set()) {
        if (!ele || visited.has(ele)) {
            return;
        }
        visited.add(ele);
        if (ele.children.length === 0 && this.RenderCellText(ele, entity) !== null) {
            return;
        }
        const meta = this.ResolveMeta(ele);
        const newCom = factory ? factory(ele, meta, parent, entity) : this.BindingCom(ele, meta, parent, entity);
        parent = newCom instanceof this.SectionMd.Section ? newCom : parent;
        // @ts-ignore
        ele.children.forEach(child => this.BindingTemplate(child, parent, entity, factory, visited));
    }

    /**
     * Resolves meta information for an HTML element.
     * @param {HTMLElement} ele - The HTML element.
     * @returns {Component} - The resolved component.
     */
    ResolveMeta(ele) {
        /** @type {Component} */
        let component = new Component();
        const id = ele.dataset[this.IdField.toLowerCase()];
        if (id) {
            component = this.AllCom.find(x => x.Id === id);
        }
        for (const prop of Object.getOwnPropertyNames(Component.prototype)) {
            const value = ele.dataset[prop.toLowerCase()];
            if (!value) {
                continue;
            }
            let propVal = null;
            try {
                propVal = typeof component[prop] === 'string' ? value : JSON.parse(value);
                component = component || new Component();
                component[prop] = propVal;
            } catch {
                continue;
            }
        }
        return component;
    }

    /**
     * Renders the text content of a cell.
     * @param {HTMLElement} ele - The HTML element.
     * @param {object} entity - The entity object.
     * @returns {Label} - The rendered label if applicable, otherwise null.
     */
    RenderCellText(ele, entity) {
        const text = ele.textContent.trim();
        if (text && text.startsWith("{") && text.endsWith("}")) {
            /** @type {Component} */
            // @ts-ignore
            const meta = {
                FieldName: text.slice(1, -1)
            };
            const cellText = new Label(meta, ele);
            cellText.Entity = entity;
            if (EditForm.LayoutForm) {
                EditForm.LayoutForm.AddChild(cellText);
            } else {
                cellText.Render();
            }
            return cellText;
        }
        return null;
    }

    static GetFeatureNameFromUrl() {
        let builder = new StringBuilder();
        let feature = window.location.pathname.toLowerCase().replace(Client.BaseUri.toLowerCase(), "");
        if (feature.startsWith(Utils.Slash)) {
            feature = feature.substring(1);
        }
        if (!feature.trim()) {
            return null;
        }
        for (let i = 0; i < feature.length; i++) {
            if (feature[i] === '?' || feature[i] === '#') break;
            builder.Append(feature[i]);
        }
        return builder.toString();
    }

    ShouldLoadEntity = false;
    get EntityName() { return this.Meta.EntityName; }
    /**
     * Loads the entity based on the URL or the given entity ID.
     * @returns {Promise<object>} A promise that resolves to the loaded entity object.
     */
    async LoadEntity() {
        const urlFeature = EditForm.GetFeatureNameFromUrl();
        const urlId = urlFeature === this.FeatureName ? Utils.GetUrlParam(Utils.IdField) : this.EntityId;
        if (!this.ShouldLoadEntity || !urlId) {
            return null;
        }
        try {
            const ds = await Client.Instance.GetByIdAsync(this.EntityName, this.DataConn, [urlId]);
            if (!ds) {
                return null;
            }
            this.Entity = ds[0];
            return ds[0];
        } catch (error) {
            console.error("Failed to load entity:", error);
            return null;
        }
    }

    /**
     * Locks updates if the user does not have permission.
     */
    LockUpdate() {
        this.Meta.FeaturePolicy = this.Meta.FeaturePolicy ?? this.Meta.FeaturePolicies;
        const generalRule = this.Meta.FeaturePolicy.filter(x => x.RecordId);
        const noPermission = (!this.Meta.IsPublic &&
            (!Utils.IsOwner(this.Entity)) && generalRule.every(x => !x.CanWrite && !x.CanWriteAll));
        if (noPermission) {
            this.LockUpdateButCancel();
        }
    }

    /**
     * Locks all updates except for the cancel operation.
     */
    LockUpdateButCancel() {
        this.Disabled = true;
        this.SetDisabled(false, EditForm.BtnCancel);
    }

    /** @type {HTMLElement} */
    IconElement = null;
    /** @type {HTMLElement} */
    TitleElement = null;

    get Icon() {
        return this._icon;
    }

    set Icon(value) {
        this._icon = value;
        if (this.IconElement !== null) {
            Html.Take(this.IconElement).IconForSpan(value);
        }
    }

    get Title() {
        return this._title;
    }

    set Title(value) {
        this._title = value;
        if (this.TitleElement !== null) {
            this.TitleElement.innerHTML = ''; // clear inner HTML
            Html.Take(this.TitleElement).IText(value);
        }
    }
    /** @type {HTMLElement} */
    PopupContent;
    /**
     * Sets feature properties such as title and icon based on the provided feature object.
     * @param {Feature} feature - The feature to set properties from.
     */
    SetFeatureProperties(feature) {
        if (!feature) return;
        this.Meta = feature;
        if (feature.ClassName) {
            this.Element.classList.add(feature.ClassName);
        }
        if (!this.Icon) {
            this.Icon = feature.Icon;
        }
        if (!this.Title) {
            this.Title = feature.Label;
        }
        if (this.PopupContent) {
            this.PopupContent.style.cssText = feature.Style;
        }
    }

    /**
     * Sets the stylesheet for the feature if provided.
     * @param {string} styleSheet - The stylesheet to apply.
     */
    SetFeatureStyleSheet(styleSheet) {
        if (!styleSheet) return;
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(styleSheet));
        style.setAttribute('source', 'feature');
        this.Element.appendChild(style);
    }

    /**
     * Renders tabs or sections based on the component group structure.
     * @param {Component[]} componentGroup - The components to render.
     */
    RenderTabOrSection(componentGroup, editForm) {
        if (!editForm.EditForm) {
            editForm.EditForm = editForm;
        }
        componentGroup.sort((a, b) => a.Order - b.Order).forEach(group => {
            group.Disabled = this.Disabled || group.Disabled;
            if (group.IsTab) {
                this.SectionMd.Section.RenderTabGroup(editForm ?? this, group);
            } else {
                this.SectionMd.Section.RenderSection(editForm ?? this, group);
            }
        });
    }

    /**
     * Ensures the feature's events are dispatched to the DOM.
     * @param {object} events - Events to be dispatched.
     * @param {string} eventType - Type of the event.
     */
    DispatchFeatureEvent(events, eventType) {
        // Example dispatch, needs specific implementation
        if (events && events[eventType]) {
            const event = new CustomEvent(eventType, { detail: this.Entity });
            this.Element.dispatchEvent(event);
        }
    }

    /**
     * Renders a template based on the feature configuration.
     * @param {Component} feature - The feature configuration.
     * @returns {HTMLElement} The rendered template element.
     */
    RenderTemplate(layout, feature) {
        let entryPoint = document.getElementById(EditForm.SpecialEntryPoint) || document.getElementById("template") || this.Element;
        if (this.ParentForm && this.Portal) {
            this.ParentForm.Element = null;
            this.ParentForm.Dispose();
            this.ParentForm = null;
        }
        entryPoint.innerHTML = Str.Empty;
        if (feature.Template) {
            entryPoint.innerHTML = feature.Template;
            this.BindingTemplate(entryPoint, this);
            const innerEntry = Array.from(entryPoint.querySelectorAll("[id='inner-entry']")).shift();
            this.ResetEntryPoint(innerEntry);
            // @ts-ignore
            entryPoint = innerEntry || entryPoint;
            if (entryPoint.style.display === 'none') {
                entryPoint.style.display = Str.Empty;
            }
        }
        return entryPoint;
    }

    /**
     * Resets the entry point for rendering.
     * @param {Element} entryPoint - The entry point to reset.
     */
    ResetEntryPoint(entryPoint) {
        if (entryPoint) {
            entryPoint.innerHTML = Str.Empty;
        }
    }

    /**
     * Binds a component to an HTML element.
     * @param {HTMLElement} ele - The element to bind to.
     * @param {Component} com - The component metadata.
     * @param {EditableComponent} parent - The parent component.
     * @param {object} entity - The entity to bind to.
     * @returns {EditableComponent|undefined} The bound component, or undefined if not applicable.
     */
    BindingCom(ele, com, parent, entity) {
        if (!ele || !com || !com.ComponentType) {
            return null;
        }
        let child = null;
        if (com.ComponentType === ComponentType.Section) {
            child = new this.SectionMd.Section(null, ele);
            child.Meta = com;
            child.Meta = com;
        } else {
            child = ComponentFactory.GetComponent(com, this, ele);
        }
        if (!child) return null;
        child.ParentElement = child.ParentElement || ele;
        child.Entity = entity || child.EditForm?.Entity || this.Entity;
        parent.AddChild(child);
        return child;
    }

    /**
     * Cancels the current form action, with a dirty check.
     */
    Cancel() {
        this.DirtyCheckAndCancel();
    }

    /**
     * Cancels the current form action without asking, directly disposing of the form.
     */
    CancelWithoutAsk() {
        this.Dispose();
    }

    /**
     * Checks if the form is dirty before cancelling. Optionally provides a callback to execute after cancellation.
     * @param {Function|null} closeCallback - Optional callback to execute after closing.
     */
    DirtyCheckAndCancel(closeCallback = null) {
        if (!this.Dirty) {
            this.Dispose();
            if (closeCallback && closeCallback instanceof Function) closeCallback();
            return;
        }

        // Confirm dialog setup assumed
        const confirm = new ConfirmDialog();
        confirm.Content = "Do you want to save changes before closing?";
        confirm.PElement = this.Element;
        confirm.YesConfirmed.add(() => {
            this.SavePatch().then((rs) => {
                if (rs.status == 200) {
                    this.Dispose();
                    if (closeCallback && closeCallback instanceof Function) closeCallback();
                }
            });
        });
        confirm.NoConfirmed = () => {
            this.Dispose();
            if (closeCallback && closeCallback instanceof Function) closeCallback();
        };
        confirm.IgnoreCancelButton = true;
        confirm.Render();
    }

    /**
     * Disposes the form, removing it from the DOM and cleaning up resources.
     */
    Dispose() {
        super.Dispose();
    }

    /**
     * Validates the entire form or specific components within it.
     * @param {boolean} showMessage - Whether to show validation messages.
     * @param {(item: EditableComponent) => boolean} predicate - Function to determine which components to validate.
     * @param {(item: EditableComponent) => boolean} ignorePredicate - Function to determine which components to ignore.
     * @returns {Promise<boolean>} A promise that resolves to the validation status of the form.
     */
    async IsFormValid(showMessage = true, predicate = null, ignorePredicate = null) {
        predicate = predicate || ((x) => x.Children.length === 0 && !x.Disabled);
        ignorePredicate = ignorePredicate || ((x) => x.AlwaysValid || x.EmptyRow);

        const validationPromises = this.FilterChildren(predicate, ignorePredicate).map(x => {
            return { IsValid: x.ValidateAsync(), com: x }
        });
        await Promise.all(validationPromises.map(x => x.IsValid));
        const invalidComponents = validationPromises.filter(result => !result.com.IsValid).map(x => x.com);

        if (invalidComponents.length > 0) {
            if (showMessage) {
                invalidComponents.forEach(comp => { comp.Disabled = false; });
                const firstInvalid = invalidComponents[0];
                firstInvalid.Focus();
                invalidComponents.forEach(x => {
                    Toast.Warning(x.ValidationResult.required);
                })
            }
            return false;
        }
        return true;
    }

    /**
     * Prints the contents of a selected HTML element.
     * @param {string} selector - The CSS selector to identify the printable area.
     */
    Print(selector = ".printable") {
        const printableArea = this.Element.querySelector(selector);
        if (printableArea) {
            const printWindow = window.open(Str.Empty, '_blank');
            printWindow.document.write(printableArea.innerHTML);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }

    /**
     * Sends an email with a PDF attachment generated from the selected HTML content.
     * @param {EmailVM} email - The email view model containing details about the email to be sent.
     * @param {string[]} pdfSelector - Array of CSS selectors identifying the content to convert into PDF.
     * @returns {Promise<boolean>} A promise that resolves to the success status of the email operation.
     */
    async EmailPdf(email, pdfSelector = []) {
        if (!email) throw new Error("EmailVM must not be null.");

        const pdfContents = pdfSelector.map(selector => {
            /** @type {HTMLElement} */
            const element = this.Element.querySelector(selector);
            return this.PrintSection(element, false);
        });

        email.PdfText = email.PdfText.concat(pdfContents);

        try {
            const success = await Client.Instance.PostAsync(email, "/user/EmailAttached");
            Toast.Success("Email sent successfully!");
            return success;
        } catch (error) {
            Toast.Error("Error while sending email: " + error.message);
            throw error;
        }
    }

    /**
     * Prints the content of an HTML element, optionally in a new window, and can handle print previews.
     * @param {HTMLElement} ele - The HTML element to print.
     * @param {boolean} openWindow - Whether to open a new window for printing.
     * @param {Array<string>} styles - CSS styles to apply when printing.
     * @param {boolean} printPreview - Whether to show a print preview before printing.
     * @param {Component} component - The component containing additional data for printing.
     * @returns {string} The inner HTML of the element, or null if the element is null.
     */
    PrintSection(ele, openWindow = true, styles = null, printPreview = false, component = null) {
        if (!ele) {
            return null;
        }
        if (!openWindow) {
            return ele.innerHTML; // Directly return the HTML if not opening a new window
        }

        const printWindow = window.open("", "_blank");
        printWindow.document.body.innerHTML = ele.innerHTML;

        if (styles && styles.length) {
            const styleEl = printWindow.document.createElement("style");
            styleEl.innerHTML = styles.join(" ");
            printWindow.document.head.appendChild(styleEl);
        }

        if (printPreview) {
            setTimeout(() => {
                printWindow.addEventListener("beforeprint", (e) => {
                    if (component && component.Style) {
                        const pageStyle = printWindow.document.createElement("style");
                        pageStyle.innerHTML = component.Style;
                        printWindow.document.head.appendChild(pageStyle);
                    }
                });

                printWindow.print();

                printWindow.addEventListener("afterprint", async (e) => {
                    if (component && component.Events && component.Events.AfterPrint) {
                        await this.DispatchEvent(component.Events.AfterPrint, "afterprint", this, this.Entity);
                    }
                    printWindow.close();
                });

                // Additional listeners to close the window if any interaction happens
                printWindow.addEventListener("mousemove", () => printWindow.close());
                printWindow.addEventListener("click", () => printWindow.close());
                printWindow.addEventListener("keyup", (event) => {
                    if (event.key === "Escape") {
                        printWindow.close();
                    }
                });

            }, 250); // Delay to ensure the window is ready
        } else {
            printWindow.print();
            printWindow.close();
        }

        return ele.innerHTML;
    }

    /** @type {FeaturePolicy[]} */
    Policies = [];
    /**
     * @param {string | any[]} recordIds
     */
    GetGridPolicies(recordIds, entityName = "Component") {
        recordIds = recordIds ?? Client.Token.RoleIds;
        const hasHidden = this.Policies
            .filter(x => x.RoleId || (x.UserId && Client.Token.UserId == x.UserId))
            .filter(x => x.EntityName == entityName && recordIds.includes(x.RecordId));
        return hasHidden;
    }


    GetDefaultGridPolicies() {
        var hasHidden = this.Policies
            .filter(x => x.RoleId == null ||
                (Client.Token != null && x.RoleId && Client.Token.RoleIds.includes(x.RoleId)) || (x.UserId && Client.Token.UserId == x.UserId));
        return hasHidden;
    }


    /**
     * Deletes the entity associated with the form.
     */
    Delete() {
        const confirm = new ConfirmDialog();
        confirm.PElement = this.Element;
        confirm.Content = "Are you sure you want to delete this?";
        confirm.YesConfirmed = async () => {
            try {
                const success = await Client.Instance.HardDeleteAsync([this.EntityId], this.Meta.EntityName, this.DataConn, this.MetaConn);
                if (success) {
                    Toast.Success("Data deleted successfully");
                    this.ParentForm?.UpdateView();
                    this.Dispose();
                } else {
                    Toast.Warning("An error occurred while deleting data");
                }
            } catch (error) {
                Toast.Warning("An error occurred: " + error.message);
            }
        };
        confirm.Render();
    }

    /**
     * Handles the signing in process.
     */
    SignIn() {
        Client.UnAuthorizedEventHandler?.call(null);
    }

    /** @type {WebSocketClient} */
    static NotificationClient;
    /**
     * Handles the signing out process.
     */
    SignOut() {
        const e = window.event;
        e.preventDefault();
        Client.Instance.PostAsync(Client.Token, "user/SignOut")
            .then(success => {
                Toast.Success("You have successfully signed out!");
                Client.SignOutEventHandler?.call();
                Client.Token = null;
                EditForm.NotificationClient?.Close();
                window.location.reload();
            }).catch(error => {
                Toast.Warning("Error during sign out: " + error.message);
            });
    }

    /**
     * Retrieves security policies for a specific record or set of records.
     * @param {string|string[]} recordIds - The record ID or IDs to fetch policies for.
     * @param {string} entityName - The name of the entity.
     * @returns {FeaturePolicy[]} Array of applicable feature policies.
     */
    GetElementPolicies(recordIds, entityName = 'Component') {
        return Array.isArray(recordIds)
            ? this.Policies.filter(policy => policy.EntityName === entityName && recordIds.includes(policy.RecordId))
            : this.Policies.filter(policy => policy.EntityName === entityName && policy.RecordId === recordIds);
    }

    _componentCoppy;
    /**
     * Copies a component for later use.
     * @param {object} arg - The component to copy.
     */
    CopyComponent(arg) {
        this._componentCoppy = new Component();
        this._componentCoppy.CopyPropFrom(arg);
    }

    /**
     * Dynamically adds a new component to the form based on user actions.
     * @param {object} arg - Contains details on the action to perform and the group to which the component will be added.
     */
    AddComponent(arg) {
        /** @type {string} */
        const action = arg.action;
        /** @type {Component} */
        const group = arg.group;
        /** @type {Component} */
        // @ts-ignore
        const com = {
            ComponentType: action,
            ComponentGroupId: group.Id,
            Label: "New Component",
            Visibility: true,
            Order: group.Children?.length ? Math.max(...group.Children.map(c => c.Order)) + 1 : 0
        };

        const data = ComponentExt.MapToPatch(com, 'Component');
        // Assume an API or service is available to save the new component
        // @ts-ignore
        Client.Instance.PatchAsync(data).then(() => {
            group.Children.push(com);
            this.UpdateRender(com, group);
            Toast.Success("Component added successfully!");
        }).catch(error => {
            Toast.Error("Error adding component: " + error.message);
        });
    }

    /**
     * Updates the rendering of components within the form.
     * @param {Component} component - The new component to render.
     * @param {Component} group - The group to which the component belongs.
     */
    UpdateRender(component, group) {
        const section = this.FindComponentByName(group.FieldName);
        const childComponent = ComponentFactory.GetComponent(component, this);
        if (childComponent) {
            childComponent.ParentElement = section.Element;
            section.AddChild(childComponent);
        }
    }

    /** @type {EditableComponent} */
    CtxCom;
    /**
     * 
     * @param {Event} e 
     * @param {Component} component 
     * @param {Component} group 
     * @param {EditableComponent} ctx 
     * @returns 
     */
    SysConfigMenu(e, component, group, ctx) {
        e.preventDefault();
        e.stopPropagation();
        this.CtxCom = ctx;
        const metaPermission = this.Policies.some(x => x.CanWriteMeta || x.CanWriteMetaAll);
        if (!metaPermission) {
            return;
        }
        const ctxMenu = ContextMenu.Instance;
        ctxMenu.Top = e.Top();
        ctxMenu.Left = e.Left();
        ctxMenu.MenuItems = [];
        if (component !== null) {
            ctxMenu.MenuItems.push({ Icon: "fal fa-cog", Text: "Component Properties", Click: this.ComponentProperties.bind(this), Parameter: component });
        }
        if (group !== null) {
            ctxMenu.MenuItems.push({ Icon: "fal fa-cogs", Text: "Section Properties", Click: this.SectionProperties.bind(this), Parameter: group });
        }
        ctxMenu.MenuItems.push({ Icon: "fal fa-folder-open", Text: "Screen Properties", Click: this.FeatureProperties.bind(this) });
        ctxMenu.MenuItems.push({ Icon: "fal fa-plus-octagon", Text: "Add Screen", Click: this.AddProperties.bind(this) });
        ctxMenu.MenuItems.push({ Icon: "fal fa-table", Text: "Table Manage", Click: this.TableManageProperties.bind(this) });
        ctxMenu.Render();
    }

    async SectionProperties(group) {
        const instanse = await import('./forms/sectionEditor.js');
        const editor = new instanse.SectionEditor("section-editor");
        editor.Name = "section-editor";
        editor.ParentElement = this.Element;
        editor.Entity = group;
        // @ts-ignore
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    async AddProperties() {
        var instanse = await import('./forms/featureEditor.js');
        const editor = new instanse.FeatureEditor("feature-editor");
        editor.Name = "feature-editor";
        editor.ParentElement = this.Element;
        var entity = new Feature();
        entity.IsMenu = true;
        editor.Entity = entity;
        // @ts-ignore
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    async FeatureProperties() {
        var instanse = await import('./forms/featureEditor.js');
        const editor = new instanse.FeatureEditor("feature-editor");
        editor.Name = "feature-editor";
        editor.ParentElement = this.Element;
        editor.Entity = this.Meta;
        // @ts-ignore
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    async TableManageProperties() {
        await this.OpenPopup("table-manage", null);
    }

    async ComponentProperties(component) {
        const md = await import('./forms/componentEditor.js');
        const editor = new md.ComponentEditor("component-editor");
        editor.Name = "component-editor";
        editor.ParentElement = this.Element;
        editor.Entity = component;
        // @ts-ignore
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    /**
     * Clones a feature by prompting the user for confirmation and then executing a clone operation.
     * @param {Object} ev - The event object which should contain a feature to clone.
     */
    CloneFeature(ev) {
        const feature = ev;
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Content = "Do you want to clone this feature?",
            confirmDialog.Title = "Confirm";

        confirmDialog.YesConfirmed = () => {
            /** @type {SqlViewModel} */
            // @ts-ignore
            const sql = {
                ComId: "Feature",
                Action: "Clone",
                Ids: [feature.Id],
                MetaConn: this.MetaConn,
                DataConn: this.DataConn
            };
            Client.Instance.UserSvc(sql).Done();
        };

        this.AddChild(confirmDialog);
    }

    async OpenPopup(featureName, entity) {
        if (!entity) {
            entity = {
                Id: Uuid7.NewGuid()
            }
        }
        else if (!entity.Id) {
            entity.Id = Uuid7.NewGuid();
        }
        import('./popupEditor.js').then((instanse) => {
            const popup = new instanse.PopupEditor(featureName);
            popup.Entity = entity;
            popup.ParentElement = this.TabEditor ? this.TabEditor.Element : this.Element;
            popup.OpenFrom = this;
            popup.Name = featureName;
            this.AddChild(popup);
        })
    }

    /**
     * @param {Function} yesConfirmed
     * @param {Function} noConfirmed
     * @param {string} title
     */
    async OpenConfirmDialog(yesConfirmed, noConfirmed, title) {
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = title;
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.Render();
        confirmDialog.YesConfirmed.add(yesConfirmed);
        confirmDialog.NoConfirmed.add(noConfirmed);
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.ChildCom.filter(x => !x.IsListView).forEach(child => {
            child.PrepareUpdateView(force, dirty);
            child.Entity = this.Entity;
            child.UpdateView(force, dirty, ...componentNames);
        });
        this.ChildCom.filter(x => x.IsListView && !x.Meta.IsRealtime && x.Dirty).forEach(/**@param {GridView} child **/ child => {
            child.PrepareUpdateView(force, dirty);
            child.ActionFilter();
        });
    }
}