import { Toast } from './toast.js';
import { Spinner } from './spinner.js';
import { Utils } from "./utils/utils.js";
import { ListView } from './listView.js';
import { Uuid7 } from './structs/uuidv7.js';
import { ContextMenu } from './contextMenu.js';
import { Client } from "./clients/";
import { SearchEntry } from './searchEntry.js';
import {
    EventType, ElementType, HotKeyModel, CustomEventType, Component,
    OperatorEnum, KeyCodeEnum, OrderbyDirection, AdvSearchOperation, LogicOperation
} from './models/';
import { GridViewItem } from './gridViewItem.js';
import { ConfirmDialog } from './confirmDialog.js';
import { Direction, Html } from "./utils/html.js";
import { Section } from './section.js';
import { ListViewSection } from './listViewSection.js';
import { ListViewSearch, ListViewSearchVM } from './listViewSearch.js';
import { ComponentFactory } from './utils/componentFactory.js';
import Decimal from 'decimal.js';
import { GroupViewItem } from './groupViewItem.js';
import { UserSetting } from './models/userSeting.js';

export class GridView extends ListView {

    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement | null} ele 
     */
    constructor(ui, el) {
        super(ui, el);
        this.SummaryClass = "summary";
        this.CellCountNoSticky = 50;
        this._summarys = [];
        this.LastThClick = null;
        this.LastNumClick = null;
        this.AutoFocus = false;
        this.LoadRerender = false;
        this._waitingLoad = false;
        this._renderPrepareCacheAwaiter = 0;
        /** @type {HTMLElement} */
        this.DataTable = null;
        this.LastElementFocus = null;
        this.lastListViewItem = null;
        this._hasFirstLoad = false;
        this._renderIndexAwaiter = 0;
        this._lastScrollTop = 0;

        this.DOMContentLoaded.add(this.DOMContentLoadedHandler.bind(this));
    }

    static ToolbarColumn = {
        StatusBar: true,
        Label: '',
        Frozen: true
    };
    /** @type {HTMLElement} */
    MenuGridView;
    /** @type {GridViewItem} */
    GridViewItemEmpty;
    DOMContentLoadedHandler() {
        if (this.Meta.IsSumary) {
            this.AddSummaries();
        }
    }

    Rerender() {
        this.LoadRerender = true;
        this.Header = this.Header.filter(x => !x.Hidden);
        this.RenderTableHeader(this.Header);
        if (this.Editable) {
            this.AddNewEmptyRow();
        }
        this.RenderContent();
        this.StickyColumn(this);
    }

    StickyColumn(rows, top = null) {
        let shouldStickEle = ["th", "td"];
        let frozen = rows.FilterChildren(x => x.Meta != null && x.Meta.Frozen, x => !(x instanceof ListViewSearch));
        frozen.forEach(x => {
            let cell = x.Element;
            let isCell = shouldStickEle.includes(x.Element.tagName.toLowerCase());
            if (!isCell) {
                cell = x.Element.closest("td");
            }
            if (top) {
                // @ts-ignore
                Html.Take(cell).Sticky({ top });
            } else {
                // @ts-ignore
                Html.Take(cell).Sticky({ left: "0" });
            }
        });
    }

    AddSections() {
        if (this.HeaderSection && this.HeaderSection.Element != null) {
            return;
        }
        Html.Take(this.ParentElement);
        Html.Instance.Div.Event('keydown', e => this.HotKeyF6Handler(e, e.KeyCodeEnum())).Style(this.Meta.ChildStyle).ClassName("grid-wrapper").ClassName(this.Meta.ClassName).ClassName(this.Editable ? "editable" : "");
        this.Element = Html.Context;
        if (this.Meta.CanSearch) {
            Html.Instance.Div.ClassName("d-flex").Div.ClassName("grid-toolbar search").End.Render();
            Html.Instance.Div.ClassName("button-toolbar").Render();
            this.MenuGridView = Html.Context;
            Html.Instance.End.Render();
            var child = this.EditForm.Meta.Components.filter(x => x.ComponentGroupId == this.Meta.Id);
            child.forEach(ui => {
                const com = ComponentFactory.GetComponent(ui, this.EditForm);
                if (com == null) return;
                com.ParentElement = this.MenuGridView;
                com.Render()
                com.Disabled = ui.Disabled || this.EditForm.Disabled || com.Disabled;
                if (ui.Focus) {
                    com.Focus();
                }
                if (Client.SystemRole) {
                    com.Element.addEventListener('contextmenu', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.EditForm.SysConfigMenu(e, ui, null, com)
                    });
                }
            });
        }
        this.ListViewSearch = new ListViewSearch(this.Meta);
        this.ListViewSearch.Entity = new ListViewSearchVM();
        if (this.Meta.DefaultAddStart) {
            let pre = this.Meta.DefaultAddStart;
            this.ListViewSearch.EntityVM.StartDate = new Date(Date.now() + pre * 24 * 3600 * 1000);
        }
        let lFrom = window.localStorage.getItem("FromDate" + this.Meta.Id);
        if (lFrom != null) {
            this.ListViewSearch.EntityVM.StartDate = new Date(lFrom);
        }
        if (this.Meta.DefaultAddEnd) {
            let pre = this.Meta.DefaultAddEnd;
            this.ListViewSearch.EntityVM.EndDate = new Date(Date.now() + pre * 24 * 3600 * 1000);
        }
        let lTo = window.localStorage.getItem("ToDate" + this.Meta.Id);
        if (lTo != null) {
            this.ListViewSearch.EntityVM.EndDate = new Date(lTo);
        }
        this.AddChild(this.ListViewSearch);

        this.DataTable = Html.Take(this.Element).Div.ClassName("table-wrapper").Table.ClassName("table").GetContext();
        Html.Instance.Thead.TabIndex(-1).End.TBody.ClassName("empty").End.TBody.End.TFooter.Render();

        this.FooterSection = new ListViewSection(null, Html.Context);
        this.FooterSection.ParentElement = this.DataTable;
        this.AddChild(this.FooterSection);

        // @ts-ignore
        this.MainSection = new ListViewSection(null, this.FooterSection.Element.previousElementSibling);
        this.MainSection.ParentElement = this.DataTable;
        this.AddChild(this.MainSection);
        if (!this.AddContentRendered) {
            this.MainSection.Element.addEventListener('contextmenu', this.BodyContextMenuHandler.bind(this));
            this.AddContentRendered = true;
        }
        // @ts-ignore
        this.EmptySection = new ListViewSection(null, this.MainSection.Element.previousElementSibling);
        this.EmptySection.ParentElement = this.DataTable;
        this.AddChild(this.EmptySection);

        // @ts-ignore
        this.HeaderSection = new ListViewSection(null, this.EmptySection.Element.previousElementSibling);
        this.HeaderSection.ParentElement = this.DataTable;
        this.AddChild(this.HeaderSection);
        Html.Instance.EndOf(".table-wrapper");
        Html.Take(this.Element);
        this.RenderPaginator();
    }

    ClickHeader(e, header) {
        let index = this.LastNumClick;
        const table = this.DataTable;
        if (this.LastNumClick != null) {
            table.querySelectorAll('tr:not(.summary)').forEach(function (row) {
                if (row.hasAttribute('virtualrow') || row.classList.contains('group-row')) {
                    return;
                }
                /** @type {HTMLElement[]} */
                const cells = Array.from(row.querySelectorAll('th, td'));
                if (cells[index]) {
                    cells[index].style.removeProperty("background-color");
                    cells[index].style.removeProperty("color");
                }
            });
        }
        const th = e.target.closest("th");
        const tr = Array.from(th.parentElement.querySelectorAll("th"));
        index = tr.findIndex(x => x === th);
        if (index < 0) {
            return;
        }
        this.LastThClick = th;
        this.LastNumClick = index;
        table.querySelectorAll('tr:not(.summary)').forEach(function (row) {
            if (row.hasAttribute('virtualrow') || row.classList.contains('group-row')) {
                return;
            }
            /** @type {HTMLElement[]} */
            const cells = Array.from(row.querySelectorAll('th, td'));
            if (cells[index]) {
                cells[index].style.backgroundColor = "#cbdcc2";
                cells[index].style.color = "#000";
            }
        });
    }

    FocusOutHeader(e, header) {
        let index = this.LastNumClick;
        const table = this.DataTable;
        if (this.LastNumClick !== null) {
            table.querySelectorAll('tr:not(.summary)').forEach(function (row) {
                if (row.hasAttribute('virtualrow') || row.classList.contains('group-row')) {
                    return;
                }
                const cells = Array.from(row.querySelectorAll('th, td'));
                // @ts-ignore
                cells[index].style.removeProperty("background-color");
                // @ts-ignore
                cells[index].style.removeProperty("color");
            });
        }
    }

    ThHotKeyHandler(e, header) {
        if (this.Meta.Focus) {
            return;
        }
        const keyCode = e.keyCode;
        if (keyCode === 39) {
            if (!Utils.isNullOrWhiteSpace(header.GroupName)) {
                return;
            }
            e.stopPropagation();
            const th = e.target.closest("th");
            const tr = Array.from(th.parentElement.querySelectorAll("th"));
            const index = tr.findIndex(x => x === th);
            th.parentElement.parentElement.parentElement.querySelectorAll('tr').forEach(function (row) {
                if (row.hasAttribute('virtualrow') || row.classList.contains('group-row')) {
                    return;
                }
                const cells = Array.from(row.querySelectorAll('th, td'));
                if (cells[0].classList.contains('summary-header')) {
                    return;
                }
                var draggingColumnIndex = index;
                var endColumnIndex = index + 1;
                if (draggingColumnIndex > endColumnIndex) {
                    cells[endColumnIndex].parentNode.insertBefore(cells[draggingColumnIndex], cells[endColumnIndex]);
                } else {
                    cells[endColumnIndex].parentNode.insertBefore(cells[draggingColumnIndex], cells[endColumnIndex].nextSibling);
                }
                cells[draggingColumnIndex].style.backgroundColor = "#cbdcc2";
            });
            this.SwapHeader(index, index + 1);
            this.SwapSectionHeader(index, index + 1);
            this.UpdateHeaders();
            th.focus();
        }
        else if (keyCode === 37) { // Left arrow
            if (!Utils.isNullOrWhiteSpace(header.GroupName)) {
                return;
            }
            e.stopPropagation();
            const th1 = e.target.closest("th");
            const tr1 = Array.from(th1.parentElement.querySelectorAll("th"));
            const index1 = tr1.findIndex(x => x === th1);

            th1.parentElement.parentElement.parentElement.querySelectorAll('tr').forEach(function (row) {
                if (row.hasAttribute('virtualrow') || row.classList.contains('group-row')) {
                    return;
                }
                const cells = Array.from(row.querySelectorAll('th, td'));
                if (cells[0].classList.contains('summary-header')) {
                    return;
                }
                var draggingColumnIndex = index1;
                var endColumnIndex = index1 - 1;
                if (draggingColumnIndex > endColumnIndex) {
                    cells[endColumnIndex].parentNode.insertBefore(cells[draggingColumnIndex], cells[endColumnIndex]);
                } else {
                    cells[endColumnIndex].parentNode.insertBefore(cells[draggingColumnIndex], cells[endColumnIndex].nextSibling);
                }
                cells[draggingColumnIndex].style.backgroundColor = "#cbdcc2";
            });
            this.SwapHeader(index1, index1 - 1);
            this.SwapSectionHeader(index1, index1 - 1);
            this.UpdateHeaders();
            th1.focus();
        }
    }
    SwapHeader(oldIndex, newIndex) {
        const item = this.Header[oldIndex];
        this.Header.splice(oldIndex, 1);
        this.Header.splice(newIndex, 0, item);
    }
    SwapSectionHeader(oldIndex, newIndex) {
        const item = this.HeaderSection.Children[oldIndex];
        this.HeaderSection.Children.splice(oldIndex, 1);
        this.HeaderSection.Children.splice(newIndex, 0, item);
    }
    FilterInSelected(e) {
        /** @type {HotKeyModel} */
        let hotKeyModel = e;
        if (this._waitingLoad) {
            window.clearTimeout(this._renderPrepareCacheAwaiter);
        }
        if (hotKeyModel.Operator === null) {
            return;
        }
        let header = this.Header.find(x => x.Name === hotKeyModel.FieldName);
        let subFilter = '';
        let lastFilter = window.localStorage.getItem("LastSearch" + this.Meta.Id + header.Id);
        if (lastFilter !== null) {
            subFilter = lastFilter.toString();
        }
        // @ts-ignore
        let confirmDialog = new ConfirmDialog({
            Content: `Nhập ${header.Label} cần tìm ` + hotKeyModel.OperatorText,
            NeedAnswer: true,
            MultipleLine: false,
            ComType: header.ComponentType === "Datepicker" || header.ComponentType === "Number" ? header.ComponentType : "Textbox",
            Precision: header.Precision,
            PElement: this.MainSection.Element
        });
        confirmDialog.YesConfirmed = () => {
            let value = null;
            let valueText = null;
            if (header.ComponentType === "Datepicker") {
                valueText = value = confirmDialog.Datepicker.Value.toString();
            } else if (header.ComponentType === "Number") {
                valueText = confirmDialog.Number.GetValueText();
                value = confirmDialog.Number.Value.toString();
            } else {
                valueText = confirmDialog.Textbox.Text.trim();
                value = confirmDialog.Textbox.Text.trim();
            }
            window.localStorage.setItem("LastSearch" + this.Meta.Id + header.Id, value);
            if (this.CellSelected.some(x => x.FieldName === hotKeyModel.FieldName && x.Operator === OperatorEnum.In) && !hotKeyModel.Shift) {
                let cell = this.CellSelected.find(x => x.FieldName === hotKeyModel.FieldName && x.Operator === OperatorEnum.In);
                cell.Value = value;
                cell.ValueText = valueText;
            } else {
                this.CellSelected.push({
                    FieldName: hotKeyModel.FieldName,
                    FieldText: header.Label,
                    ComponentType: header.ComponentType,
                    Shift: hotKeyModel.Shift,
                    Value: value,
                    ValueText: valueText,
                    Operator: hotKeyModel.Operator,
                    OperatorText: hotKeyModel.OperatorText,
                    Logic: undefined,
                    IsSearch: false,
                    Group: false
                });
            }
            this._summarys.push(new HTMLElement());
            confirmDialog.Textbox.Text = null;
            this.ActionFilter();
        };
        confirmDialog.Entity = { ReasonOfChange: "" };
        confirmDialog.PElement = this.Element;
        confirmDialog.Render();
        if (subFilter) {
            if (header.ComponentType === "Datepicker") {
                confirmDialog.Datepicker.Value = new Date(subFilter);
                let input = confirmDialog.Datepicker.Element;
                input.selectionStart = 0;
                input.selectionEnd = subFilter.length;
            } else if (header.ComponentType === "Number") {
                confirmDialog.Number.Value = parseFloat(subFilter);
                let input = confirmDialog.Number.Element;
                input.selectionStart = 0;
                input.selectionEnd = subFilter.length;
            } else {
                confirmDialog.Textbox.Text = subFilter;
                let input = confirmDialog.Textbox.Element;
                input.selectionStart = 0;
                input.selectionEnd = subFilter.length;
            }
        }
    }

    ActionFilter() {
        if (this.CellSelected.Nothing()) {
            this.NoCellSelected();
            return;
        }
        Spinner.AppendTo(this.DataTable);
        const dropdowns = this.CellSelected.filter(x => (x.Value || x.ValueText) && x.ComponentType === 'SearchEntry' || x.FieldName.includes('.'));
        const groups = this.CellSelected.filter(x => x.FieldName.includes('.'));
        this.FilterDropdownIds(dropdowns).done(data => {
            let index = 0;
            const lisToast = [];
            this.CellSelected.forEach(cell => {
                index = this.BuildCondition(cell, data, index, lisToast);
            });
            Spinner.Hide();
            if (this.Meta.ComponentType === 'VirtualGrid' && this.Meta.CanSearch) {
                this.HeaderSection.Element.focus();
            }
            if (this.Meta.ComponentType === 'SearchEntry') {
                if (this.Parent instanceof SearchEntry) {
                    const search = this.Parent;
                    if (search._input) {
                        search._input.focus();
                    }
                }
            }
            Toast.Success(lisToast.join("</br>"));
            this.ApplyFilter().then();
        });
    }

    async FilterDropdownIds(dropdowns) {
        let tasks = dropdowns.map(x => {
            let header = this.Header.find(y => y.FieldName === x.FieldName);
            if (!x.isSearch) {
                let filterOperation = 'Like';
                switch (x.operator) {
                    case OperatorEnum.Lr:
                        filterOperation = 'StartWith';
                        break;
                    case OperatorEnum.Rl:
                        filterOperation = 'EndWidth';
                        break;
                    case OperatorEnum.NotIn:
                        filterOperation = 'NotLike';
                        break;
                }
                let sqlFilter = `${filterOperation} ds.[${header.FormatData}] ${x.value}`;
                // @ts-ignore
                return Client.Instance.GetIds({
                    ComId: header.Id,
                    Where: sqlFilter,
                    MetaConn: this.MetaConn,
                    DataConn: this.DataConn
                });
            } else {
                return Promise.resolve([x.value]);
            }
        });
        return Promise.all(tasks);
    }

    BuildCondition(cell, data, index, lisToast) {
        let where = '';
        let hl = this.Header.find(y => y.FieldName === cell.FieldName);
        let ids = null;
        let isNull = !cell.Value.trim();
        let advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotIn : AdvSearchOperation.In;
        if (hl.FieldName === this.IdField) {
            where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} not in (${cell.Value})` : `[ds].${cell.FieldName} in (${cell.Value})`;
            lisToast.push(cell.FieldText + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
        } else {
            if (hl.ComponentType === 'SearchEntry' && hl.FormatData.trim()) {
                if (isNull) {
                    advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull;
                    where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} is not null` : `[ds].${cell.FieldName} is null`;
                } else {
                    let idArr = data[index];
                    if (idArr.length) {
                        ids = idArr.join(',');
                        where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} not in (${ids})` : `[ds].${cell.FieldName} in (${ids})`;
                    } else {
                        where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} != ${cell.Value}` : `[ds].${cell.FieldName} = ${cell.Value}`;
                    }
                    index++;
                }
                lisToast.push(hl.Label + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
            } else if (['Input', 'Textbox', 'Textarea'].includes(hl.ComponentType)) {
                if (isNull) {
                    advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull;
                    where = cell.Operator === OperatorEnum.NotIn ? `([ds].${cell.FieldName} is not null and [ds].${cell.FieldName} != '')` : `([ds].${cell.FieldName} is null or [ds].${cell.FieldName} = '')`;
                } else {
                    advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotLike : AdvSearchOperation.Like;
                    where = cell.Operator === OperatorEnum.NotIn ? `(CHARINDEX(N'${cell.Value}', [ds].${cell.FieldName}) = 0 or [ds].${cell.FieldName} is null)` : `CHARINDEX(N'${cell.Value}', [ds].${cell.FieldName}) > 0`;
                    if (cell.Operator === OperatorEnum.Lr) {
                        advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotStartWith : AdvSearchOperation.StartWith;
                        where = cell.Operator === OperatorEnum.NotIn ? ` [ds].${cell.FieldName} not like N'${cell.Value}%' or [ds].${cell.FieldName} is null)` : ` [ds].${cell.FieldName} like N'${cell.Value}%'`;
                    }
                    if (cell.Operator === OperatorEnum.Rl) {
                        advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEndWidth : AdvSearchOperation.EndWidth;
                        where = cell.Operator === OperatorEnum.NotIn ? ` [ds].${cell.FieldName} not like N'%${cell.Value}' or [ds].${cell.FieldName} is null)` : ` [ds].${cell.FieldName} like N'%${cell.Value}'`;
                    }
                }
                lisToast.push(hl.Label + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
            } else if (hl.ComponentType === 'Number' || (hl.ComponentType === 'Label' && hl.FieldName.includes('Id'))) {
                if (cell.Operator === OperatorEnum.NotIn || cell.Operator === OperatorEnum.In) {
                    if (isNull) {
                        advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull;
                        where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} is not null` : `[ds].${cell.FieldName} is null`;
                    } else {
                        advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqual : AdvSearchOperation.Equal;
                        where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} != ${cell.Value.replace(",", "")}` : `[ds].${cell.FieldName} = ${cell.Value.replace(",", "")}`;
                    }
                } else {
                    if (cell.Operator === OperatorEnum.Gt || cell.Operator === OperatorEnum.Lt) {
                        where = cell.Operator === OperatorEnum.Gt ? `[ds].${cell.FieldName} > ${cell.Value}` : `[ds].${cell.FieldName} < ${cell.Value}`;
                        advo = cell.Operator === OperatorEnum.Gt ? AdvSearchOperation.GreaterThan : AdvSearchOperation.LessThan;
                    } else if (cell.Operator === OperatorEnum.Ge || cell.Operator === OperatorEnum.Le) {
                        where = cell.Operator === OperatorEnum.Ge ? `[ds].${cell.FieldName} >= ${cell.Value}` : `[ds].${cell.FieldName} <= ${cell.Value}`;
                        advo = cell.Operator === OperatorEnum.Ge ? AdvSearchOperation.GreaterThanOrEqual : AdvSearchOperation.LessThanOrEqual;
                    }
                }
                lisToast.push(hl.Label + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
            } else if (hl.ComponentType === 'Checkbox') {
                if (isNull) {
                    advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull;
                    where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} is not null` : `[ds].${cell.FieldName} is null`;
                } else {
                    where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} != ${(cell.Value === "true" ? "1" : "0")}` : `[ds].${cell.FieldName} = ${(cell.Value === "true" ? "1" : "0")}`;
                }
                lisToast.push(hl.Label + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
            } else if (hl.ComponentType === 'Datepicker') {
                cell.Value = decodeURIComponent(cell.Value);
                cell.ValueText = decodeURIComponent(cell.Value);
                if (cell.Operator === OperatorEnum.NotIn || cell.Operator === OperatorEnum.In) {
                    if (isNull) {
                        where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} is not null` : `[ds].${cell.FieldName} is null`;
                        advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull;
                    } else {
                        try {
                            let va = new Date(cell.Value);
                            where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} != '${va.toISOString().split('T')[0]}'` : `[ds].${cell.FieldName} = '${va.toISOString().split('T')[0]}'`;
                            advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualDatime : AdvSearchOperation.EqualDatime;
                        } catch {
                            let va = new Date(cell.Value);
                            where = cell.Operator === OperatorEnum.NotIn ? `[ds].${cell.FieldName} != '${va.toISOString().split('T')[0]}'` : `[ds].${cell.FieldName} = '${va.toISOString().split('T')[0]}'`;
                            advo = cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualDatime : AdvSearchOperation.EqualDatime;
                        }
                    }
                } else {
                    if (!isNull) {
                        let va = new Date(cell.Value);
                        if (cell.Operator === OperatorEnum.Gt || cell.Operator === OperatorEnum.Lt) {
                            where = cell.Operator === OperatorEnum.Gt ? `[ds].${cell.FieldName} > '${va.toISOString()}'` : `[ds].${cell.FieldName} < '${va.toISOString()}'`;
                            advo = cell.Operator === OperatorEnum.Gt ? AdvSearchOperation.GreaterThanDatime : AdvSearchOperation.LessThanDatime;
                        } else if (cell.Operator === OperatorEnum.Ge || cell.Operator === OperatorEnum.Le) {
                            where = cell.Operator === OperatorEnum.Ge ? `[ds].${cell.FieldName} >= '${va.toISOString()}'` : `[ds].${cell.FieldName} <= '${va.toISOString()}'`;
                            advo = cell.Operator === OperatorEnum.Ge ? AdvSearchOperation.GreaterEqualDatime : AdvSearchOperation.LessEqualDatime;
                        }
                    }
                }
                lisToast.push(hl.Label + " <span class='text-danger'>" + cell.OperatorText + "</span> " + cell.ValueText);
            }
        }
        let value = ids || cell.Value;
        if (this.AdvSearchVM.Conditions.some(x => x.Field.FieldName === cell.FieldName && x.CompareOperatorId === advo && (x.CompareOperatorId === AdvSearchOperation.Like || x.CompareOperatorId === AdvSearchOperation.In || x.CompareOperatorId === AdvSearchOperation.EqualDatime)) && !cell.Shift && !cell.Group) {
            let condition = this.AdvSearchVM.Conditions.find(x => x.Field.FieldName === cell.FieldName && x.CompareOperatorId === advo);
            condition.Value = value.trim() ? value : cell.ValueText;
            this.Wheres.find(x => x.Condition.includes(`[ds].${cell.FieldName}`)).Condition = where;
        } else {
            if (!this.AdvSearchVM.Conditions.some(x => x.Field.FieldName === cell.FieldName && x.CompareOperatorId === advo && x.Value === cell.Value)) {
                if (cell.ComponentType === 'Input' && !cell.Value.trim()) {
                    // @ts-ignore
                    this.AdvSearchVM.Conditions.push({
                        Field: hl,
                        CompareOperatorId: cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqualNull : AdvSearchOperation.EqualNull,
                        LogicOperatorId: cell.Operator === OperatorEnum.NotIn ? LogicOperation.And : LogicOperation.Or,
                        Value: null,
                        Group: true
                    });
                    // @ts-ignore
                    this.AdvSearchVM.Conditions.push({
                        Field: hl,
                        CompareOperatorId: cell.Operator === OperatorEnum.NotIn ? AdvSearchOperation.NotEqual : AdvSearchOperation.Equal,
                        LogicOperatorId: cell.Operator === OperatorEnum.NotIn ? LogicOperation.And : LogicOperation.Or,
                        Value: '',
                        Group: true
                    });
                } else {
                    if (hl.FieldName.includes(".")) {
                        let format = hl.FieldName.split(".")[0] + "Id";
                        hl.FieldName = format;
                        // @ts-ignore
                        this.AdvSearchVM.Conditions.push({
                            Field: hl,
                            CompareOperatorId: advo,
                            LogicOperatorId: cell.Logic || LogicOperation.And,
                            Value: value.trim() ? value : cell.ValueText,
                            Group: cell.Group
                        });
                    } else {
                        // @ts-ignore
                        this.AdvSearchVM.Conditions.push({
                            Field: hl,
                            CompareOperatorId: advo,
                            LogicOperatorId: cell.Logic || LogicOperation.And,
                            Value: value.trim() ? value : cell.ValueText,
                            Group: cell.Group
                        });
                    }
                }
                this.Wheres.push({
                    Condition: where,
                    Group: cell.Group
                });
            }
        }

        return index;
    }

    NoCellSelected() {
        this.MainSection.DisposeChildren();
        this.ApplyFilter();
        if (this.Meta.ComponentType === 'VirtualGrid' && this.Meta.CanSearch) {
            this.HeaderSection.Element.focus();
        }
        if (this.Meta.ComponentType === 'SearchEntry') {
            if (this.Parent instanceof SearchEntry) {
                const search = this.Parent;
                if (search._input) {
                    search._input.focus();
                }
            }
        }
    }

    ApplyLocal(DataTable) {
        if (!(DataTable instanceof HTMLTableElement)) {
            console.error("Invalid DataTable: not an HTMLTableElement");
            return;
        }

        var rows;
        if (this.Meta.TopEmpty) {
            rows = DataTable.tBodies[DataTable.tBodies.length - 1].children;
        } else {
            rows = DataTable.tBodies[0].children;
        }
        if (this.CellSelected.Nothing()) {
            for (var i = 0; i < rows.length; i++) {
                rows[i].classList.remove("d-none");
            }
            return;
        }
        this.LastElementFocus = null;
        var listNone = [];
        var header = this.Header.findIndex(y => y.FieldName === this.CellSelected[0].FieldName);
        this.CellSelected.forEach(cell => {
            for (var i = 0; i < rows.length; i++) {
                var cells = rows[i].children;
                if (cells[header] === undefined) {
                    continue;
                }
                var cellText = cells[header].textContent || '';
                if (cell.Operator === OperatorEnum.In) {
                    if (cellText.toLowerCase().indexOf(cell.ValueText.toLowerCase()) === -1) {
                        if (!listNone.some(x => x === rows[i])) {
                            listNone.push(rows[i]);
                        }
                    }
                } else {
                    if (cellText.toLowerCase().indexOf(cell.ValueText.toLowerCase()) !== -1) {
                        if (!listNone.some(x => x === rows[i])) {
                            listNone.push(rows[i]);
                        }
                    }
                }
            }
        });
        for (var i = 0; i < rows.length; i++) {
            if (listNone.some(x => x === rows[i])) {
                rows[i].classList.add("d-none");
            } else {
                if (this.LastElementFocus === null) {
                    this.LastElementFocus = rows[i].children[header];
                }
                rows[i].classList.remove("d-none");
            }
        }
        if (this.LastElementFocus !== null) {
            this.LastElementFocus.focus();
            this.LastElementFocus = null;
        }
    }

    FilterSelected(hotKeyModel) {
        if (!hotKeyModel.Operator) {
            return;
        }
        if (!this.CellSelected.some(x => x.FieldName === hotKeyModel.FieldName && x.Value === hotKeyModel.Value && x.ValueText === hotKeyModel.ValueText && x.Operator === hotKeyModel.Operator)) {
            const header = this.Header.find(x => x.FieldName === hotKeyModel.FieldName);
            // @ts-ignore
            this.CellSelected.push({
                FieldName: hotKeyModel.FieldName,
                FieldText: header ? header.Label : '',
                ComponentType: header ? header.ComponentType : '',
                Value: hotKeyModel.Value,
                ValueText: hotKeyModel.ValueText,
                Operator: hotKeyModel.Operator,
                OperatorText: hotKeyModel.OperatorText,
                IsSearch: hotKeyModel.ActValue,
            });
            this._summarys.push(document.createElement('HTMLElement'));
        }
        this.ActionFilter();
    }

    DisposeSumary() {
        if (this._summarys.length > 0) {
            const lastSummary = this._summarys[this._summarys.length - 1];
            lastSummary.remove();
            this._summarys.pop();
        }
        if (this.lastListViewItem && this.LastElementFocus) {
            this.lastListViewItem.Focused(true);
            this.LastElementFocus.focus();
        }
    }

    HiddenSumary() {
        const lastSummary = this._summarys[this._summarys.length - 1];
        if (lastSummary) {
            lastSummary.style.display = 'none';
        }
    }

    SearchDisplayRows() {
        if (!(this.DataTable instanceof HTMLTableElement)) {
            console.error("Invalid DataTable: not an HTMLTableElement");
            return;
        }
        const table = this.DataTable;
        const rows = table.tBodies[table.tBodies.length - 1].children;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].classList.contains("virtual-row")) {
                continue;
            }
            const cells = rows[i].childNodes;
            let found = false;
            for (let j = 0; j < cells.length; j++) {
                const htmlElement = cells[j];
                if (!(htmlElement instanceof HTMLElement)) {
                    continue;
                }
                const input = htmlElement.querySelector("input:first-child");
                let cellText;
                if (input !== null) {
                    cellText = String(Utils.GetPropValue(input, "value"));
                } else {
                    cellText = cells[j].textContent || "";
                }
                if (cellText.toLowerCase().indexOf(this.ListViewSearch.EntityVM.FullTextSearch.toLowerCase()) > -1) {
                    found = true;
                    break;
                }
            }
            if (found) {
                rows[i].classList.remove("d-none");
            } else {
                rows[i].classList.add("d-none");
            }
        }
    }

    FocusCell(e, header) {
        const td = e.target.closest("td");

        // Clearing focus on other cells
        const table = e.target.closest('table');
        table.querySelectorAll("tbody tr").forEach(tr => tr.classList.remove("focus"));
        table.querySelectorAll("tbody td").forEach(td => td.classList.remove("cell-selected"));

        // Adding focus class to the current row and cell
        td.closest("tr").classList.add("focus");
        td.classList.add("cell-selected");
    }

    /**
     * 
     * @param {MouseEvent} e 
     * @returns 
     */
    ActionKeyHandler(e, header, focusedRow, com, el, keyCode) {
        let fieldName = "";
        let text = "";
        let value = "";

        if ([KeyCodeEnum.F4, KeyCodeEnum.F8, KeyCodeEnum.F9, KeyCodeEnum.F10, KeyCodeEnum.F11, KeyCodeEnum.F2, KeyCodeEnum.UpArrow, KeyCodeEnum.DownArrow, KeyCodeEnum.LeftArrow, KeyCodeEnum.RightArrow, KeyCodeEnum.Insert].includes(keyCode) || (e.ctrlKey || e.metaKey) && keyCode === KeyCodeEnum.D) {
            e.preventDefault();
            e.stopPropagation();
            if (!com) {
                return;
            }
            fieldName = header.FieldName;
            switch (com.Meta.ComponentType) {
                case "SearchEntry":
                case "Number":
                    value = focusedRow.Entity[header.FieldName];
                    break;
                case "Checkbox":
                    value = com.GetValue();
                    break;
                default:
                    value = com.GetValue();
                    break;
            }
            if (value === null) {
                text = null;
            } else {
                text = com.GetValueText();
            }
        }

        switch (keyCode) {
            case KeyCodeEnum.F2:
                this.FilterSelected({ Operator: 2, OperatorText: "Exclude", Value: value, FieldName: fieldName, ValueText: text, ActValue: true });
                break;
            case KeyCodeEnum.F4:
                this.ProcessFilterDetail(e, com, el, fieldName, text, value);
                break;
            case KeyCodeEnum.F:
                if (e.ctrlKey()) {
                    let confirmDialog = new ConfirmDialog({
                        Content: `Nhập ${header.Label} cần tìm ` + hotKeyModel.OperatorText,
                        NeedAnswer: true,
                        MultipleLine: false,
                        Precision: header.Precision,
                        PElement: this.MainSection.Element
                    });
                    confirmDialog.Render();
                }
                this.ProcessFilterDetail(e, com, el, fieldName, text, value);
                break;
            case KeyCodeEnum.F8:
                this.ProcessHardDelete();
                break;
            case KeyCodeEnum.F9:
                this.FilterSelected({ Operator: 1, OperatorText: "Contains", Value: value, FieldName: fieldName, ValueText: text, ActValue: true });
                com.Focus();
                break;
            case KeyCodeEnum.F11:
                this.ProcessSort(e, com);
                break;
            case KeyCodeEnum.UpArrow:
                this.MoveFocusUp(fieldName);
                break;
            case KeyCodeEnum.DownArrow:
                this.MoveFocusDown(fieldName);
                break;
            case KeyCodeEnum.LeftArrow:
                this.MoveFocusLeft(com);
                break;
            case KeyCodeEnum.RightArrow:
                this.MoveFocusRight(com);
                break;
            case KeyCodeEnum.Home:
                this.MoveFocusHome();
                break;
            case KeyCodeEnum.End:
                this.MoveFocusEnd();
                break;
            case KeyCodeEnum.Insert:
                this.ToggleItemSelection();
                break;
            default:
                break;
        }
    }

    MoveFocusUp(fieldName) {
        let currentItem = this.GetItemFocus();
        if (!currentItem) {
            currentItem = this.GridViewItemEmpty;
        }
        currentItem.Selected = false;
        var nextIndex = -2;
        if (currentItem.EmptyRow) {
            nextIndex = this.AllListViewItem.length - 1;
        }
        else {
            var indexCurrent = this.AllListViewItem.indexOf(currentItem);
            nextIndex = indexCurrent - 1;
            if (this.AllListViewItem[nextIndex] && this.AllListViewItem[nextIndex].GroupRow) {
                nextIndex = nextIndex - 1;
            }
            if (indexCurrent == 0) {
                if (this.Meta.CanAdd) {
                    nextIndex = -2;
                }
                else {
                    nextIndex = this.AllListViewItem.length - 1;
                }
            }
            else {
                if (nextIndex == -1) {
                    if (this.Meta.CanAdd) {
                        nextIndex = -2;
                    }
                    else {
                        nextIndex = this.AllListViewItem.length - 1;
                    }
                }
            }
        }
        if (nextIndex == -2) {
            this.GridViewItemEmpty.Focused = true;
            var com = this.GridViewItemEmpty.Children.find(x => x.Meta.FieldName == fieldName);
            com.ParentElement.focus();
            com.Focus();
        }
        else {
            this.AllListViewItem[nextIndex].Focused = true
            this.AllListViewItem[nextIndex].Selected = true;
            var com = this.AllListViewItem[nextIndex].Children.find(x => x.Meta.FieldName == fieldName);
            com.ParentElement.focus();
            com.Focus();
        }
    }

    MoveFocusDown(fieldName) {
        let currentItem = this.GetItemFocus();
        if (!currentItem) {
            currentItem = this.GridViewItemEmpty;
        }
        currentItem.Selected = false;
        var nextIndex = -2;
        if (currentItem.EmptyRow) {
            nextIndex = 0;
            if (this.AllListViewItem[nextIndex] && this.AllListViewItem[nextIndex].GroupRow) {
                nextIndex = nextIndex + 1;
            }
        }
        else {
            var indexCurrent = this.AllListViewItem.indexOf(currentItem);
            nextIndex = indexCurrent + 1;
            if (this.AllListViewItem[nextIndex] && this.AllListViewItem[nextIndex].GroupRow) {
                nextIndex = nextIndex + 1;
            }
            if (indexCurrent == this.AllListViewItem.length - 1) {
                if (this.Meta.CanAdd) {
                    nextIndex = -2;
                }
            }
            else {
                if (!this.AllListViewItem[nextIndex]) {
                    if (this.Meta.CanAdd) {
                        nextIndex = -2;
                    }
                    else {
                        nextIndex = 0;
                    }
                }
            }
        }
        if (nextIndex == -2) {
            this.GridViewItemEmpty.Focused = true;
            var com = this.GridViewItemEmpty.Children.find(x => x.Meta.FieldName == fieldName);
            com.ParentElement.focus();
            com.Focus();
        }
        else {
            if (!this.AllListViewItem[nextIndex]) {
                nextIndex = 0;
            }
            this.AllListViewItem[nextIndex].Focused = true;
            this.AllListViewItem[nextIndex].Selected = true;
            var com = this.AllListViewItem[nextIndex].Children.find(x => x.Meta.FieldName == fieldName);
            com.ParentElement.focus();
            com.Focus();
        }
    }

    MoveFocusLeft(com) {
        let currentItem = this.GetItemFocus();
        if (!currentItem) {
            currentItem = this.GridViewItemEmpty;
        }
        var ele = this.PreElement(com.Element.closest('td').previousElementSibling);
        let leftItem = currentItem.Children.find(x => x.Element.closest('td') === ele);
        if (!leftItem) {
            return;
        }
        leftItem.Element.closest("td").focus();
        leftItem.Focus();
        if (leftItem.Meta.Editable && !leftItem.Disabled) {
            if (leftItem.Element instanceof HTMLInputElement) {
                leftItem.Element.selectionStart = 0;
                leftItem.Element.selectionEnd = leftItem.GetValueText().length;
            }
        }
    }

    NextElement(ele) {
        if (ele.style.display == "none") {
            return this.NextElement(ele.nextElementSibling);
        }
        else {
            return ele;
        }
    }

    PreElement(ele) {
        if (ele.style.display == "none") {
            return this.PreElement(ele.previousElementSibling);
        }
        else {
            return ele;
        }
    }

    MoveFocusRight(com) {
        let currentItem = this.GetItemFocus();
        if (!currentItem) {
            currentItem = this.GridViewItemEmpty;
        }
        var ele = this.NextElement(com.Element.closest('td').nextElementSibling);
        let leftItem = currentItem.Children.find(x => x.Element.closest('td') === ele);
        if (!leftItem) {
            return;
        }
        leftItem.Element.closest("td").focus();
        leftItem.Focus();
        if (leftItem.Meta.Editable) {
            if (leftItem.Element instanceof HTMLInputElement) {
                leftItem.Element.selectionStart = 0;
                leftItem.Element.selectionEnd = leftItem.GetValueText().length;
            }
        }
    }

    MoveFocusHome() {
        let firstItem = this.AllListViewItem[0];
        firstItem?.Focus();
        this.DataTable.parentElement.scrollTop = 0;
    }

    MoveFocusEnd() {
        let lastItem = this.AllListViewItem[this.AllListViewItem.length - 1];
        lastItem?.Focus();
        this.DataTable.parentElement.scrollTop = this.DataTable.parentElement.scrollHeight;
    }

    ToggleItemSelection() {
        let currentItem = this.GetItemFocus();
        currentItem.Selected = !currentItem.Selected;
    }

    ProcessHardDelete() {
        if (this.Disabled) {
            return;
        }
        const selectedRows = this.GetSelectedRows();
        if (selectedRows.length === 0) {
            Toast.Warning("Vui lòng chọn dòng cần xóa");
            return;
        }
        var check = selected.some(x => x["StatusId"] && [3, 4].includes(x["StatusId"]));
        const canDelete = this.Meta.CanDelete;
        if (canDelete && !check) {
            this.HardDeleteSelected();
        }
    }

    ProcessFilterDetail(e, com, el, fieldName, text, value) {
        const menu = ContextMenu.Instance;
        menu.PElement = this.MainSection.Element;
        menu.Top = el.getBoundingClientRect().top;
        menu.Left = el.getBoundingClientRect().left;
        menu.MenuItems = [
            // @ts-ignore
            {
                Icon: "fal fa-angle-double-right",
                Text: "Chứa", Click: this.FilterInSelected,
                Parameter: { Operator: OperatorEnum.In, OperatorText: "Chứa", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey }
            },
            // @ts-ignore
            {
                Icon: "fal fa-not-equal", Text: "Không chứa",
                Click: this.FilterInSelected,
                Parameter: { Operator: OperatorEnum.NotIn, OperatorText: "Không chứa", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey }
            },
            // @ts-ignore
            {
                Icon: "fal fa-hourglass-start", Text: "Trái phải", Click: this.FilterInSelected,
                Parameter: { Operator: OperatorEnum.Lr, OperatorText: "Trái phải", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey }
            },
            // @ts-ignore
            {
                Icon: "fal fa-hourglass-end", Text: "Phải trái", Click: this.FilterInSelected,
                Parameter: { Operator: OperatorEnum.Rl, OperatorText: "Phải trái", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey }
            }
        ];

        if (com.Meta.ComponentType === "Number" || com.Meta.ComponentType === "Datepicker") {
            menu.MenuItems.push(
                // @ts-ignore
                {
                    Icon: "fal fa-greater-than", Text: "Lớn hơn", Click: this.FilterInSelected,
                    Parameter: { Operator: OperatorEnum.Gt, OperatorText: "Lớn hơn", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey },
                },
                {
                    Icon: "fal fa-less-than", Text: "Nhỏ hơn", Click: this.FilterInSelected,
                    Parameter: { Operator: OperatorEnum.Lt, OperatorText: "Nhỏ hơn", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey },
                },
                {
                    Icon: "fal fa-greater-than-equal", Text: "Lớn hơn bằng", Click: this.FilterInSelected,
                    Parameter: { Operator: OperatorEnum.Ge, OperatorText: "Lớn hơn bằng", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey },
                },
                {
                    Icon: "fal fa-less-than-equal", Text: "Nhỏ hơn bằng", Click: this.FilterInSelected,
                    Parameter: { Operator: OperatorEnum.Le, OperatorText: "Nhỏ hơn bằng", Value: value, FieldName: fieldName, ValueText: text, Shift: e.shiftKey },
                }
            );
        }
        menu.Render();
    }

    ProcessSort(e, com) {
        if (com.Meta.ComponentType === "Button") {
            return;
        }
        let th = this.HeaderSection.Children.find(x => x.Meta.Id === com.Meta.Id);
        th.Element.classList.remove("desc", "asc");
        const fieldName = com.ComponentType === "SearchEntry" ? com.Meta.FieldText : com.FieldName;
        const sort = {
            FieldName: fieldName,
            OrderbyDirectionId: OrderbyDirection.ASC,
            ComId: com.Meta.Id,
        };
        if (!this.AdvSearchVM.OrderBy.length) {
            // @ts-ignore
            this.AdvSearchVM.OrderBy = [sort];
            th.Element.classList.add("desc");
        } else {
            const existSort = this.AdvSearchVM.OrderBy.find(x => x.FieldName === fieldName);
            if (existSort) {
                this.AlterExistSort(th, existSort);
            } else {
                const shiftKey = e.shiftKey;
                this.RemoveOtherSorts(shiftKey);
                th.Element.classList.add("desc");
                // @ts-ignore
                this.AdvSearchVM.OrderBy.push(sort);
            }
        }
        localStorage.setItem("OrderBy" + this.Meta.Id, JSON.stringify(this.AdvSearchVM.OrderBy));
        this.ReloadData();
    }

    AlterExistSort(th, existSort) {
        if (existSort.OrderbyDirectionId === OrderbyDirection.ASC) {
            existSort.OrderbyDirectionId = OrderbyDirection.DESC;
            th.Element.classList.replace("asc", "desc");
        } else {
            const index = this.AdvSearchVM.OrderBy.indexOf(existSort);
            if (index !== -1) {
                this.AdvSearchVM.OrderBy.splice(index, 1);
            }
        }
    }

    RemoveOtherSorts(shiftKey) {
        if (shiftKey) return;
        this.HeaderSection.Children.forEach(x => {
            x.Element.classList.remove("desc");
            x.Element.classList.remove("asc");
        });
        this.AdvSearchVM.OrderBy.length = 0;
    }

    CopyValue(e, com, fieldName, currentItem, upItem) {
        this.LastListViewItem = upItem;
        currentItem.Focused(false);
        upItem.Focused(true);
        if (!fieldName || fieldName.trim() === '') {
            return;
        }
        let nextcom = upItem.FilterChildren(x => x.Meta.Id === com.Meta.Id)[0];
        if (nextcom) {
            this.LastComponentFocus = nextcom.Meta;
            nextcom.ParentElement?.focus();
            nextcom.Focus();
            if (nextcom.Meta.Editable && !nextcom.Disabled) {
                if (nextcom.Element instanceof HTMLInputElement) {
                    nextcom.Element.selectionStart = 0;
                    nextcom.Element.selectionEnd = nextcom.GetValueText().length;
                }
            }
            this.LastElementFocus = nextcom.Element;
            if (e.shiftKey) {
                upItem.Entity[fieldName] = com.GetValue();
                let updated = upItem.FilterChildren(x => x.FieldName === nextcom.FieldName)[0];
                if (updated && (!updated.Disabled || updated.Meta.Editable)) {
                    updated.Dirty = true;
                    (async () => {
                        if (updated.Meta.ComponentType === "SearchEntry") {
                            updated.UpdateView();
                            let dropdown = com;
                            updated.PopulateFields(dropdown.Matched);
                            await updated.DispatchEvent(updated.Meta.Events, "change", this, upItem.Entity, dropdown.Matched);
                        } else {
                            updated.UpdateView();
                            updated.PopulateFields();
                            await updated.DispatchEvent(updated.Meta.Events, "change", this, upItem.Entity);
                        }
                        await upItem.ListViewSection.ListView.DispatchEvent(upItem.ListViewSection.ListView.Meta.Events, "change", this, upItem.Entity);
                        if (this.Meta.IsRealtime) {
                            await upItem.PatchUpdateOrCreate();
                        }
                    })();
                }
            }
        }
    }

    RenderViewPort(count = true, firstLoad = false, skip = null) {
        return;
    }

    HotKeyF6Handler(e, keyCode) {
        let currentItem = this.GetItemFocus();
        if (!currentItem) {
            currentItem = this.GridViewItemEmpty;
        }
        switch (keyCode) {
            case KeyCodeEnum.F6:
                e.preventDefault();
                e.stopPropagation();
                if (this._summarys.length) {
                    let lastElement = this._summarys[this._summarys.length - 1];
                    if (this.Meta.FilterLocal) {
                        if (lastElement.innerHTML === "") {
                            this.CellSelected.pop();
                            this.ActionFilter();
                            this._summarys.pop();
                        } else {
                            if (lastElement.style.display === "none") {
                                this.CellSelected.pop();
                                this.ActionFilter();
                                lastElement.style.display = "";
                            } else {
                                this._summarys.pop();
                                lastElement.remove();
                            }
                        }
                        return;
                    }
                    if (lastElement.innerHTML === "") {
                        this.CellSelected.pop();
                        this.Wheres.pop();
                        let last = this.AdvSearchVM.Conditions[this.AdvSearchVM.Conditions.length - 1];
                        if (last && last.Field.ComponentType === "Input" && !last.Value.trim()) {
                            this.AdvSearchVM.Conditions.pop();
                            this.AdvSearchVM.Conditions.pop();
                        } else {
                            this.AdvSearchVM.Conditions.pop();
                        }
                        this.ActionFilter();
                        this._summarys.pop();
                    } else {
                        if (this._waitingLoad) {
                            clearTimeout(this._renderPrepareCacheAwaiter);
                        }
                        if (lastElement.style.display === "none") {
                            this.CellSelected.pop();
                            this.Wheres.pop();
                            let last = this.AdvSearchVM.Conditions[this.AdvSearchVM.Conditions.length - 1];
                            if (last && last.Field.ComponentType === "Input" && !last.Value.trim()) {
                                this.AdvSearchVM.Conditions.pop();
                                this.AdvSearchVM.Conditions.pop();
                            } else {
                                this.AdvSearchVM.Conditions.pop();
                            }
                            this.ActionFilter();
                            lastElement.style.display = "";
                        } else {
                            this._summarys.pop();
                            lastElement.remove();
                        }
                    }
                }
                break;
            case KeyCodeEnum.F3:
                e.preventDefault();
                e.stopPropagation();
                this.GetRealTimeSelectedRows().then(selected => {
                    if (selected.length === 0) {
                        selected = this.RowData.Data;
                    }
                    let numbers = this.Header.filter(x => x.ComponentType === "Number");
                    if (numbers.length === 0) {
                        Toast.Warning("Vui lòng cấu hình");
                        return;
                    }
                    let listString = numbers.map(x => {
                        let val = selected.map(k => k[x.FieldName]).filter(k => k != null).reduce((a, b) => a + parseFloat(b), 0);
                        return x.Label + " : " + (val % 2 > 0 ? val.toFixed(2) : Math.round(val).toString());
                    });
                    Toast.Success(listString.join("</br>"), 6000);
                });
                break;
            case KeyCodeEnum.F1:
                e.preventDefault();
                e.stopPropagation();
                this.ToggleAll();
                break;
            case KeyCodeEnum.U:
                if (e.ctrlKey || e.metaKey) {
                    if (this.Disabled || !this.Meta.CanAdd) {
                        return;
                    }
                    e.preventDefault();
                    e.stopPropagation();
                    this.DuplicateSelected(e, true);
                }
                break;
            default:
                break;
        }
        if (!currentItem || !currentItem.Children) {
            return;
        }
        let com = currentItem.Children.find(x => x.Meta.Id === this.LastComponentFocus?.Id);
        if (!com || !this.LastComponentFocus || this.Meta.ComponentType == "Dropdown") {
            return;
        }
        this.ActionKeyHandler(e, this.LastComponentFocus, currentItem, com, com.Element.closest('td'), keyCode);
    }

    async AddRow(rowData, index = 0, singleAdd = true) {
        let rowSection = await super.AddRow(rowData, index, singleAdd);
        this.StickyColumn(rowSection);
        this.RenderIndex();
        return rowSection;
    }

    /**
     * Adds multiple rows to the ListView.
     * @param {Array<object>} rows An array of objects to be added as rows.
     * @param {number} index The starting index to add new rows.
     * @returns {Promise<Array<ListViewItem>>} A promise that resolves to an array of ListViewItem instances.
     */
    async AddRows(rows, index = 0) {
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreatedList, rows);
        const listItems = [];
        await this.LoadMasterData(rows);
        for (let i = 0; i < rows.length; i++) {
            const row = await this.AddRow(rows[i], index + i, false);
            listItems.push(row);
        }
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreatedList, rows);
        this.AddNewEmptyRow();
        this.AddSummaries();
        this.RenderIndex();
        return listItems;
    }

    AddNewEmptyRow() {
        if (this.Meta && this.Meta.AddRowExp) {
            var addFn = Utils.IsFunction(this.Meta.AddRowExp, false, this);
            if (!addFn) {
                return;
            }
        }
        if (this.Disabled || !this.Meta.CanAdd || (this.EmptySection && this.EmptySection.Children.length > 0)) {
            return;
        }
        let emptyRowData = {};
        emptyRowData[this.IdField] = Uuid7.NewGuid();
        this.GridViewItemEmpty = this.RenderRowData(this.Header, emptyRowData, this.EmptySection, null, true);
        this.StickyColumn(this.GridViewItemEmpty);
        if (!this.Meta.TopEmpty) {
            this.DataTable.insertBefore(this.MainSection.Element, this.EmptySection.Element);
        } else {
            this.DataTable.insertBefore(this.EmptySection.Element, this.MainSection.Element);
        }
        this.GridViewItemEmpty.Children.forEach(x => x.SetRequired());
        this.DispatchCustomEvent(this.Meta.Events, 'AfterEmptyRowCreated', emptyRowData).then(() => {
            this.StickyColumn(this.GridViewItemEmpty);
        });
    }

    async ApplyFilter() {
        this.DataTable.parentElement.scrollTop = 0;
        await this.ReloadData(this.cacheHeader = true);
    }

    ColumnResizeHandler() {
        const createResizableTable = (table) => {
            if (table === null) return;
            const cols = table.querySelectorAll('th');
            cols.forEach((col) => {
                // Add a resizer element to the column
                const resizer = document.createElement('div');
                resizer.classList.add('resizer');

                col.appendChild(resizer);

                createResizableColumn(col, resizer);
            });
        };

        const createResizableColumn = (col, resizer) => {
            let x = 0;
            let w = 0;

            const mouseDownHandler = (e) => {
                e.preventDefault();
                x = e.clientX;

                const styles = window.getComputedStyle(col);
                w = parseInt(styles.width, 10);

                document.addEventListener('mousemove', mouseMoveHandler);
                document.addEventListener('mouseup', mouseUpHandler);

                resizer.classList.add('resizing');
            };

            const mouseMoveHandler = (e) => {
                e.preventDefault();
                const dx = e.clientX - x;
                col.style.width = `${w + dx}px`;
                col.style.minWidth = `${w + dx}px`;
                col.style.maxWidth = `${w + dx}px`;
            };

            const mouseUpHandler = () => {
                // this.UpdateHeader();
                resizer.classList.remove('resizing');
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };

            resizer.addEventListener('mousedown', mouseDownHandler);
        };

        createResizableTable(this.DataTable);
    }

    RenderContent() {
        if (!this.LoadRerender) {
            this.Rerender();
        }
        this.AddSections();
        if (!this._hasFirstLoad) {
            this._hasFirstLoad = true;
            this.DispatchCustomEvent(this.Meta.Events, 'FirstLoad', this).then();
            if (this.VirtualScroll) {
                return;
            }
        }
        let viewPort = this.GetViewPortItem();
        this.FormattedRowData = this.Meta.LocalRender ? this.Meta.LocalData : this.RowData.Data;
        if (!this.FormattedRowData || this.FormattedRowData.length === 0) {
            this.MainSection.DisposeChildren();
            this.DomLoaded();
            return;
        }
        if (this.VirtualScroll && this.FormattedRowData.length > viewPort) {
            this.FormattedRowData = this.FormattedRowData.slice(0, viewPort);
        }
        if (this.MainSection.Children.length > 0) {
            this.UpdateExistRowsWrapper(false, 0, viewPort);
            return;
        }
        this.MainSection.Show = false;
        this.FormattedRowData.forEach(rowData => {
            Html.Take(this.MainSection.Element);
            this.RenderRowData(this.Header, rowData, this.MainSection);
        });
        this.MainSection.Show = true;
        this.ContentRendered();
        this.DomLoaded();
    }

    SetFocusingCom() {
        if (this.AutoFocus) {
            return;
        }
        if (this.EntityFocusId != null && this.LastComponentFocus != null) {
            let element = this.MainSection.Children.flatMap(x => x.Children)
                .find(x => x.Entity[this.IdField].toString() === this.EntityFocusId && x.Meta.Id === this.LastComponentFocus.Id);
            if (element) {
                let lastListView = this.AllListViewItem.find(x => x.Entity[this.IdField].toString() === this.EntityFocusId);
                if (lastListView) {
                    lastListView.Focused(true);
                    element.ParentElement.classList.add("cell-selected");
                    this.LastListViewItem = lastListView;
                    this.LastComponentFocus = element.Meta;
                    this.LastElementFocus = element.Element;
                }
            } else {
                this.HeaderSection.Element.focus();
            }
        } else {
            this.HeaderSection.Element.focus();
        }
    }

    UpdateExistRowsWrapper(dirty, skip, viewPort) {
        if (!this._hasFirstLoad) {
            this._hasFirstLoad = true;
            return;
        }
        this.UpdateExistRows(dirty);
    }

    UpdateExistRows(dirty) {
        const updatedData = this.FormattedRowData.slice();
        const dataSections = this.AllListViewItem.slice(0, updatedData.length);
        dataSections.forEach((child, index) => {
            child.Entity = updatedData[index];
            this.FlattenChildren(child).forEach(x => {
                x.Entity = updatedData[index];
            });
            child.UpdateView();
        });

        const shouldAddRow = this.AllListViewItem.length <= updatedData.length;
        if (shouldAddRow) {
            updatedData.slice(dataSections.length).forEach(newRow => {
                // @ts-ignore
                const rs = this.RenderRowData(this.Header, newRow, this.MainSection);
                this.StickyColumn(rs);
            });
        } else {
            this.MainSection.Children.slice(updatedData.length).forEach(x => x.Dispose());
        }

        if (dirty !== undefined) {
            this.Dirty = dirty;
        }
    }

    FlattenChildren(component) {
        const allChildren = [];
        const stack = [component];
        while (stack.length) {
            const current = stack.pop();
            if (current.Children) {
                allChildren.push(...current.Children);
                current.Children.forEach(child => stack.push(child));
            }
        }
        return allChildren;
    }

    /**
     * @typedef {import("./groupGridView.js").GroupRowData} GroupRowData
     * @param {import("./models/component.js").Component[]} headers
     * @param {GroupRowData} row - Group row data
     * @param {ListViewSection | import("./groupViewItem.js").GroupViewItem} section
     */

    RenderRowData(headers, row, section, index = null, emptyRow = false) {
        const tbody = section.Element;
        Html.Take(tbody);
        const rowSection = new GridViewItem(ElementType.tr);
        rowSection.EmptyRow = emptyRow;
        rowSection.Entity = row;
        rowSection.ParentElement = tbody;
        rowSection.PreQueryFn = this._preQueryFn;
        // @ts-ignore
        rowSection.ListView = this;
        rowSection.Meta = this.Meta
        section.AddChild(rowSection, index);
        var tr = Html.Context;
        tr.tabIndex = -1;
        if (index) {
            if (index >= tr.parentElement.children.length || index < 0) {
                index = 0;
            }
            tr.parentElement.insertBefore(tr, tr.parentElement.children[index]);
        }
        if (headers.length > 0) {
            headers.forEach(header => {
                rowSection.RenderTableCell(row, header);
            });
        }
        if (emptyRow) {
            this.Children.forEach(x => x.AlwaysLogHistory = true);
        }
        return rowSection;
    }

    AddSummaries() {
        if (this.Header.some(x => !Utils.isNullOrWhiteSpace(x.GroupFormat))) {
            this.AllListViewItem.filter(x => x.GroupRow).forEach(item => {
                item.Children.filter(x => !Utils.isNullOrWhiteSpace(x.Meta.GroupFormat)).forEach(itemDetail => {
                    var groupText = Utils.IsFunction(itemDetail.Meta.GroupFormat, false, item);
                    itemDetail.Element.innerHTML = groupText;
                });
            })
        }
        const sums = this.Header.filter(x => !Utils.isNullOrWhiteSpace(x.Summary));
        if (!sums || sums.length == 0) {
            return;
        }
        const summaryElements = this.MainSection.Element.querySelectorAll(`.${this.SummaryClass}`);
        summaryElements.forEach(x => x.remove());
        const count = new Set(sums.map(x => x.Summary)).size;

        sums.forEach(header => {
            this.RenderSummaryRow(header, this.Header, this.FooterSection.Element, count);
        });
    }

    GetStartIndex(ev, addRow) {
        let index = this.AllListViewItem.findIndex(x => x.Selected);
        if (addRow) {
            if (ev.keyCode === KeyCodeEnum.U && (ev.ctrlKey || ev.metaKey)) {
                if (this.Meta.TopEmpty) {
                    index = 0;
                } else {
                    index = this.AllListViewItem[this.AllListViewItem.length - 1].RowNo;
                }
            }
        }
        return index;
    }

    RowsAdded(list, originalRows, copiedRows) {
        const lastChild = list[0] ? list[0].FilterChildren(x => x.Meta.Editable)[0] : null;
        if (lastChild) {
            lastChild.Focus();
        }
        this.RenderIndex();
        if (this.Meta.IsSumary) {
            this.AddSummaries();
        }
        this.ClearSelected();
        list.forEach(item => {
            item.Selected = true;
        });
        this.LastListViewItem = list[0] || null;
        if (this.Meta.IsRealtime) {
            Promise.all(list.map(x => x.PatchUpdateOrCreate())).then(() => {
                Toast.Success("Sao chép dữ liệu thành công!");
                this.Dirty = false;
            });
        } else {
            Toast.Success("Sao chép dữ liệu thành công!");
        }
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterPasted, originalRows, copiedRows);
    }

    RenderSummaryRow(sum, headers, footer, count) {
        let tr = this.CreateSummaryTableRow(sum, footer, count);
        if (!tr) {
            return;
        }

        const hasSummaryClass = tr.classList.contains("summary");
        const colSpan = sum.SummaryColSpan || 0;
        tr.classList.add("summary");
        if (!hasSummaryClass && headers.includes(sum)) {
            this.ResetSummaryRow(tr, colSpan);
        }
        if (!headers.includes(sum)) {
            this.ClearSummaryContent(tr);
            return;
        }
        this.SetSummaryHeaderText(sum, tr);
        this.CalcSumCol(sum, headers, tr, colSpan);
    }

    SetSummaryHeaderText(sum, tr) {
        if (!sum.Summary || sum.Summary.trim() === '') {
            return;
        }

        let cell = tr.cells[0];
        cell.colSpan = sum.SummaryColSpan;
        cell.textContent = sum.Summary;
        cell.classList.add('summary-header');
    }

    /**
     * 
     * @param {Component} sum 
     * @param {HTMLTableSectionElement} footer 
     * @param {Number} count 
     * @returns 
     */
    CreateSummaryTableRow(sum, footer, count) {
        let summaryText = sum.Summary;
        if (!footer) {
            return null;
        }
        let summaryRows = Array.from(footer.rows).filter(row => row.classList.contains('summary'));
        let existSumRow = Array.from(footer.rows).reverse().find(row => row.classList.contains('summary') & Array.from(row.cells).some(cell => cell.textContent === summaryText));
        if (!existSumRow) {
            existSumRow = footer.rows[footer.rows.length - 1];
        }
        /**
         * @type {HTMLTableRowElement}
         */
        var firstChild = null;
        if (this.Editable) {
            if (this.Disabled) {
                firstChild = this.MainSection.Children.find(x => !x.GroupRow).Element;
            }
            else {
                firstChild = this.EmptySection.Element.firstChild;
            }
        }
        else {
            firstChild = this.MainSection.Children.find(x => !x.GroupRow).Element;
        }
        if (!firstChild) {
            if (existSumRow != null) {
                existSumRow.remove();
            }
            return null;
        }
        if (summaryRows.length >= count) {
            this.UpdateTdClassFromFirstChild(existSumRow, firstChild);
            return existSumRow;
        }
        var result = firstChild.cloneNode(true);
        footer.appendChild(result);
        result.childNodes.forEach(x => x.innerHTML = null);
        return result;
    }

    UpdateTdClassFromFirstChild(existSumRow, firstChild) {
        var firstChildTds = firstChild.querySelectorAll("td");
        var existSumRowTds = existSumRow.querySelectorAll("td");
        for (var i = 0; i < firstChildTds.length && i < existSumRowTds.length; i++) {
            existSumRowTds[i].className = firstChildTds[i].className;
        }
    }

    CalcSumCol(header, headers, tr, colSpan) {
        const index = headers.indexOf(header);
        const cellVal = tr.cells[index - colSpan + 1];
        const sum = this.AllListViewItem.filter(x => !x.GroupRow).map(x => x.Entity).reduce((a, b) => a.plus(new Decimal(b[header.FieldName] || 0)), new Decimal(0))
        cellVal.textContent = sum.toFixed(this.Meta.Precision || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    ResetSummaryRow(tr, colSpan) {
        for (let i = 1; i < colSpan; i++) {
            if (tr.cells[0]) {
                tr.cells[0].remove();
            }
        }
        this.ClearSummaryContent(tr);
    }

    ClearSummaryContent(tr) {
        Array.from(tr.cells).forEach(cell => {
            cell.innerHTML = '';
        });
    }

    /**
     * @typedef {import('./listViewItem.js').ListViewItem} ListViewItem
     * Handles custom events based on row changes, applying data updates and managing component state.
     * @param {object} rowData The data of the row that triggered the change.
     * @param {ListViewItem} rowSection The ListViewItem corresponding to the row.
     * @param {import("editableComponent.js").ObservableArgs} observableArgs Additional arguments or data relevant to the event.
     * @param {import("models/observable.js").EditableComponent} [component=null] Optional component that might be affected by the row change.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure of the event handling.
     */
    async RowChangeHandler(rowData, rowSection, observableArgs, component = null) {
        if (rowSection.EmptyRow && observableArgs.EvType === EventType.Change) {
            if (!Utils.isNullOrWhiteSpace(this.Meta.DefaultVal)) {
                var rsObj = Utils.IsFunction(this.Meta.DefaultVal, false, this);
                if (rsObj) {
                    Object.getOwnPropertyNames(rsObj).forEach(x => {
                        rowSection.Entity[x] = rsObj[x];
                    });
                }
            }
            await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreated, rowData, this);
            if (!Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
                let keys = this.Meta.GroupBy.split(",");
                rowSection.Entity[this._groupKey] = keys.map(key => rowSection.Entity[key]).join(" ");
            }
            let rs;
            if (this.Meta.IsRealtime) {
                rs = await rowSection.PatchUpdateOrCreate();
                rowSection.Entity = rs;
                if (this.Meta.ComponentType == "VirtualGrid") {
                    this.CacheData.push(rs);
                }
                this.Dirty = false;
            } else {
                rs = rowSection.Entity;
                this.Dirty = true;
            }
            await this.LoadMasterData([rowSection.Entity]);
            rowSection.UpdateView(true);
            rowSection.EmptyRow = false;
            this.MoveEmptyRow(rowSection);
            this.EmptySection.Children = [];
            this.AddNewEmptyRow();
            this.ClearSelected();
            rowSection.Selected = true;
            rowSection.Focused = true;
            this.LastListViewItem = rowSection;
            this.RenderIndex();
            await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreated, this, rowSection, rowData);
            window.setTimeout(() => {
                this.LastElementFocus.focus();
            }, 100);
        }
        else {
            if (!Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
                let keys = this.Meta.GroupBy.split(",");
                rowSection.Entity[this._groupKey] = keys.map(key => rowSection.Entity[key]).join(" ");
            }
            if (rowSection.GroupSection) {
                if (rowSection.Entity[this._groupKey] != rowSection.GroupSection.Key) {
                    const index = rowSection.GroupSection.ChildrenItems.indexOf(rowSection);
                    if (index > -1) {
                        rowSection.GroupSection.ChildrenItems.splice(index, 1);
                    }
                    if (rowSection.GroupSection.ChildrenItems.length == 0) {
                        const index1 = this.AllListViewItem.indexOf(rowSection.GroupSection);
                        this.AllListViewItem.splice(index1, 1);
                        rowSection.GroupSection.Dispose();
                    }
                    this.MoveGroupRow(rowSection);
                    this.ClearSelected();
                }
                else {
                    var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, rowSection.GroupSection);
                    if (rowSection.GroupSection.GroupText) {
                        rowSection.GroupSection.GroupText.innerHTML = groupText;
                    }
                }
                this.RenderIndex();
            }
        }
        if (component && component.ComponentType == "GridView") {
            await this.DispatchEvent(component.Meta.Events, observableArgs.EvType, this, rowSection, rowData);
        }
        await this.DispatchEvent(this.Meta.Events, observableArgs.EvType, this, rowSection, rowData);
        if (observableArgs.EvType === EventType.Change) {
            this.RenderIndex();
            if (this.Meta.IsSumary) {
                this.AddSummaries();
            }
            this.LastListViewItem = rowSection;
        }
    }

    /**
     * @param {ListViewItem} rowSection
     */
    MoveGroupRow(rowSection) {
        let groupSection = this.AllListViewItem.find(group => group.GroupRow && group.Key === rowSection.Entity[this._groupKey]);
        var currentIndex = this.AllListViewItem.indexOf(rowSection);
        this.AllListViewItem.splice(currentIndex, 1);
        if (groupSection) {
            rowSection.Parent = this.MainSection;
            rowSection.ListViewSection = this.MainSection;
            rowSection.GroupSection = groupSection;
            rowSection.Element.classList.add("group-detail");
            var lastChild = groupSection.ChildrenItems[groupSection.ChildrenItems.length - 1];
            var index = this.AllListViewItem.indexOf(lastChild);
            if (this.AllListViewItem.length == index + 1) {
                this.MainSection.Element.appendChild(rowSection.Element);
            }
            else {
                this.MainSection.Element.insertBefore(rowSection.Element, this.AllListViewItem[index + 1].Element);
            }
            this.AllListViewItem.splice(index + 1, 0, rowSection);
            groupSection.ChildrenItems.push(rowSection);
            this.Dirty = true;
            return rowSection;
        }
        else {
            Html.Take(this.MainSection);
            groupSection = new GroupViewItem(ElementType.tr);
            groupSection.Key = rowSection.Entity[this._groupKey];
            groupSection.Entity = rowSection.Entity;
            groupSection.ParentElement = this.MainSection.Element;
            groupSection.ListViewSection = true;
            groupSection.ListViewSection = this.MainSection;
            groupSection.ListView = this;
            this.MainSection.AddChild(groupSection);
            groupSection.Element.tabIndex = -1;
            var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, rowSection);
            Html.Instance.TData.ClassName("status-cell").EndOf(ElementType.td)
                .TData.Event(EventType.Click, () => this.DispatchClick(rowSection.Entity))
                .Event(EventType.DblClick, () => this.DispatchDblClick(rowSection.Entity))
                .Icon("fal fa-chevron-down").Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).End
                .Div.ClassName("d-flex").InnerHTML(groupText);
            groupSection.GroupText = Html.Context;
            groupSection.Chevron = Html.Context.previousElementSibling;
            groupSection.Chevron.parentElement.previousElementSibling.appendChild(groupSection.Chevron);
            Html.Instance.EndOf(ElementType.td);
            this.Header.slice(2).forEach(item => {
                Html.Instance.TData.ClassName("data-summary").Style("font-weight:600");
                var sec = new Section(null, Html.Context);
                sec.Meta = item;
                groupSection.AddChild(sec);
                Html.Instance.EndOf(ElementType.td);
            });
            Html.Instance.EndOf(ElementType.tr);
            Html.Take(this.MainSection.Element);
            rowSection.Element.classList.add("group-detail");
            groupSection.ChildrenItems.push(rowSection);
            rowSection.GroupSection = groupSection;
            var lastChild = groupSection.ChildrenItems[groupSection.ChildrenItems.length - 1];
            var index = this.AllListViewItem.indexOf(groupSection);
            if (this.AllListViewItem.length == index + 1) {
                this.MainSection.Element.appendChild(rowSection.Element);
            }
            else {
                this.MainSection.Element.insertBefore(rowSection.Element, this.AllListViewItem[index + 1].Element);
            }
            this.AllListViewItem.splice(index + 1, 0, rowSection);
            return rowSection;
        }
    }

    /**
     * @param {ListViewItem} rowSection
     */
    MoveEmptyRow(rowSection) {
        if (this.RowData.Data.includes(rowSection.Entity)) {
            return;
        }
        if (this.Meta.TopEmpty) {
            this.RowData.Data.unshift(rowSection.Entity);
            if (!this.MainSection.Children.includes(this.EmptySection.FirstChild)) {
                this.MainSection.Children.unshift(this.EmptySection.FirstChild);
            }
            this.MainSection.Element.prepend(this.EmptySection.Element.firstElementChild);
        } else {
            this.RowData.Data.push(rowSection.Entity);
            this.MainSection.Element.appendChild(this.EmptySection.Element.firstElementChild);
            if (!this.MainSection.Children.includes(this.EmptySection.FirstChild)) {
                this.MainSection.Children.push(this.EmptySection.FirstChild);
            }
        }
        if (this.Meta.IsRealtime) {
            rowSection.Element.classList.remove("new-row");
        }
        rowSection.Parent = this.MainSection;
        rowSection.ListViewSection = this.MainSection;
    }

    ProcessMetaData(ds, rowCount) {
        let total = ds.length > 1 && ds[1].length > 0 ? ds[1][0]["total"] : null;
        let headers = ds.length > 2 ? ds[2].map(x => Utils.CastProp(x, "Component")) : null;
        this.Settings = ds.length > 3 && ds[3].length > 0 ? Utils.As(ds[3][0], "UserSetting") : null;
        this.FilterColumns(this.MergeComponent(headers, this.Settings));
        this.RenderTableHeader(this.Header);
        if (this.Paginator != null) {
            this.Paginator.Options.Total = total !== null ? total : rowCount;
        }
    }

    HideColumn(...param) {
        if (this.HeaderSection) {
            this.HeaderSection.Children.forEach(column => {
                if (param.includes(column.Meta.FieldName)) {
                    if (column.Element.style.display == "") {
                        var parentElement = this.ThGroup.find(x => x.GroupName == column.Meta.GroupName);
                        if (parentElement) {
                            var col = (parseInt(parentElement.Element.getAttribute("colspan")) - 1);
                            parentElement.Element.setAttribute("colspan", col.toString());
                            if (col == 0) {
                                parentElement.Element.style.display = "none";
                            }
                            else {
                                parentElement.Element.style.display = "";
                            }
                        }
                    }
                    column.Element.style.display = "none";
                }
                else {
                    if (column.Element.style.display == "none") {
                        var parentElement = this.ThGroup.find(x => x.GroupName == column.Meta.GroupName);
                        if (parentElement) {
                            var col = parseInt(parentElement.Element.getAttribute("colspan")) + 1
                            parentElement.Element.setAttribute("colspan", (col).toString());
                            parentElement.Element.style.display = "";
                        }
                    }
                    column.Element.style.display = "";
                }
            })
        }
        if (this.GridViewItemEmpty) {
            this.GridViewItemEmpty.Children.forEach(column => {
                if (param.includes(column.Meta.FieldName)) {
                    column.Element.closest("td").style.display = "none";
                }
                else {
                    column.Element.closest("td").style.display = "";
                }
            })
        }
        if (this.FooterSection && this.FooterSection.Element.firstChild) {
            this.FooterSection.Element.firstChild.childNodes.forEach(column => {
                if (param.includes(column.getAttribute("data-field"))) {
                    column.style.display = "none";
                }
                else {
                    column.style.display = "";
                }
            })
        }
        if (this.AllListViewItem) {
            this.AllListViewItem.forEach(row => {
                if (row.GroupRow) {
                    row.Children.forEach(column => {
                        if (param.includes(column.Meta.FieldName)) {
                            column.Element.style.display = "none";
                        }
                        else {
                            column.Element.style.display = "";
                        }
                    })
                }
                else {
                    row.Children.forEach(column => {
                        if (param.includes(column.Meta.FieldName)) {
                            column.Element.closest("td").style.display = "none";
                        }
                        else {
                            column.Element.closest("td").style.display = "";
                        }
                    })
                }
            })
        }
    }

    ThGroup = [];
    RenderTableHeader(headers) {
        if (!headers || headers.length == 0) {
            headers = this.Header;
        }
        if (headers.Count != this.Header.Count) {
            this.FilterColumns(headers);
        }
        if (this.HeaderSection.Element === null) {
            this.AddSections();
        }
        headers.forEach((x, index) => x.PostOrder = index);
        this.HeaderSection.DisposeChildren();
        const anyGroup = headers.some(x => x.GroupName && !Utils.isNullOrWhiteSpace(x.GroupName));
        Html.Take(this.HeaderSection.Element).Clear().TRow.ForEach(headers, (header, index) => {
            if (anyGroup && !Utils.isNullOrWhiteSpace(header.GroupName)) {
                if (header !== headers.find(x => x.GroupName === header.GroupName)) {
                    return;
                }
                Html.Th.ColSpan(headers.filter(x => x.GroupName === header.GroupName).length);
                this.ThGroup.push({
                    GroupName: header.GroupName,
                    Element: Html.Context
                });
                var groupCom = this.LoadGridPolicy().find(x => x.GroupName == header.GroupName && x.TopEmpty);
                if (groupCom) {
                    Html.Event(EventType.ContextMenu, this.HeaderContextMenu.bind(this), groupCom)
                    var com = ComponentFactory.GetComponent(groupCom, this.EditForm, null, true);
                    com.ParentElement = Html.Context;
                    this.EditForm.AddChild(com);
                    this.EditForm.ChildCom.push(com);
                    if (groupCom.Disabled) {
                        com.SetDisabled(true);
                    }
                    Html.EndOf("th");
                }
                else {
                    Html.IHtml(header.GroupName).End.Render();
                }
                return;
            }
            Html.Th
                .TabIndex(-1).Width(header.AutoFit ? "auto" : header.Width)
                .Style(`${header.Style};min-width: ${header.MinWidth}; max-width: ${header.MaxWidth}`)
                .TextAlign('center')
                .Event(EventType.ContextMenu, this.HeaderContextMenu.bind(this), header)
                .Event(EventType.FocusOut, e => this.FocusOutHeader(e, header))
                .Event(EventType.KeyDown, e => this.ThHotKeyHandler(e, header));
            // @ts-ignore
            var sec = new Section(null, Html.Context);
            sec.Meta = header;
            this.HeaderSection.AddChild(sec);
            if (anyGroup && (!header.GroupName || header.GroupName === "")) {
                Html.Instance.RowSpan(2);
            }
            if (!anyGroup && this.Header.some(x => x.GroupName && x.GroupName.length)) {
                Html.Instance.ClassName("header-group");
            }
            if (header.StatusBar) {
                Html.Instance.A.Icon("fal fa-level-down").Event(EventType.Click, this.ToggleAll.bind(this)).End.End.Render();
            }
            if (header.Icon) {
                Html.Instance.Icon(header.Icon).Margin(Direction.Right, 0).End.Render();
            } else if (!header.StatusBar) {
                if (!anyGroup) {
                    Html.Instance.Event(EventType.Click, e => this.ClickHeader(e, header))
                }
                Html.Instance.IHtml(header.Label).Render();
            }
            if (header.ComponentType === "Number") {
                Html.Instance.Div.End.Render();
                Html.Instance.Span.Style("display: block;").End.Render();
            }
            if (header.Description) {
                Html.Instance.Attr("title", header.Description);
            }
            this.CreateResizableTable(Html.Context);
            Html.Instance.EndOf(ElementType.th);
        }).EndOf(ElementType.tr).Render();

        if (anyGroup) {
            Html.Instance.TRow.ForEach(headers, (header, index) => {
                if (anyGroup && !Utils.isNullOrWhiteSpace(header.GroupName)) {
                    Html.Instance.Th.Style(`min-width: ${header.MinWidth}; max-width: ${header.MaxWidth}`)
                        .TextAlign(header.TextAlignEnum)
                        .Event(EventType.ContextMenu, this.HeaderContextMenu.bind(this), header)
                        .InnerHTML(header.Label);
                    var sec = new Section(null, Html.Context);
                    sec.Meta = header;
                    // @ts-ignore
                    this.HeaderSection.AddChild(sec);
                    Html.Instance.EndOf(ElementType.th);
                }
            });
        }
        this.HeaderSection.Children = this.HeaderSection.Children.sort((a, b) => a.Meta.PostOrder - b.Meta.PostOrder);
    }
    /**
     * @param {HTMLElement} col
     */
    CreateResizableTable(col) {
        var resizer = document.createElement("div");
        resizer.classList.add("resizer");
        col.appendChild(resizer);
        this.CreateResizableColumn(col, resizer);
    }
    /**
     * @param {HTMLElement} col
     * @param {HTMLElement} resizer
     */
    CreateResizableColumn(col, resizer) {
        this.x = 0;
        this.w = 0;
        resizer.addEventListener("mousedown", (e) => this.MouseDownHandler(e, col, resizer));
    }
    /** @type {MouseEvent} */
    mouseMoveHandler;
    /** @type {MouseEvent} */
    mouseUpHandler;
    /** @type {Number} */
    x = 0;
    /** @type {Number} */
    w = 0;
    /**
     * @param {MouseEvent} mouse
     * @param {HTMLElement} col
     * @param {HTMLElement} resizer
     */
    MouseDownHandler(mouse, col, resizer) {
        mouse.preventDefault();
        this.x = mouse.clientX;
        var styles = window.getComputedStyle(col);
        this.w = parseFloat((styles.width.replace("px", "") == "") ? "0" : styles.width.replace("px", ""));
        this.mouseMoveHandler = (a) => this.MouseMoveHandler(a, col, resizer);
        this.mouseUpHandler = (a) => this.MouseUpHandler(a, col, resizer);
        document.addEventListener("mousemove", this.mouseMoveHandler);
        document.addEventListener("mouseup", this.mouseUpHandler);
        resizer.classList.add("resizing");
    }

    /**
     * @param {MouseEvent} mouse
     * @param {HTMLElement} col
     * @param {HTMLElement} resizer
     */
    MouseMoveHandler(mouse, col, resizer) {
        mouse.preventDefault();
        var dx = mouse.clientX - this.x;
        col.style.width = `${this.w + dx}px`;
        col.style.minWidth = `${this.w + dx}px`;
        col.style.maxWidth = `${this.w + dx}px`;
    }
    /**
     * @param {MouseEvent} mouse
     * @param {HTMLElement} col
     * @param {HTMLElement} resizer
     */
    MouseUpHandler(mouse, col, resizer) {
        mouse.preventDefault();
        this.UpdateHeaders();
        resizer.classList.remove("resizing");
        document.removeEventListener("mousemove", this.mouseMoveHandler);
        document.removeEventListener("mouseup", this.mouseUpHandler);
    }

    UpdateHeaders() {
        const headerElements = this.HeaderSection.Children.filter(x => x.Meta && x.Meta.Id);
        let index = 0;
        let anyGroup = this.Header.some(x => x.GroupName && !Utils.isNullOrWhiteSpace(x.GroupName));
        if (!anyGroup) {
            headerElements.forEach(header => {
                header.Order = index;
                index++;
            });
        }
        if (Client.SystemRole) {
            const columns = headerElements.map(header => {
                const match = header.Element;
                if (match && !header.Meta.StatusBar && Utils.isNullOrWhiteSpace(match.style.display)) {
                    const width = `${match.offsetWidth}px`;
                    const dirtyPatch = [
                        { Field: "Id", Value: header.Meta.Id },
                        Utils.isNullOrWhiteSpace(header.GroupName) ? { Field: "Width", Value: width } : { Field: "Width", Value: header.Meta.Width },
                        Utils.isNullOrWhiteSpace(header.GroupName) ? { Field: "MaxWidth", Value: width } : { Field: "MaxWidth", Value: header.Meta.MaxWidth },
                        Utils.isNullOrWhiteSpace(header.GroupName) ? { Field: "MinWidth", Value: width } : { Field: "MinWidth", Value: header.Meta.MinWidth },
                    ];
                    if (!anyGroup) {
                        dirtyPatch.push({ Field: "Order", Value: header.Order })
                    }
                    return {
                        Changes: dirtyPatch,
                        NotMessage: true,
                        Table: "Component",
                    };
                }
                return null;
            }).filter(x => x != null);
            columns.forEach(item => {
                Client.Instance.PatchAsync(item).then();
            });
        }
        else {
            const columns = headerElements.map(header => {
                const match = header.Element;
                if (match && !header.Meta.StatusBar && !Utils.isNullOrWhiteSpace(header.Meta.FieldName) && Utils.isNullOrWhiteSpace(match.style.display)) {
                    const width = `${match.offsetWidth}px`;
                    return {
                        Id: header.Meta.Id,
                        FieldName: header.Meta.FieldName,
                        Order: header.Order,
                        Width: width,
                    };
                }
                return null;
            }).filter(x => x != null);
            var userSetting = new UserSetting();
            userSetting.FeatureId = this.EditForm.Meta.Id;
            userSetting.ComponentId = this.Meta.Id;
            userSetting.Active = true;
            userSetting.Value = JSON.stringify(columns);
            Client.Instance.PostAsync(userSetting, "/api/UserSetting").then();
        }
    }

    ChangeHeader(e, header) {
        clearTimeout(this._imeout);
        this._imeout = setTimeout(() => {
            let html = e.target;
            let patchVM = {
                Table: "Component",
                Changes: [
                    { Field: "Component.Id", Value: header.Id, OldVal: header.Id },
                    { Field: "Component.Label", Value: html.textContent.trim(), OldVal: header.Label }
                ]
            };
            // @ts-ignore
            Client.Instance.PatchAsync(patchVM);
        }, 1000);
    }

    UpdatePagination(total, currentPageCount) {
        if (!this.Paginator) {
            return;
        }
        var options = this.Paginator.Options;
        options.Total = total;
        options.CurrentPageCount = currentPageCount;
        options.PageNumber = (options.PageIndex || 0) + 1;
        options.StartIndex = (options.PageIndex || 0) * options.PageSize + 1;
        options.EndIndex = options.StartIndex + options.CurrentPageCount;
        this.Paginator.UpdateView();
        if (total <= this.Meta.Row) {
            this.Paginator.Show = false;
        }
        else {
            this.Paginator.Show = true;
        }
    }

    ToggleAll() {
        const anySelected = this.AllListViewItem.some(x => x.Selected);
        if (anySelected) {
            this.ClearSelected();
            return;
        }
        this.AllListViewItem.forEach(x => {
            x.Selected = true;
        });
    }

    HeaderContextMenu(e, header) {
        e.preventDefault();
        e.stopPropagation();
        if (Client.SystemRole) {
            var menu = ContextMenu.Instance;
            menu.Top = e.clientY;
            menu.Left = e.clientX;
            menu.MenuItems = [];
            menu.MenuItems.push(
                { Icon: "fal fa-wrench", Text: "Column Properties", Click: () => this.EditForm.ComponentProperties(header), },
                { Icon: "fal fa-table", Text: "Table Properties", Click: () => this.EditForm.ComponentProperties(this.Meta), },
            );
            menu.Render();
        }
    }

    HideWidth(header, e) {
        const targetElement = e.target.closest('th');
        if (targetElement) {
            targetElement.style.minWidth = "";
            targetElement.style.maxWidth = "";
            targetElement.style.width = "";
        }
        this.UpdateHeaders();
    }

    GetHeaderSettings() {
        const headerElement = {};
        this.HeaderSection.Children.filter(x => x.Meta?.Id != null).forEach(x => {
            headerElement[x.Meta.Id] = x;
        });

        const ele = Array.from(this.HeaderSection.Element.firstElementChild.children);
        this.HeaderSection.Children.forEach(x => {
            x.Meta.Order = ele.indexOf(x.Element);
        });

        const columns = this.Header.filter(x => x.Id != null).map(x => {
            const match = headerElement[x.Id];
            if (!match) return null;
            x.Width = `${match.Element.offsetWidth}px`;
            x.MaxWidth = `${match.Element.offsetWidth}px`;
            x.MinWidth = `${match.Element.offsetWidth}px`;
            return x;
        }).filter(x => x != null);
        return columns.sort((a, b) => (a.Frozen - b.Frozen) || (a.Order - b.Order));
    }

    ShowWidth(arg) {
        const entity = arg.header;
        const e = arg.events;
        if (e.target.firstChild && !e.target.firstChild.length) {
            e.target.prepend(document.createTextNode(entity.ShortDesc));
        }
        e.target.style.minWidth = "";
        e.target.style.maxWidth = "";
        e.target.style.width = "";

        this.UpdateHeaders();
    }

    FrozenColumn(arg) {
        const entity = arg.header;
        const header = this.Header.find(x => x.Id === entity.Id);
        if (header) {
            header.Frozen = !header.Frozen;
        }
        this.UpdateHeaders();
    }

    CloneHeader(arg) {
        {
            var entity = arg;
            var confirm = new ConfirmDialog
            confirm.Content = "Bạn có chắc chắn muốn clone cột này không?";
            confirm.Render();
            confirm.YesConfirmed += () => {
                var cloned = entity.Clone();
                cloned.Id = Uuid7.Id25();
                var patch = cloned.MapToPatch();
                Client.Instance.PatchAsync(patch).then(success => {
                    if (success == 0) {
                        Toast.Warning("Clone error");
                        return;
                    }
                    this.Header.push(cloned);
                    // @ts-ignore
                    this.Header = this.Header.sort((a, b) => b.Frozen - a.Frozen || b.ComponentType === "Button" - a.ComponentType === "Button" || a.Order - b.Order);
                    this.Rerender();
                    Toast.Success("Clone success");
                }).catch(e => {
                    Toast.Warning("Clone header NOT success");
                });
            };
        }
    }

    RemoveHeader(arg) {
        var entity = arg;
        var confirm = new ConfirmDialog
        confirm.Content = "Bạn có chắc chắn muốn clone cột này không?";
        confirm.Render();
        confirm.YesConfirmed += () => {
            const ids = [entity.Id];
            Client.Instance.HardDeleteAsync(ids, 'Component', this.MetaConn, this.MetaConn)
                .then(success => {
                    if (!success) {
                        Toast.Warning("delete error");
                        return;
                    }
                    Toast.Success("Delete success");
                    this.Header.Remove(entity);
                    this.Rerender();
                });
        };
    }

    RemoveRowById(id) {
        super.RemoveRowById(id);
        this.RenderIndex();
    }

    RemoveRow(row) {
        super.RemoveRow(row);
        this.RenderIndex();
    }

    HardDeleteConfirmed(deleted) {
        return new Promise((resolve, reject) => {
            super.HardDeleteConfirmed(deleted).then(res => {
                this.RenderIndex();
                if (this.Meta.IsSumary) {
                    this.AddSummaries();
                }
                resolve(res);
            }).catch(err => reject(err));
        });
    }

    /**
     * @param {boolean} force
     * @param {boolean} dirty
     */
    PrepareUpdateView(force, dirty) {
        super.PrepareUpdateView(force, dirty);
        if (this.Meta && this.Meta.AddRowExp) {
            this.ToggleAddRow(this.Meta.AddRowExp);
        }
    }

    /**
     * 
     * @param {Boolean | String | Function} disabled 
     */
    ToggleAddRow(add) {
        if (add instanceof Boolean) {
            if (add) {
                this.AddNewEmptyRow();
            }
            else {
                if (this.GridViewItemEmpty) {
                    this.GridViewItemEmpty.Dispose();
                    this.GridViewItemEmpty = null;
                }
            }
            return;
        }
        var addFn = Utils.IsFunction(add, false, this);
        if (addFn) {
            this.AddNewEmptyRow();
        }
        else {
            if (this.GridViewItemEmpty) {
                this.GridViewItemEmpty.Dispose();
                this.GridViewItemEmpty = null;
            }
        }
    }

    UpdateView(force = false, dirty = null, componentNames = []) {
        if (!this.Editable && !this.Meta.CanCache) {
            this.ActionFilter();
        } else {
            this.RowAction(row => !row.EmptyRow, row => row.UpdateView(force, dirty, componentNames));
        }
    }

    async RowChangeHandlerGrid(rowData, rowSection, observableArgs, component = null) {
        await new Promise(resolve => setTimeout(resolve, this.CellCountNoSticky));
        if (rowSection.EmptyRow && observableArgs.EvType === EventType.Change) {
            await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreated, rowData);
            rowSection.EmptyRow = false;
            this.MoveEmptyRow(rowSection);
            const headers = this.Header.filter(y => y.Editable);
            const currentComponent = headers.find(y => y.FieldName === component.FieldName);
            const index = headers.indexOf(currentComponent);
            if (headers.length > index + 1) {
                const nextGrid = headers[index + 1];
                const nextComponent = rowSection.Children.find(y => y.FieldName === nextGrid.FieldName);
                if (nextComponent) {
                    nextComponent.Focus();
                }
            }
            this.EmptySection.Children = [];
            this.AddNewEmptyRow();
            await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreated, rowData);
        }
        this.AddSummaries();
        await this.DispatchEvent(this.Meta.Events, EventType.Change, rowData);
    }

    GetViewPortItem() {
        if (!this.Element || !this.Element.classList.contains('sticky')) {
            return this.RowData.Data.length;
        }
        let mainSectionHeight = this.Element.clientHeight
            - (this.HeaderSection.Element ? this.HeaderSection.Element.clientHeight : 0)
            - this.Paginator.Element.clientHeight
            - this._theadTable;

        this.Header = this.Header.filter(x => x != null);

        if (this.Header.some(x => x.Summary && x.Summary.trim() !== "")) {
            mainSectionHeight -= this._tfooterTable;
        }
        if (this.Meta.CanAdd) {
            mainSectionHeight -= this._rowHeight;
        }
        return this.GetRowCountByHeight(mainSectionHeight);
    }
}
