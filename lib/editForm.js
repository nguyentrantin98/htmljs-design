import React from "react";
import { createRoot } from 'react-dom/client';
import { Utils } from "./utils/utils.js";
import { EditableComponent } from "./editableComponent.js";
import { ComponentExt } from './utils/componentExt.js';
import { Html } from "./utils/html.js";
import { Client } from "./clients/";
import { Str } from "./utils/ext.js";
import {
    EmailVM, ComponentType, FeaturePolicy, Action, PatchDetail,
    PatchVM, Feature, EventType, Component, SavePatchVM,
} from "./models/";
import { Message } from "./utils/message.js";
import { StringBuilder } from "./utils/stringBuilder.js";
import { ComponentFactory } from "./utils/componentFactory.js";
import { Toast } from "./toast.js";
import { Label } from "./label.js";
import { ConfirmDialog } from "./confirmDialog.js";
import { WebSocketClient } from "./clients/websocketClient.js";
import { ContextMenu } from "./contextMenu.js";
import Decimal from "decimal.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { GridView } from "./gridView.js";
import { Spinner } from "./spinner.js";
import { LangSelect } from "./utils/langSelect.js";
import { ChromeTabs } from "./chrometab.js";
import { TabComponent } from "./tabComponent.js";
import { TabEditor } from "./index.js";
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
    /** @type {EditForm} */
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
                Value: value?.toString().trim(),
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

    IsArrayOfSavePatchVM(x) {
        if (!Array.isArray(x)) {
            return false;
        }
        return x.every(item => item instanceof SavePatchVM);
    }

    async ApplyChanges() {
        /** @type {GridView[]}*/
        var data = this.ChildCom.filter(x => x.IsListView && x.Meta.Editable && !x.Meta.IsRealtime);
        /**  @type {GridView[]}  */
        var gridItem = data.filter(x => x.RowData.Data.length > 0);
        await this.DispatchCustomEvent(this.Meta.Events, "onsave", this, gridItem);
        Spinner.AppendTo(this.Element);
        const valid = await this.IsFormValid();
        if (!valid) {
            Spinner.Hide();
            return false;
        }
        var patchModels = gridItem.map(item => {
            var deletePatch = [];
            var rowData = item.AllListViewItem.flatMap(x => x.Entity);
            /**
             * @type {object[]}
             */
            var itemEntity = rowData.map((row) => {
                let dirtyPatchDetail = [];
                Object.getOwnPropertyNames(row).forEach(cell => {
                    if (row[cell] instanceof Array || (row[cell] instanceof Object && !(row[cell] instanceof Decimal) && !(row[cell] instanceof Date))) {
                        return;
                    }
                    let val;
                    if (typeof row[cell] === "boolean") {
                        val = row[cell] ? "1" : "0";
                    } else {
                        val = row[cell];
                    }

                    let patchDetail = new PatchDetail();
                    patchDetail.Label = cell;
                    patchDetail.Field = cell;
                    patchDetail.OldVal = null;
                    patchDetail.Value = val;
                    dirtyPatchDetail.push(patchDetail);
                });
                var patch = new SavePatchVM();
                patch.Changes = dirtyPatchDetail;
                patch.Table = item.Meta.RefName;
                patch.ComId = item.Meta.Id;
                return patch;
            });
            if (item.DeleteTempIds && item.DeleteTempIds.length > 0) {
                deletePatch.push({
                    Table: item.Meta.RefName,
                    Ids: item.DeleteTempIds
                });
            }
            let patchModel = new SavePatchVM();
            patchModel.Changes = itemEntity;
            patchModel.Table = item.Meta.RefName;
            patchModel.Delete = deletePatch;
            return patchModel;
        });
        this.Entity.RelationshipDetail = patchModels;
        this.Dirty = false;
        this.Dispose();
    }

    GetPatchVM() {
        var gridItem = this.ChildCom.filter(x => x.IsListView && x.Meta.Editable && !x.Meta.IsRealtime);
        let dirtyPatch = [];
        Object.getOwnPropertyNames(this.Entity).forEach(cell => {
            if (this.Entity[cell] instanceof Array || (this.Entity[cell] instanceof Object && !(this.Entity[cell] instanceof Decimal)) || cell == this._groupKey) {
                return;
            }
            let val;
            if (typeof this.Entity[cell] === "boolean") {
                val = this.Entity[cell] ? "1" : "0";
            } else {
                val = this.Entity[cell];
            }
            let patchDetail = new PatchDetail();
            patchDetail.Label = cell;
            patchDetail.Field = cell;
            patchDetail.OldVal = null;
            patchDetail.Value = val;
            var component = this.ChildCom.find(x => x.Meta.FieldName == cell)
            if (component) {
                let text = component.GetValueText();
                let actText = Utils.isNullOrWhiteSpace(text) ? 'N/A' : text;
                let oldText = Utils.isNullOrWhiteSpace(component.OriginalText) ? 'N/A' : component.OriginalText;
                if (actText != oldText) {
                    patchDetail.HistoryValue = `${component.Meta.Label}: ${oldText} => ${actText}`;
                }
            }
            dirtyPatch.push(patchDetail);
        });

        var deletePatch = [];
        var patchModels = gridItem.map(item => {
            if (item.DeleteTempIds && item.DeleteTempIds.length > 0) {
                deletePatch.push({
                    Table: item.Meta.RefName,
                    Ids: item.DeleteTempIds
                });
            }
            if (item.AllListViewItem && item.AllListViewItem.length > 0) {
                var allItem = item.AllListViewItem.filter(x => !x.GroupRow);
                allItem.forEach(it => {
                    var multiples = it.Children.filter(x => x.IsMultiple);
                    var currency = it.Children.find(x => x.IsSearchEntry && x.Meta.FieldName == "CurrencyId");
                    if (currency) {
                        it.Entity.ExchangeRateVND = EditableComponent.ExchangeRateVND[currency.GetValueText()] || 1;
                        it.Entity.ExchangeRateUSD = EditableComponent.ExchangeRateUSD[currency.GetValueText()] || 1;
                    }
                    if (multiples && multiples.length > 0) {
                        multiples.forEach(item1 => {
                            it.Entity[item1.Meta.FieldName + "Text"] = item1.MatchedItems && item1.MatchedItems.length > 0 ? item1.MatchedItems.map(item2 => item1.GetMatchedText(item2)).join(item1.Meta.GroupFormat || ',') : null;
                        })
                    }
                })
                var rowData = allItem;
                /**
                 * @type {object[]}
                 */
                var itemEntity = rowData.map((rowItem) => {
                    var row = rowItem.Entity;
                    let dirtyPatchDetail = [];
                    Object.getOwnPropertyNames(row).forEach(cell => {
                        if (row[cell] instanceof Array || (row[cell] instanceof Object && !(row[cell] instanceof Decimal) && !(row[cell] instanceof Date)) || cell == this._groupKey) {
                            return;
                        }
                        let val;
                        if (typeof row[cell] === "boolean") {
                            val = row[cell] ? "1" : "0";
                        } else {
                            val = row[cell];
                        }

                        let patchDetail = new PatchDetail();
                        patchDetail.Label = cell;
                        patchDetail.Field = cell;
                        patchDetail.OldVal = null;
                        patchDetail.Value = val;
                        var component = rowItem.Children.find(x => x.Meta.FieldName == cell)
                        if (component) {
                            let text = component.GetValueText();
                            let actText = Utils.isNullOrWhiteSpace(text) ? 'N/A' : text;
                            let oldText = Utils.isNullOrWhiteSpace(component.OriginalText) ? 'N/A' : component.OriginalText;
                            if (actText != oldText) {
                                patchDetail.HistoryValue = `${component.Meta.Label}: ${oldText} => ${actText}`;
                            }
                        }
                        dirtyPatchDetail.push(patchDetail);
                    });
                    var patch = new PatchVM();
                    patch.Changes = dirtyPatchDetail;
                    patch.Table = item.Meta.RefName;
                    patch.ComId = item.Meta.Id;
                    return patch;
                });
                return itemEntity;
            }
        });
        let patchModel = new SavePatchVM();
        patchModel.Changes = dirtyPatch;
        patchModel.Table = this.Meta.EntityId;
        patchModel.Detail = patchModels.filter(x => x);
        patchModel.Delete = deletePatch;
        return patchModel;
    }
    _groupKey = "__groupkey__";
    async SavePatch(reloadData) {
        if (this.OpenFrom.IsTab) {
            this.Entity.Url = `${Client.BaseUri}/#/${this.OpenFrom.FeatureName}?Popup=${this.FeatureName}&Id=${(this.Entity.Id.startsWith("-") ? "" : "")}`;
        }
        if (!this.Dirty) {
            Toast.Warning(Message.NotDirty);
            return false;
        }
        var methodUnique = this.CheckSave;
        if (methodUnique) {
            let taskUnique = methodUnique.apply(this, this);
            if (taskUnique) {
                await this.DispatchCustomEvent(this.Meta.Events, "unique", this);
                return;
            }
        }
        try {
            /** @type {GridView[]}*/
            var gridItem = this.ChildCom.filter(x => x.IsListView && x.Meta.Editable && !x.Meta.IsRealtime);
            var multiples = this.ChildCom.filter(x => x.IsMultiple);
            var currency = this.ChildCom.find(x => x.IsSearchEntry && x.Meta.FieldName == "CurrencyId");
            if (currency) {
                this.Entity.ExchangeRateVND = EditableComponent.ExchangeRateVND[currency.GetValueText()] || 1;
                this.Entity.ExchangeRateUSD = EditableComponent.ExchangeRateUSD[currency.GetValueText()] || 1;
            }
            if (multiples && multiples.length > 0) {
                multiples.forEach(item => {
                    this.Entity[item.Meta.FieldName + "Text"] = item.MatchedItems && item.MatchedItems.length > 0 ? item.MatchedItems.map(item1 => item.GetMatchedText(item1)).join(item.Meta.GroupFormat || ',') : null;
                })
            }
            Spinner.AppendTo(this.Element);
            const valid = await this.IsFormValid();
            if (!valid) {
                Spinner.Hide();
                return false;
            }
            await this.DispatchCustomEvent(this.Meta.Events, "onsave", this, gridItem);
            var patchModel = this.GetPatchVM();
            const rs = await Client.Instance.PatchAsync(patchModel);
            if (rs.status == 200) {
                var codeEditor = this.ChildCom.filter(x => x.ComponentType == "CodeEditor" || "Word");
                codeEditor.forEach(async item => {
                    if (rs.updatedItem[0][item.Meta.FieldName] == item.OldValue) {
                        return;
                    }
                    let dirtyPatchDetail = [
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
                    let patchModelDetail = {
                        Changes: dirtyPatchDetail,
                        Table: item.Meta.RefName,
                        NotMessage: true
                    };
                    await Client.Instance.PatchAsync(patchModelDetail);
                })
                this.Entity = rs.updatedItem[0];
                this.Dirty = false;
                this.UpdateView(true);
                for (const grid of gridItem) {
                    grid.DeleteTempIds = [];
                    if (!grid.AllListViewItem || grid.AllListViewItem.length == 0) {
                        continue;
                    }
                    var dataItem = rs.Detail.find(x => x.ComId == grid.Meta.Id).Data;
                    if (!dataItem) {
                        continue;
                    }
                    await grid.LoadMasterData(dataItem);
                    grid.RowData.Data = dataItem;
                    for (const item of grid.AllListViewItem) {
                        if (item.Entity && item.Entity.Id) {
                            var entity = dataItem.find(x => item.Entity.Id.includes(x.Id));
                            if (entity) {
                                item.Entity = entity;
                                item.UpdateView(true);
                            }
                        }
                    }
                }
                Spinner.Hide();
                Toast.Success("Update success");
                await this.DispatchCustomEvent(this.Meta.Events, "saved", this, this.OpenFrom);
                var parent = this.OpenFrom.TabGroup.flatMap(x => x.Children);
                if (parent && parent.length == 0) {
                    var gridDetail = this.OpenFrom.ChildCom.find(x => x.IsListView && x.Meta.RefName == this.Meta.EntityId);
                    if (reloadData && gridDetail) {
                        gridDetail.ReloadData();
                    }
                    else {
                        if (gridDetail) {
                            var listViewItem = gridDetail.AllListViewItem.find(x => x.Entity.Id == this.Entity.Id);
                            if (listViewItem != null) {
                                listViewItem.Entity = this.Entity;
                                await gridDetail.LoadMasterData([listViewItem.Entity]);
                                listViewItem.UpdateView(false);
                            }
                            else {
                                gridDetail.ReloadData();
                            }
                        }
                    }
                }
                else {
                    for (const element of parent) {
                        await element.CountBadge();
                        var gridDetail = element.FilterChildren(x => x.IsListView).find(x => x.IsListView && x.Meta.RefName == this.Meta.EntityId);
                        if (gridDetail) {
                            if (reloadData) {
                                gridDetail.ReloadData();
                            }
                            else {
                                var listViewItem = gridDetail.AllListViewItem.find(x => x.Entity.Id == this.Entity.Id);
                                if (listViewItem != null) {
                                    listViewItem.Entity = this.Entity;
                                    await gridDetail.LoadMasterData([listViewItem.Entity]);
                                    listViewItem.UpdateView(false);
                                }
                                else {
                                    gridDetail.ReloadData();
                                }
                            }
                        }
                    }
                }
                this.Focus();
                return true;
            }
            else {
                Toast.Warning(rs.message || "Update fail");
            }
            return false;
        } catch (error) {
            Toast.Warning(error.message);
            Spinner.Hide();
            return false;
        }
    }
    /** @type {TabComponent[]} */
    TabGroup = [];
    /** @type {import('./section.js')} */
    SectionMd;
    Popup = false;
    /**
     * Loads and renders features based on the current entity setup.
     * @param {Function} callback - Optional callback to run after loading and rendering.
     */
    async LoadFeatureAndRender(callback = null) {
        Spinner.AppendTo(this.TabEditor.Element || document.body);
        this.SectionMd = this.SectionMd || await import('./section.js');
        var feature = await ComponentExt.LoadFeature(this.entity);
        if (!feature) {
            return null;
        }
        var entity = await this.LoadEntity();
        if (feature.ParentId) {
            var featureParent = await Client.Instance.GetByIdAsync("Feature", [feature.ParentId]);
            ComponentExt.AssignMethods(featureParent.data[0], this);
        }
        if (feature.Script) {
            ComponentExt.AssignMethods(feature, this);
        }
        if (this.Popup) {
            const handler = this.DirtyCheckAndCancel.bind(this);
            const handlerMail = this.OpenMail.bind(this);
            Html.Take(this.ParentElement ?? this.Parent?.Element ?? TabEditor.TabContainer)
                .Div.ClassName("backdrop").TabIndex(-1).Trigger(EventType.Focus).Event(EventType.KeyDown, this.HotKeyHandler.bind(this));
            this._backdrop = Html.Context;
            Html.Instance.Div.ClassName("popup-content").Style(this.Meta.Style);
            this.PopupContent = Html.Context;
            Html.Instance.Div.ClassName("popup-title").Span.IText(this.Title);
            this.TitleElement = Html.Context;
            Html.Instance.End.Div.ClassName("title-center");
            this.TitleCenterElement = Html.Context;
            if (Client.SystemRole) {
                this.TitleElement.addEventListener("contextmenu", (e) => this.SysConfigMenu(e, null, null, null));
            }
            Html.Instance.End.Div.ClassName("icon-box d-flex").Style("display: flex; gap: 20px; align-items: center;").Span.ClassName("fa fa-times")
                .Event(EventType.Click, handler).End.End.End.Div.ClassName("popup-body");
            this.Element = Html.Context;
            Html.Instance.End.Div.ClassName("popup-footer");
            this.PopUpMenu = Html.Context;
        }
        Spinner.Hide();
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
    /** @type {HTMLElement} */
    PopupFooter;
    /** @type {HTMLElement} */
    PopUpMenu;
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
            ChromeTabs.tabs.filter(x => x.content).forEach(x => x.content.Show = false);
            if (this.FeatureName) {
                this.Href = `${Client.BaseUri}/#/${this.FeatureName}`;
                var popupDetail = this.Children.find(x => x.Popup);
                if (popupDetail) {
                    this.Href += `?Popup=${popupDetail.FeatureName}&Id=${popupDetail.EntityId}`;
                    window.history.pushState(null, LangSelect.Get(popupDetail.TabTitle), this.Href);
                }
                else {
                    window.history.pushState(null, LangSelect.Get(this.TabTitle), this.Href);
                }
            }
        }
        else {
            if (this.OpenFrom.IsTab) {
                this.Href = `${Client.BaseUri}/#/${this.OpenFrom.FeatureName}?Popup=${this.FeatureName}&Id=${this.EntityId}`;
                window.history.pushState(null, LangSelect.Get(this.TabTitle), this.Href);
            }
            else if (this.OpenFrom.OpenFrom.IsTab) {
                this.Href = `${Client.BaseUri}/#/${this.OpenFrom.OpenFrom.FeatureName}?Popup=${this.OpenFrom.FeatureName}&Id=${this.OpenFrom.EntityId}&Popup2=${this.FeatureName}&Id2=${this.EntityId}`;
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

            if (eleChild.children && eleChild.children.length > 0) {
                EditForm.SplitChild(eleChild.children, section, editForm);
            }
        }
    }
    /**
     * @type {Component[]}
     */
    GroupTree = [];
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
        this.GroupTree = this.BuildTree(feature.ComponentGroup.sort((a, b) => a.Order - b.Order));
        this.Element = this.RenderTemplate(null, feature);
        this.SetFeatureStyleSheet(feature.StyleSheet);
        this.Policies = feature.FeaturePolicies;
        this.RenderTabOrSection(this.GroupTree, this);
        this.InitDOMEvents();
        loadedCallback?.call(null);
        this.DispatchFeatureEvent(feature.Events, EventType.DOMContentLoaded);
        this.Focus();
        if (this.Popup) {
            if (this._backdrop.OutOfViewport().Top) {
                this._backdrop.scrollIntoView(true);
            }
        }
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
            if (Client.SystemRole) {
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

    SetShow(show, ...field) {
        var childs = this.Children.filter(x => x.IsSection && field.includes(x.Meta.FieldName));
        if (childs && childs.length == 0) {
            childs = this.Children.filter(x => x.IsSection);
            childs.forEach(item => {
                item.SetShow(show, ...field);
            })
        }
        else {
            childs.forEach(item => {
                item.Show = show;
            })
        }
        this.ChildCom.filter(x => field.includes(x.Meta.FieldName)).forEach(item => {
            item.Show = show;
        })
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
            Client.Instance.HardDeleteAsync(grid.DeleteTempIds, grid.Meta.RefName)
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
                item.Children = [];
                continue;
            }

            for (const ui of item.Children) {
                ui.Parent = item;
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
            const ds = await Client.Instance.GetByIdAsync(this.EntityName, [urlId]);
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
    /** @type {HTMLElement} */
    TitleCenterElement = null;
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
        componentGroup = this.GetComPolicies(componentGroup);
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
        confirm.Title = "Data has been changed. Do you want to save?";
        confirm.PElement = this.Element;
        confirm.YesConfirmed.add(() => {
            this.SavePatch().then((rs) => {
                if (rs) {
                    this.Dispose();
                    if (closeCallback && closeCallback instanceof Function) closeCallback();
                }
            });
        });
        confirm.NoConfirmed.add(() => {
            this.Dispose();
            if (closeCallback && closeCallback instanceof Function) closeCallback();
        });
        confirm.IgnoreCancelButton = true;
        confirm.Render();
    }

    OpenMail(closeCallback = null) {
        this.OpenPopup("mail-editor", null);
    }

    /**
     * Disposes the form, removing it from the DOM and cleaning up resources.
     */
    Dispose() {
        if (this.OpenFrom && this.OpenFrom.IsTab) {
            window.history.pushState(null, LangSelect.Get(this.OpenFrom.TabTitle), `${Client.BaseUri}/#/${this.OpenFrom.FeatureName}`);
        }
        super.Dispose();
        if (this.Popup && this.OpenFrom) {
            this.OpenFrom.Focus();
        }
    }

    /**
     * Validates the entire form or specific components within it.
     * @param {boolean} showMessage - Whether to show validation messages.
     * @param {(item: EditableComponent) => boolean} predicate - Function to determine which components to validate.
     * @param {(item: EditableComponent) => boolean} ignorePredicate - Function to determine which components to ignore.
     * @returns {Promise<boolean>} A promise that resolves to the validation status of the form.
     */
    async IsFormValid(showMessage = true) {
        const validationPromises = this.ChildCom.map(x => {
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
            Toast.Warning("Error while sending email: " + error.message);
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

    /**
     * @param {Component[]} components
     * @return {Component[]}
     */
    GetComPolicies(components) {
        if (this.Meta.IsPublic || components.every(x => x.IsPublic)) {
            components.forEach(com => {
                com.CanWrite = true;
                com.CanWriteAll = true;
                com.CanRead = true;
                com.CanReadAll = true;
                com.CanDelete = true;
                com.CanDeleteAll = true;
                com.CanDeactivate = true;
                com.CanDeactivateAll = true;
                com.CanExport = true;
            });
            return components;
        }
        var policyFeature = this.Policies.sort((a, b) => b.CanRead - a.CanRead).find(x => !x.RecordId && (Client.Token.RoleIds.includes(x.RoleId) || Client.Token.UserId == x.UserId))
        var newComponents = components.map(com => {
            var check2 = this.Policies.sort((a, b) => b.CanRead - a.CanRead).find(x => x.RecordId && x.RecordId == com.Id && (Client.Token.RoleIds.includes(x.RoleId) || Client.Token.UserId == x.UserId));
            if (check2 && check2.CanRead) {
                com.CanWrite = check2.CanWrite;
                com.CanWriteAll = check2.CanWriteAll;
                com.CanRead = check2.CanRead;
                com.CanReadAll = check2.CanReadAll;
                com.CanDelete = check2.CanDelete;
                com.CanDeleteAll = check2.CanDeleteAll;
                com.CanDeactivate = check2.CanDeactivate;
                com.CanDeactivateAll = check2.CanDeactivateAll;
                com.CanExport = check2.CanExport;
                return com;
            }
            else if (policyFeature) {
                com.CanWrite = policyFeature.CanWrite || false;
                com.CanWriteAll = policyFeature.CanWriteAll || false;
                com.CanRead = policyFeature.CanRead || false;
                com.CanReadAll = policyFeature.CanReadAll || false;
                com.CanDelete = policyFeature.CanDelete || false;
                com.CanDeleteAll = policyFeature.CanDeleteAll || false;
                com.CanDeactivate = policyFeature.CanDeactivate || false;
                com.CanDeactivateAll = policyFeature.CanDeactivateAll || false;
                com.CanExport = policyFeature.CanExport || false;
                return com;
            }
            else {
                return null;
            }
        });
        return newComponents.filter(x => x != null);
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
                const success = await Client.Instance.HardDeleteAsync([this.EntityId], this.Meta.EntityName);
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
            Toast.Warning("Error adding component: " + error.message);
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
        if (!Client.SystemRole) {
            if (Client.BodRole) {
                if (component.ComponentType == "Pdf") {
                    const ctxMenu = ContextMenu.Instance;
                    ctxMenu.Top = e.Top();
                    ctxMenu.Left = e.Left();
                    ctxMenu.MenuItems = [];
                    if (component !== null) {
                        ctxMenu.MenuItems.push({ Icon: "fal fa-copy", Text: "Set Default Value", Click: this.SetDefaultValue.bind(this), Parameter: component });
                        ctxMenu.MenuItems.push({ Icon: "fal fa-cog", Text: "Pdf Properties", Click: this.ComponentProperties.bind(this), Parameter: component });
                    }
                    ctxMenu.Render();
                }
                else {
                    if (component !== null) {
                        const ctxMenu = ContextMenu.Instance;
                        ctxMenu.Top = e.Top();
                        ctxMenu.Left = e.Left();
                        ctxMenu.MenuItems = [];
                        ctxMenu.MenuItems.push({ Icon: "fal fa-copy", Text: "Set Default Value", Click: this.SetDefaultValue.bind(this), Parameter: component });
                        ctxMenu.Render();
                    }
                }
            }
            else {
                if (component !== null) {
                    const ctxMenu = ContextMenu.Instance;
                    ctxMenu.Top = e.Top();
                    ctxMenu.Left = e.Left();
                    ctxMenu.MenuItems = [];
                    ctxMenu.MenuItems.push({ Icon: "fal fa-copy", Text: "Set Default Value", Click: this.SetDefaultValue.bind(this), Parameter: component });
                    ctxMenu.Render();
                }
            }
            return;
        }
        const ctxMenu = ContextMenu.Instance;
        ctxMenu.Top = e.Top();
        ctxMenu.Left = e.Left();
        ctxMenu.MenuItems = [];
        if (component !== null) {
            ctxMenu.MenuItems.push({ Icon: "fal fa-cog", Text: "Component Properties", Click: this.ComponentProperties.bind(this), Parameter: component });
            ctxMenu.MenuItems.push({ Icon: "fal fa-copy", Text: "Set Default Value", Click: this.SetDefaultValue.bind(this), Parameter: component });
        }
        if (group !== null) {
            ctxMenu.MenuItems.push({ Icon: "fal fa-cogs", Text: "Section Properties", Click: this.SectionProperties.bind(this), Parameter: group });
        }
        ctxMenu.MenuItems.push({ Icon: "fal fa-folder-open", Text: "Screen Properties", Click: this.FeatureProperties.bind(this) });
        ctxMenu.MenuItems.push({ Icon: "fal fa-clone", Text: "Clone Screen", Click: this.CloneFeature.bind(this) });
        ctxMenu.Render();
    }

    async SectionProperties(group) {
        const instanse = await import('./forms/sectionEditor.js');
        const editor = new instanse.SectionEditor("section-editor");
        editor.Name = "section-editor";
        editor.ParentElement = this.TabEditor.Element;
        editor.Entity = group;
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    async FeatureProperties() {
        var instanse = await import('./forms/featureEditor.js');
        const editor = new instanse.FeatureEditor("feature-editor");
        editor.Name = "feature-editor";
        editor.ParentElement = this.TabEditor.Element;
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
        editor.ParentElement = this.TabEditor.Element;
        editor.Entity = component;
        // @ts-ignore
        editor.OpenFrom = this.EditForm;
        this.AddChild(editor);
    }

    SetDefaultValue(component) {
        var com = JSON.parse(JSON.stringify(component));
        com.FieldName = 'DefaultValue' + com.FieldName;
        this.Entity[com.FieldName] = com.DefaultVal;
        this.OpenConfig("Set default value", async () => {
            let dirtyPatchDetail = [
                {
                    Label: "Value",
                    Field: "Value",
                    OldVal: null,
                    Value: this.Entity[com.FieldName],
                },
                {
                    Label: this.IdField,
                    Field: this.IdField,
                    OldVal: null,
                    Value: component.ComponentDefaultValueId || Uuid7.NewGuid(),
                },
                {
                    Label: "ComponentId",
                    Field: "ComponentId",
                    OldVal: null,
                    Value: com.Id
                },
                {
                    Label: "UserId",
                    Field: "UserId",
                    OldVal: null,
                    Value: this.Token.UserId
                }
            ]
            let patchModelDetail = {
                Changes: dirtyPatchDetail,
                Table: "ComponentDefaultValue",
                NotMessage: true
            };
            await Client.Instance.PatchAsync(patchModelDetail);
            this.Dirty = false;
        }, () => { }, true, [com]);
    }

    async ActCloneFeature() {
        var featureId = Uuid7.Guid();
        var entity = this.Meta;
        entity.Id = "-" + featureId;
        entity.Name = entity.Name + "-new";
        let featurePatch = [];
        Object.getOwnPropertyNames(entity).forEach(cell => {
            if (entity[cell] instanceof Array || (entity[cell] instanceof Object && !(entity[cell] instanceof Decimal))) {
                return;
            }
            let val;
            if (typeof entity[cell] === "boolean") {
                val = entity[cell] ? "1" : "0";
            } else {
                val = entity[cell];
            }
            let prop = new PatchDetail();
            prop.Label = cell;
            prop.Field = cell;
            prop.OldVal = null;
            prop.Value = val;
            featurePatch.push(prop);
        });
        let featureModel = {
            Changes: featurePatch,
            Table: "Feature",
            Delete: [],
            Detail: []
        };
        await Client.Instance.PatchAsync(featureModel);
        for (const key of this.Policies) {
            var policy = key;
            policy.Id = Uuid7.NewGuid();
            policy.FeatureId = featureId;
            let policyPatch = [];
            Object.getOwnPropertyNames(policy).forEach(cell => {
                if (policy[cell] instanceof Array || (policy[cell] instanceof Object && !(policy[cell] instanceof Decimal))) {
                    return;
                }
                let val;
                if (typeof policy[cell] === "boolean") {
                    val = policy[cell] ? "1" : "0";
                } else {
                    val = policy[cell];
                }
                let prop = new PatchDetail();
                prop.Label = cell;
                prop.Field = cell;
                prop.OldVal = null;
                prop.Value = val;
                policyPatch.push(prop);
            });
            let policyModel = {
                Changes: policyPatch,
                Table: "FeaturePolicy",
                Delete: [],
                Detail: []
            };
            await Client.Instance.PatchAsync(policyModel);
        }
        for (const group of this.GroupTree) {
            await this.buildComponentGroup(group, null, featureId);
        }
        for (const keyDetail of this.Meta.GridPolicies) {
            var component = keyDetail;
            component.Id = Uuid7.NewGuid();
            component.ComponentGroupId = null;
            component.FeatureId = featureId;
            let componentPatch = [];
            Object.getOwnPropertyNames(component).forEach(cell => {
                if (component[cell] instanceof Array || (component[cell] instanceof Object && !(component[cell] instanceof Decimal))) {
                    return;
                }
                let val;
                if (typeof component[cell] === "boolean") {
                    val = component[cell] ? "1" : "0";
                } else {
                    val = component[cell];
                }
                let prop = new PatchDetail();
                prop.Label = cell;
                prop.Field = cell;
                prop.OldVal = null;
                prop.Value = val;
                componentPatch.push(prop);
            });
            let componentModel = {
                Changes: componentPatch,
                Table: "Component",
                Delete: [],
                Detail: []
            };
            await Client.Instance.PatchAsync(componentModel);
        }
    }

    async buildComponentGroup(componentGroup, parentId = null, featureId) {
        var newcomponentGroup = componentGroup;
        var newcomponentGroupId = Uuid7.Guid();
        newcomponentGroup.Id = "-" + newcomponentGroupId;
        newcomponentGroup.FeatureId = featureId;
        newcomponentGroup.ParentId = parentId;
        let newcomponentGroupPatch = [];
        Object.getOwnPropertyNames(newcomponentGroup).forEach(cell => {
            if (newcomponentGroup[cell] instanceof Array || (newcomponentGroup[cell] instanceof Object && !(newcomponentGroup[cell] instanceof Decimal))) {
                return;
            }
            let val;
            if (typeof newcomponentGroup[cell] === "boolean") {
                val = newcomponentGroup[cell] ? "1" : "0";
            } else {
                val = newcomponentGroup[cell];
            }
            let prop = new PatchDetail();
            prop.Label = cell;
            prop.Field = cell;
            prop.OldVal = null;
            prop.Value = val;
            newcomponentGroupPatch.push(prop);
        });
        let newcomponentGroupModel = {
            Changes: newcomponentGroupPatch,
            Table: "Component",
            Delete: [],
            Detail: []
        };
        await Client.Instance.PatchAsync(newcomponentGroupModel);
        if (componentGroup.Children) {
            for (const keyDetail of componentGroup.Children) {
                await this.buildComponentGroup(keyDetail, newcomponentGroupId, featureId);
            }
        }
        if (componentGroup.Components) {
            for (const keyDetail of componentGroup.Components) {
                await this.buildComponent(keyDetail, newcomponentGroupId, featureId);
            }
        }
    }

    async buildComponent(keyDetail, componentgroupId, featureId) {
        var component = keyDetail;
        component.Id = Uuid7.NewGuid();
        component.ComponentGroupId = componentgroupId;
        component.FeatureId = featureId;
        let componentPatch = [];
        Object.getOwnPropertyNames(component).forEach(cell => {
            if (component[cell] instanceof Array || (component[cell] instanceof Object && !(component[cell] instanceof Decimal))) {
                return;
            }
            let val;
            if (typeof component[cell] === "boolean") {
                val = component[cell] ? "1" : "0";
            } else {
                val = component[cell];
            }
            let prop = new PatchDetail();
            prop.Label = cell;
            prop.Field = cell;
            prop.OldVal = null;
            prop.Value = val;
            componentPatch.push(prop);
        });
        let componentModel = {
            Changes: componentPatch,
            Table: "Component",
            Delete: [],
            Detail: []
        };
        await Client.Instance.PatchAsync(componentModel);
    }

    /**
     * Clones a feature by prompting the user for confirmation and then executing a clone operation.
     * @param {Object} ev - The event object which should contain a feature to clone.
     */
    CloneFeature(ev) {
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = "Do you want to clone this feature?";
        confirmDialog.PElement = this.Element;
        confirmDialog.YesConfirmed.add(() => {
            this.ActCloneFeature(this);
        })
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
            popup.ParentElement = !this.TabEditor ? document.querySelector("#tab-content") : this.TabEditor.Element;
            popup.OpenFrom = this;
            popup.Name = featureName;
            this.AddChild(popup);
        })
    }

    async OpenTab(featureName, entity) {
        var tab1 = ChromeTabs.tabs.find(x => x.content.Meta.Name === featureName)
        if (tab1) {
            tab1.content.Focus();
            return;
        }
        if (!entity) {
            entity = {
                Id: Uuid7.NewGuid()
            }
        }
        else if (!entity.Id) {
            entity.Id = Uuid7.NewGuid();
        }
        import('./tabEditor.js').then((instanse) => {
            const popup = new instanse.TabEditor(featureName);
            popup.Entity = entity;
            popup.Name = featureName;
            this.AddChild(popup);
            EditForm.Tabs.push(popup);
        })
    }

    /**
     * @param {Function} yesConfirmed
     * @param {Function} noConfirmed
     * @param {string} title
     */
    async OpenConfirmDialog(yesConfirmed, noConfirmed, title, needAnswer, com, ignoreNoButton) {
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = title;
        confirmDialog.EditForm = this;
        confirmDialog.IgnoreNoButton = ignoreNoButton;
        confirmDialog.NeedAnswer = needAnswer;
        confirmDialog.Component = com;
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.Render();
        confirmDialog.YesConfirmed.add(yesConfirmed);
        confirmDialog.NoConfirmed.add(noConfirmed);
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        if (componentNames && componentNames.length > 0) {
            this.ChildCom.filter(x => componentNames.includes(x.Meta.FieldName)).forEach(child => {
                child.Entity = this.Entity;
                child.UpdateView(force, dirty);
            });
            return;
        }
        this.FilterChildren().filter(x => x.IsSection && !x.IsListViewItem).forEach(child => {
            child.PrepareUpdateView(force, dirty);
            child.Entity = this.Entity;
        });
        this.ChildCom.filter(x => !x.IsListView).forEach(child => {
            child.PrepareUpdateView(force, dirty);
            child.Entity = this.Entity;
            child.UpdateView(force, dirty, ...componentNames);
        });
        this.ChildCom.filter(x => x.IsListView).forEach(/**@param {GridView} child **/ child => {
            child.Entity = this.Entity;
            child.PrepareUpdateView(force, dirty);
            if (!child.Meta.Editable) {
                child.ReloadData();
            }
        });
    }

    SendEntity() {
        const confirm = new ConfirmDialog();
        confirm.Title = "Are you sure you want to submit this approval request?";
        confirm.PElement = this.Element;
        confirm.YesConfirmed.add(async () => {
            if (this.Entity["Id"].startsWith("-")) {
                await this.SavePatch();
            }
            await this.ActSendEntity();
        });
        confirm.Render();
    }

    OpenConfig(title, yesConfirmed, noConfirmed, needAnswer, com, ignoreNoButton) {
        if (!this.Entity) {
            this.Entity = {};
        }
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = title;
        confirmDialog.NeedAnswer = needAnswer;
        confirmDialog.IgnoreNoButton = ignoreNoButton;
        confirmDialog.Component = com;
        confirmDialog.EditForm = this;
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.Entity = this.Entity;
        confirmDialog.YesConfirmed.add(yesConfirmed);
        confirmDialog.NoConfirmed.add(noConfirmed);
        confirmDialog.Render();
        return confirmDialog;
    }

    ApprovedEntity() {
        const confirm = new ConfirmDialog();
        confirm.Title = "Are you sure you want to approved this approval request?";
        confirm.EditForm = this;
        confirm.PElement = this.Element;
        confirm.NeedAnswer = true;
        confirm.YesConfirmed.add(async () => {
            if (this.Entity["Id"].startsWith("-")) {
                await this.SavePatch();
            }
            await this.ActApprovedEntity(this.Entity.ReasonOfChange);
        });
        confirm.Render();
    }

    DeclineEntity() {
        const confirm = new ConfirmDialog();
        confirm.Title = "Are you sure you want to decine this approval request?";
        confirm.PElement = this.Element;
        confirm.EditForm = this;
        confirm.NeedAnswer = true;
        confirm.YesConfirmed.add(async () => {
            if (this.Entity["Id"].startsWith("-")) {
                await this.SavePatch();
            }
            await this.ActDeclineEntity(this.Entity.ReasonOfChange);
        });
        confirm.Render();
    }

    async ActSendEntity() {
        await this.DispatchCustomEvent(this.Meta.Events, "onsend", this);
        this.Entity.StatusId = 2;
        var patchModel = this.GetPatchVM();
        var res = await Client.Instance.PostAsync(patchModel, "/api/feature/SendEntity");
        if (res.status == 200) {
            this.Entity = res.updatedItem[0];
            this.Dirty = false;
            this.UpdateView(true);
            this.ChildCom.filter(x => x.IsListView && !x.Meta.IsRealtime).forEach(x => x.ReloadData());
            var parent = this.OpenFrom.TabGroup.flatMap(x => x.Children);
            if (parent.length > 0) {
                for (const element of parent) {
                    await element.CountBadge();
                    var gridDetail = element.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                    if (gridDetail) {
                        await gridDetail.ReloadData();
                    }
                }
            } else {
                var gridDetail = this.OpenFrom.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                if (gridDetail) {
                    await gridDetail.ReloadData();
                }
            }
            await this.DispatchCustomEvent(this.Meta.Events, "sended", this);
            Toast.Success("Your submission was successful.")
        }
        else {
            Toast.Warning("There was an error with your submission.")
        }
    }

    async ActForwordEntity() {
        await this.DispatchCustomEvent(this.Meta.Events, "onforword", this);
        var patchModel = this.GetPatchVM();
        var res = await Client.Instance.PostAsync(patchModel, "/api/feature/ForwardEntity");
        if (res.status == 200) {
            this.Entity = res.updatedItem[0];
            this.Dirty = false;
            this.UpdateView(true);
            this.ChildCom.filter(x => x.IsListView && !x.Meta.IsRealtime).forEach(x => x.ReloadData());
            var parent = this.OpenFrom.TabGroup.flatMap(x => x.Children);
            if (parent.length > 0) {
                for (const element of parent) {
                    await element.CountBadge();
                    var gridDetail = element.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                    if (gridDetail) {
                        await gridDetail.ReloadData();
                    }
                }
            } else {
                var gridDetail = this.OpenFrom.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                if (gridDetail) {
                    await gridDetail.ReloadData();
                }
            }
            await this.DispatchCustomEvent(this.Meta.Events, "sended", this);
            Toast.Success("Your forward was successful.")
        }
        else {
            Toast.Warning("There was an error with your forward.")
        }
    }

    async ActApprovedEntity(change) {
        await this.DispatchCustomEvent(this.Meta.Events, "onapproved", this);
        var patchModel = this.GetPatchVM();
        patchModel.ReasonOfChange = change;
        var res = await Client.Instance.PostAsync(patchModel, "/api/feature/ApprovedEntity");
        if (res.status == 200) {
            this.Entity = res.updatedItem[0];
            this.Dirty = false;
            this.UpdateView(true);
            this.ChildCom.filter(x => x.IsListView && !x.Meta.IsRealtime).forEach(x => x.ReloadData());
            var parent = this.OpenFrom.TabGroup.flatMap(x => x.Children);
            if (parent.length > 0) {
                for (const element of parent) {
                    await element.CountBadge();
                    var gridDetail = element.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                    if (gridDetail) {
                        await gridDetail.ReloadData();
                    }
                }
            }
            else {
                var gridDetail = this.OpenFrom.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                if (gridDetail) {
                    await gridDetail.ReloadData();
                }
            }
            await this.DispatchCustomEvent(this.Meta.Events, "approved", this);
            Toast.Success("Your approved was successful.")
        }
        else {
            Toast.Warning(res.message)
        }
    }

    async ActDeclineEntity(change) {
        await this.DispatchCustomEvent(this.Meta.Events, "ondecline", this);
        this.Entity.StatusId = 4;
        var patchModel = this.GetPatchVM();
        patchModel.ReasonOfChange = change;
        var res = await Client.Instance.PostAsync(patchModel, "/api/feature/DeclineEntity");
        if (res.status == 200) {
            await this.DispatchCustomEvent(this.Meta.Events, "declined", this);
            this.Entity = res.updatedItem[0];
            this.Dirty = false;
            this.UpdateView(true);
            this.ChildCom.filter(x => x.IsListView && !x.Meta.IsRealtime).forEach(x => x.ReloadData());
            var parent = this.OpenFrom.TabGroup.flatMap(x => x.Children);
            if (parent.length > 0) {
                for (const element of parent) {
                    await element.CountBadge();
                    var gridDetail = element.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                    if (gridDetail) {
                        await gridDetail.ReloadData();
                    }
                }
            }
            else {
                var gridDetail = this.OpenFrom.FilterChildren(x => x.IsListView).find(x => x.Meta.RefName == this.Meta.EntityId);
                if (gridDetail) {
                    await gridDetail.ReloadData();
                }
            }
            await this.DispatchCustomEvent(this.Meta.Events, "declined", this);
            Toast.Success("Your decline was successful.")
        }
        else {
            Toast.Warning(res.message)
        }
    }
}