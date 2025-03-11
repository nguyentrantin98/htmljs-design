import { EditableComponent } from "./editableComponent.js";
import {
    ObservableArgs, EventType, SqlViewModel, PatchVM, FeaturePolicy,
    CustomEventType, Component, Action, ElementType, EntityRef,
    ComponentType
} from "./models/";
import { ActiveStateEnum, AdvSearchVM, CellSelected, MQEvent, OperatorEnum, OrderBy, Where } from "./models/enum.js";
import { Paginator } from "./paginator.js";
import { Utils } from "./utils/utils.js";
import { ObservableList } from './models/observableList.js';
import { ListViewSection } from "./listViewSection.js";
import { Html } from "./utils/html.js";
import { ContextMenu } from "./contextMenu.js";
import { Client } from "./clients/client.js";
import { ListViewSearch } from "./listViewSearch.js";
import { ListViewItem } from "./listViewItem.js";
import { Toast } from "./toast.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { ConfirmDialog } from "./confirmDialog.js";
import { ComponentExt } from "./index.js";
import { Datepicker } from "./index.js";
import * as XLSX from 'xlsx';
import { Select } from "./select.js";
import { Label } from "./label.js";
/**
 * Represents a list view component that allows editable features and other interactions like sorting and pagination.
 * @typedef {import('./searchEntry.js').SearchEntry} SearchEntry
 * @typedef {import('./tabEditor.js').TabEditor} TabEditor
 * @typedef {import('./gridView.js').GridView} GridView
 */
export class ListView extends EditableComponent {
    SelectedIds = [];
    /** @type {ListViewSection} */
    MainSection;
    /**
     * @type {OrderBy[]}
     */
    OrderBy = [];
    /**
     * @type {any[]}
     */
    CacheData = [];
    /**
     * @type {any[]}
     */
    RefData = [];
    DataLoaded = new Action();
    DblClick = new Action();
    RowClick = new Action();
    VirtualScroll = false;
    _groupKey = "__groupkey__";
    GroupRowClass = "group-row";
    /** @type {string} */
    FocusId;
    get Editable() { return this.Meta.CanWrite; }
    /**
     * Constructs an instance of ListView with the specified UI component.
     * @param {Component} ui The UI component associated with this list view.
     * @param {HTMLElement} [ele] Optional HTML element.
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.IsListView = true;
        this.DeleteTempIds = [];
        this.Meta = ui;
        this.Id = ui.Id;
        this.Name = ui.FieldName;
        /** @type {Component[]} */
        this.Header = [];
        this.RowData = new ObservableList();
        /** @type {AdvSearchVM} */
        // @ts-ignore
        this.AdvSearchVM = {
            ActiveState: ActiveStateEnum.Yes,
            Conditions: [],
            AdvSearchConditions: [],
            OrderBy: localStorage.getItem('OrderBy' + this.Meta.Id) ?? []
        };
        this._hasLoadRef = false;
        if (ele !== null) {
            this.Resolve(ui, ele);
        }
        this.CanDelete = true;
        this._rowHeight = this.Meta.BodyItemHeight ?? 26;
        this._theadTable = this.Meta.HeaderHeight ?? 40;
        this._tfooterTable = this.Meta.FooterHeight ?? 35;
        this._scrollTable = this.Meta.ScrollHeight ?? 10;
        this._preQueryFn = Utils.IsFunction(this.Meta.PreQuery, false, this);
        /** @type {ListViewItem} */
        this.LastShiftViewItem = undefined;
        /** @type {number} */
        this.LastIndex = undefined;
        this.EntityFocusId = "";
        /** @type {HTMLElement} */
        this.LastElementFocus = null;
        /** @type {Component} */
        this.LastComponentFocus = null;
        this.ToolbarColumn = {
            StatusBar: true,
            Label: '',
            Frozen: true
        };
        this.LastColumn = {
            ComponentType: "Label",
            Width: "100%",
            Label: '',
            Order: 10000
        };
    }
    /**
     * Resolves additional configurations or setup for the component.
     * @param {Component} com The component to configure.
     * @param {HTMLElement} [ele] Optional HTML element to use in the resolution.
     */
    Resolve(com, ele = null) {
        let txtArea = document.createElement('textarea');
        txtArea.innerHTML = ele.innerHTML;
        com.FormatEntity = txtArea.value;
        ele.innerHTML = null;
    }

    /** @type {FeaturePolicy[]} */
    GridPolicies = [];
    /** @type {FeaturePolicy[]} */
    GeneralPolicies = [];
    /**
     * Renders the list view, setting up necessary configurations and data bindings.
     */
    Render() {
        if (this.EditForm) {
            this.GeneralPolicies = this.EditForm.Policies;
        }
        Html.Take(this.ParentElement).DataAttr('name', this.Name);
        this.AddSections();
        this.SetRowDataIfExists();
        if (this.Meta.LocalRender) {
            this.LocalRender();
        }
        else {
            this.LoadAllData();
        }
    }

    /**
     * Renders the list view either by re-rendering or using locally stored data based on the configuration.
     */
    LocalRender() {
        // Setting the header from the local metadata configuration
        this.Header = this.Header ?? this.Meta.LocalHeader;

        if (this.Meta.LocalRender) {
            // If local rendering is enabled, re-render the view
            this.Rerender();
        } else {
            // If local rendering is not enabled, use the local data directly
            this.RowData.Data = this.Meta.LocalData;
        }
    }

    Rerender() {
        this.MainSection.DisposeChildren();
        Html.Take(this.MainSection.Element).Clear();
        this.RenderContent();
    }
    /**
     * Reloads data for the list view, potentially using cached headers and considering pagination settings.
     * @param {boolean} [cacheHeader=false] Specifies whether headers should be cached.
     * @param {number} [skip=null] Specifies the number of items to skip (for pagination).
     * @param {number} [pageSize=null] Specifies the size of the page to load.
     * @returns {Promise<any[]>} A promise that resolves to the list of reloaded data objects.
     */
    async ReloadData(cacheHeader = false, skip = null, pageSize = null) {
        if (Utils.isNullOrWhiteSpace(this.Meta.RefName)) {
            var data = Utils.IsFunction(this.Meta.Query, false, this);
            await this.LoadMasterData(data);
            this.SetRowData(data);
            this.Paginator.Show = false;
            return data;
        }
        if (this.Meta.Editable && this.Entity[this.Meta.FieldName] && this.Entity[this.Meta.FieldName] instanceof Array && this.Entity[this.Meta.FieldName].length > 0) {
            var rows = this.Entity[this.Meta.FieldName];
            /**
             * @type {[]}
             */
            var rows = this.Entity[this.Meta.FieldName];
            if (!Utils.isNullOrWhiteSpace(this.Meta.DefaultVal)) {
                var rsObj = Utils.IsFunction(this.Meta.DefaultVal, false, this);
                if (rsObj) {
                    rows.forEach(item => {
                        item["InsertedBy"] = this.Token.UserId;
                        Object.getOwnPropertyNames(rsObj).forEach(x => {
                            item[x] = rsObj[x];
                        });
                    })
                }
            }
            else {
                rows.forEach(item => {
                    item["InsertedBy"] = this.Token.UserId;
                })
            }
            await this.LoadMasterData(rows);
            this.SetRowData(rows);
            this.Paginator.Show = false;
            return rows;
        }
        if (this.Paginator != null) {
            this.Paginator.Options.PageSize = this.Paginator.Options.PageSize === 0 ? (this.Meta.Row ?? 12) : this.Paginator.Options.PageSize;
        }
        pageSize = (pageSize ?? this.Paginator?.Options?.PageSize ?? this.Meta.Row) ?? 20;
        skip = !skip ? (this.Paginator?.Options?.PageIndex * pageSize) : 0;
        let sql = this.GetSql(skip, pageSize, cacheHeader);
        return await this.CustomQuery(sql);
    }

    CalcFilterQuery() {
        return this.ListViewSearch.CalcFilterQuery();
    }

    /**
     * @param {Event} e
     */
    async ExportExcelTemplate(e) {
        const wb = XLSX.utils.book_new();
        const ws_data = [];
        var headers = this.Header.filter(x => x.Label);
        ws_data.push(headers.map(x => x.Label));
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, 'TemplateImport');
        for (let index = 0; index < headers.length; index++) {
            if (headers[index].ComponentType == "Dropdown") {
                const ws_master_data = [];
                var headers_master = JSON.parse(headers[index].Template);
                ws_master_data.push(headers_master.map(x => x.Label));
                const data = await Client.Instance.SubmitAsync({
                    NoQueue: true,
                    Url: `/api/feature/com`,
                    Method: "POST",
                    JsonData: JSON.stringify({
                        ComId: headers[index].Id,
                        Count: false,
                        Top: 100000,
                        Skip: 0,
                        OrderBy: "ds.InsertedDate asc",
                    }),
                });
                data.value.forEach(item => {
                    ws_master_data.push(headers_master.map(x => item[x.FieldName] || ""));
                })
                const ws_master = XLSX.utils.aoa_to_sheet(ws_master_data);
                XLSX.utils.book_append_sheet(wb, ws_master, headers[index].Label);
            }
        }
        XLSX.writeFile(wb, 'TemplateImport' + this.Meta.Label + '.xlsx');
    }
    /**
     * @param {Event} e
     */
    async ImportExcelTemplate(e) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xlsx, .xls';
        fileInput.addEventListener('change', (event) => {
            if (event.target.files.length > 0) {
                this.ActImportExcelTemplate(event);
            }
        });
        fileInput.click();
    }
    /**
    * @param {Event} e
    */
    async ActImportExcelTemplate(e) {
        try {
            const file = e.target.files[0];
            if (!file) {
                alert("No file selected.");
                return;
            }
            const reader = new FileReader();
            reader.onload = async (event) => {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 0 });
                if (jsonData.length === 0) {
                    alert("The selected file is empty or not in the expected format.");
                    return;
                }
                var masterName = [];
                var newObject = jsonData.map(rsObj => {
                    var item = {
                        Id: Uuid7.NewGuid()
                    };
                    Object.getOwnPropertyNames(rsObj).forEach(x => {
                        var com = this.Header.find(y => y.Label == x);
                        if (com) {
                            item[com.FieldName] = rsObj[x];
                            if (!Utils.isNullOrWhiteSpace(com.RefName)) {
                                masterName.push({
                                    TableName: com.RefName,
                                    Format: com.FormatData,
                                    Id: rsObj[x],
                                });
                            }
                        }
                    });
                    return item;
                });
                var groupedList = Object.values(masterName.reduce((acc, curr) => {
                    let existing = acc.find(item => item.TableName === curr.TableName);
                    if (!existing) {
                        existing = { TableName: curr.TableName, Format: curr.Format, Id: [] };
                        acc.push(existing);
                    }
                    if (!existing.Id.includes(curr.Id)) {
                        existing.Id.push(curr.Id);
                    }
                    return acc;
                }, []));
                let dataTasks = groupedList.map(x => ({
                    Header: x.TableName,
                    Data: Client.Instance.GetByNameAsync(x.TableName, x.Id, x.Format)
                }));
                let results = await Promise.all(dataTasks.map(x => x.Data));
                dataTasks.forEach((task, index) => {
                    task.Data = results[index];
                    if (!task.Data.data) {
                        return;
                    }
                    newObject.forEach(item => {
                        Object.getOwnPropertyNames(item).forEach(x => {
                            var com = this.Header.find(y => y.FieldName == x && y.RefName == task.Header);
                            if (com) {
                                var format = com.FormatData.replaceAll("{", "").replaceAll("}", "");
                                var mapItem = task.Data.data.find(x => x[format] == item[com.FieldName]);
                                if (mapItem) {
                                    item[com.FieldName] = mapItem.Id;
                                }
                                else {
                                    item[com.FieldName] = null;
                                }
                            }
                        });
                    })
                });
                this.EditForm[this.Meta.EntityName || "Entity"][this.Meta.FieldName] = newObject;
                await this.ReloadData();
                this.Dirty = true;
                this.DispatchEvent(this.Meta.Events, EventType.Change, this).then(() => {
                    resolve(false);
                });
            };
            reader.onerror = () => {
                alert("Error reading the file.");
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Import Error:", error.message);
            alert("Failed to import file: " + error.message);
        }
    }

    /** @type {Where[]} */
    Wheres = [];
    /**
     * Gets the SQL for data retrieval based on the current state of the list view.
     * @param {number} [skip=null] Number of records to skip for pagination.
     * @param {number} [pageSize=null] Page size for pagination.
     * @param {boolean} [cacheMeta=false] Whether to cache meta information.
     * @param {boolean} [count=true] Whether to include a count of total records.
     * @returns {SqlViewModel} The SQL view model with query details.
     */
    GetSql(skip = null, pageSize = null, cacheMeta = false, count = true) {
        let submitEntity = Utils.IsFunction(this.Meta.PreQuery, true, this);
        let basicCondition = this.CalcFilterQuery();
        if (!submitEntity) {
            submitEntity = {};
        }
        var operatorsValue = basicCondition.filter(x => x.Value).map(item => {
            return {
                FieldName: item.FieldName,
                Value: item.Value,
            }
        }) || {};
        let finalCon = basicCondition
            .filter(x => x.Where)
            .map((x, index) => {
                return index === 0 ? x.Where : `${x.Operator} ${x.Where}`;
            })
            .join(" ");
        var orderby = this.SearchSection.Children.filter(x => x.IsOrderBy).map(x => "ds." + x.Meta.FieldName + " " + x.OrderMethod).Combine(x => x, ", ");
        /** @type {SqlViewModel} */
        // @ts-ignore
        var res = {
            ComId: this.Meta.Id,
            Params: submitEntity ? JSON.stringify(submitEntity) : null,
            WhereParams: JSON.stringify(operatorsValue),
            OrderBy: !orderby ? (!this.Meta.OrderBy ? (this.Meta.Editable ? "ds.InsertedDate asc" : "ds.InsertedDate desc") : this.Meta.OrderBy) : orderby,
            Where: finalCon,
            Count: count,
            Skip: skip,
            Top: pageSize,
            SkipXQuery: cacheMeta,
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
        };
        return res;
    }

    ShouldSetEntity = true;
    /**
     * 
     * @param {any[]} listData 
     */
    SetRowData(listData) {
        listData = listData ?? [];
        this.RowData._data = listData;
        this.RenderContent();
    }

    /**
     * Executes a custom SQL query using the provided SQL view model.
     * @param {SqlViewModel} vm The view model containing SQL query details.
     * @returns {Promise<any[]>} A promise that resolves to the list of data objects retrieved.
     */


    async CustomQuery(vm) {
        try {
            const data = await Client.Instance.SubmitAsync({
                NoQueue: true,
                Url: `/api/feature/com`,
                Method: "POST",
                JsonData: JSON.stringify(vm),
            });
            if (!data.value || data.value.length === 0) {
                this.Paginator.Show = false;
                this.ClearRowData();
                this.SetRowData([]);
                this.DomLoaded();
                return [];
            }
            else {
                let total = data.count && data.count > 0 ? data.count : data.value.length;
                let rows = [...data.value];
                this.ClearRowData();
                this.UpdatePagination(total, rows.length);
                await this.LoadMasterData(rows);
                this.SetRowData(rows);
                return rows;
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    LoadLocalData(rows) {
        var locals = this.Header.filter(x => ["Dropdown", "Select"].some(y => y == x.ComponentType) && Utils.isNullOrWhiteSpace(x.RefName));
        for (const header of locals) {
            let containId = header.FieldName.substr(header.FieldName.length - 2) === this.IdField;
            let objField = "";
            if (containId) {
                objField = header.FieldName.substr(0, header.FieldName.length - 2);
            }
            else {
                objField = header.FieldName + "MasterData";
            }
            rows.forEach(row => {
                var data = Utils.IsFunction(header.Query, false, this);
                let found = data.find(source => source[this.IdField] === row[header.FieldName]);
                if (found) {
                    row[objField] = found;
                }
            });
        }
    }

    async LoadMasterData(rows = null, spinner = true) {
        if (!Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
            let keys = this.Meta.GroupBy.split(",");
            rows.forEach(item => {
                item[this._groupKey] = keys.map(key => item[key]).join(" ");
            });
            rows = rows.sort((a, b) => {
                if (a[this._groupKey] === b[this._groupKey]) {
                    return a.InsertedDate - b.InsertedDate;
                } else {
                    return a[this._groupKey] - b[this._groupKey];
                }
            });
        }
        var headers = this.Header.filter(x => !Utils.isNullOrWhiteSpace(x.RefName));
        if (headers.length == 0) {
            this.LoadLocalData(rows)
            return;
        }
        rows = rows || this.RowData.Data;
        let dataSource = headers.filter((obj, index, self) =>
            index === self.findIndex((t) => (
                t.RefName === obj.RefName
            ))
        ).map(x => this.FormatDataSourceByEntity(x, headers, rows)).filter(x => x !== null);
        if (dataSource.length == 0) {
            this.LoadLocalData(rows)
            return;
        }

        let dataTasks = dataSource
            .filter(x => x.DataSourceOptimized).map(x => ({
                Header: x,
                Data: Client.Instance.GetByIdAsync(x.RefName, x.DataSourceOptimized)
            }));

        let results = await Promise.all(dataTasks.map(x => x.Data));
        dataTasks.forEach((task, index) => {
            task.Data = results[index];
            if (!task.Data.data) {
                return;
            }
            this.setRemoteSource(task.Data.data, task.Header.RefName, task.Header);
        });
        this.SyncMasterData(rows, headers);
    }

    setRemoteSource(remoteData, typeName, header) {
        let localSource = this.RefData[typeName];
        if (!localSource) {
            this.RefData[typeName] = remoteData;
        } else {
            remoteData.forEach(item => {
                if (!localSource.some(localItem => localItem[this.IdField] === item[this.IdField])) {
                    localSource.push(item);
                }
            });
        }
        var headers = this.Header.filter(x => x.RefName == header.RefName);
        headers.forEach(item => {
            item.LocalData = remoteData;
        })
    }

    SyncMasterData(rows = null, headers = null) {
        rows = rows || this.RowData.Data;
        headers = headers || this.Header;

        headers.filter(x => x.RefName).forEach(header => {
            if (!header.FieldName || header.FieldName.length <= 2) {
                return;
            }
            let containId = header.FieldName.substr(header.FieldName.length - 2) === this.IdField;
            let objField = "";
            if (containId) {
                objField = header.FieldName.substr(0, header.FieldName.length - 2);
            }
            else {
                objField = header.FieldName + "MasterData";
            }
            rows.forEach(row => {
                let propType = header.RefName;
                if (!propType) {
                    return;
                }

                let propVal = row[objField];
                let found = this.RefData[propType]?.find(source => source[this.IdField] === row[header.FieldName]);
                if (found) {
                    row[objField] = found;
                } else if (propVal && !found) {
                    this.RefData[propType] = this.RefData[propType] || [];
                    this.RefData[propType].push(propVal);
                }
            });
        });
        var locals = this.Header.filter(x => ["Dropdown", "Select"].some(y => y == x.ComponentType) && Utils.isNullOrWhiteSpace(x.RefName));
        for (const header of locals) {
            let containId = header.FieldName.substr(header.FieldName.length - 2) === this.IdField;
            let objField = "";
            if (containId) {
                objField = header.FieldName.substr(0, header.FieldName.length - 2);
            }
            else {
                objField = header.FieldName + "MasterData";
            }
            rows.forEach(row => {
                var data = Utils.IsFunction(header.Query, false, this);
                let found = data.find(source => source[this.IdField] === row[header.FieldName]);
                if (found) {
                    row[objField] = found;
                }
            });
        }
    }

    FormatDataSourceByEntity(currentHeader, allHeaders, entities) {
        let entityIds = allHeaders
            .filter(x => x.RefName === currentHeader.RefName)
            .flatMap(x => this.getEntityIds(x, entities))
            .filter((v, i, a) => a.indexOf(v) === i);

        if (entityIds.length === 0) {
            return null;
        }

        currentHeader.DataSourceOptimized = entityIds.sort();
        return currentHeader;
    }

    getEntityIds(header, entities) {
        if (!entities || entities.length === 0) {
            return [];
        }

        let ids = [];
        entities.forEach(x => {
            let id = !x[header.FieldName] ? null : x[header.FieldName].toString();
            if (!id) {
                return;
            } else if (id.includes(',')) {
                ids.push(...id.split(',').map(y => y));
            } else {
                ids.push(id);
            }
        });
        return ids;
    }

    /**
     * Updates pagination details based on total data and current page count.
     * @param {number} total The total number of records.
     * @param {number} currentPageCount The number of records in the current page.
     */
    UpdatePagination(total, currentPageCount) {
        if (!this.Paginator) {
            return;
        }
        let options = this.Paginator.Options;
        options.Total = total;
        options.CurrentPageCount = currentPageCount;
        options.PageNumber = options.PageIndex + 1;
        options.StartIndex = options.PageIndex * options.PageSize + 1;
        options.EndIndex = options.StartIndex + options.CurrentPageCount - 1;
        this.Paginator.UpdateView();
    }

    /**
     * Adds sections to the ListView based on the component configurations.
     */
    AddSections() {
        if (this.Meta.LiteGrid) {
            this.Element = this.ParentElement;
            this.Element.innerHTML = null;
            this.MainSection = new ListViewSection(null, this.ParentElement);
            this.AddChild(this.MainSection);
            return;
        }
        Html.Take(this.ParentElement).Div.ClassName("grid-wrapper");
        this.Element = Html.Context;
        if (this.Meta.CanSearch) {
            Html.Instance.Div.Div.ClassName("grid-toolbar search").End.Render();
            Html.Instance.Div.ClassName("button-toolbar").End.End.Render();
        }
        this.ListViewSearch = new ListViewSearch(this.Meta);
        this.AddChild(this.ListViewSearch);
        Html.Take(this.Element).Div.ClassName("list-content").End.Div.ClassName("empty");
        this.EmptySection = new ListViewSection(null, Html.Context);
        this.EmptySection.ParentElement = this.Element;
        this.AddChild(this.EmptySection);

        // @ts-ignore
        this.MainSection = new ListViewSection(null, this.EmptySection.Element.previousElementSibling);
        this.AddChild(this.MainSection);

        Html.Instance.EndOf(".list-content");
        this.RenderPaginator();
    }

    /** @type {any[]} */
    FormattedRowData = [];
    /**
     * Renders the content within the main section of the ListView.
     */
    RenderContent() {
        this.MainSection.DisposeChildren();
        this.EmptySection?.DisposeChildren();
        this.FormattedRowData = this.FormattedRowData.length == 0 ? this.RowData.Data : this.FormattedRowData;
        if (this.FormattedRowData.length == 0) {
            return;
        }

        this.FormattedRowData.forEach((rowData, index) => {
            this.RenderRowData(this.Header, rowData, this.MainSection);
        });
        this.ContentRendered();
    }

    /**
     * Renders the data for each row within the list view.
     * @param {Component[]} headers The headers to use in the row.
     * @param {object} row The data object for the row.
     * @param {ListViewSection} section The section where the row is to be added.
     * @param {number} [index=null] Optional index for the row.
     * @param {boolean} [emptyRow=false] Indicates if the row is empty.
     * @returns {ListViewItem} The ListViewItem created for the row.
     */
    RenderRowData(headers, row, section, index = null, emptyRow = false) {
        let rowSection = this.Meta.LiteGrid ? new ListViewItem() : new ListViewItem('div');
        rowSection.EmptyRow = emptyRow;
        rowSection.Entity = row;
        rowSection.ParentElement = section.Element;
        rowSection.ListView = this;
        rowSection.ListViewSection = section instanceof ListViewSection ? section : null;
        rowSection.Meta = this.Meta;
        rowSection.EditForm = this.EditForm;
        section.AddChild(rowSection, index);
        rowSection.RenderRowData(headers, row, index, emptyRow);
        return rowSection;
    }

    /**
     * Clears all row data from the ListView.
     */
    ClearRowData() {
        this.RowData.Clear();
        this.MainSection.Children.forEach(x => x.Dispose());
        this.MainSection.Children = [];
        this.MainSection.Element.innerHTML = null;
        this.FormattedRowData = [];
        if (this.Entity == null || this.Parent.IsSearchEntry) {
            return;
        }
        if (this.ShouldSetEntity) {
            this.Entity[this.Name] = this.RowData.Data;
        }
    }

    /** @type {ListViewItem[]} */
    // @ts-ignore
    get AllListViewItem() { return this.MainSection.Children; }
    /** @return {ListViewItem[]} */
    get Item() { return this.MainSection.Children.filter(x => !x.GroupRow); }
    /**
     * Performs an action on all items that meet the condition specified by predicate.
     * @param {(item: EditableComponent) => void} action - The action to perform on each ListViewItem that meets the condition.
     * @param {(item: EditableComponent) => boolean} predicate - The condition to check each ListViewItem.
     */
    RowAction(action, predicate = null) {
        this.AllListViewItem.filter(x => !predicate || predicate(x)).forEach(action);
    }

    /**
     * Sets row data if the entity exists and it is not an empty string.
     */
    SetRowDataIfExists() {
        const value = Utils.GetPropValue(this.Entity, this.Name);
        if (this.Entity != null && Array.isArray(value)) {
            this.RowData._data = value;
        }
    }

    /**
     * Method to update the view of the ListView, possibly forcing the update and setting the dirty flag.
     * @param {boolean} [force=false] Whether to force the update.
     * @param {boolean|null} [dirty=null] Optional dirty flag to set.
     * @param {string[]} componentNames Component names to specifically update.
     */
    UpdateView(force = false, dirty = null, componentNames = []) {
        if (!this.Editable) {
            if (force) {
                this.ListViewSearch.RefreshListView();
            }
        } else {
            this.RowAction(row => row.UpdateView(force, dirty, componentNames), row => !row.EmptyRow);
        }
    }

    /**
     * Adds a new empty row to the ListView.
     */
    AddNewEmptyRow() {
        if (this.Disabled || !this.Meta.CanAdd) {
            return;
        }
        let emptyRowData = {};
        let dfObj = Utils.IsFunction(this.Meta.DefaultVal, false, this);
        if (dfObj) {
            Object.keys(dfObj).forEach(key => {
                emptyRowData[key] = dfObj[key];
            });
        }
        emptyRowData[this.IdField] = null;
        this.RenderRowData(this.Header, emptyRowData, this.EmptySection, null, true);
        if (!this.Meta.TopEmpty) {
            this.MainSection.Element.insertBefore(this.MainSection.Element, this.EmptySection.Element);
        } else {
            this.MainSection.Element.appendChild(this.EmptySection.Element.firstElementChild);
        }
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterEmptyRowCreated, emptyRowData).Done();
    }

    /**
     * Renders the paginator component if necessary based on the configuration and data.
     */
    RenderPaginator() {
        if (this.Meta.LocalRender || this.Meta.LiteGrid) {
            if (this.Paginator) {
                this.Paginator.Show = false;
            }
            return;
        }
        if (!this.Meta.Row || this.Meta.Row === 0) {
            this.Meta.Row = 20;
        }

        if (!this.Paginator) {
            // @ts-ignore
            this.Paginator = new Paginator({
                Total: 0,
                PageSize: this.Meta.Row ?? 50,
                CurrentPageCount: this.RowData.Data.length,
                PageIndex: 0,
                PageIndex: 0,
            });
            this.AddChild(this.Paginator);
        }
    }

    get UpdatedRows() {
        return this.AllListViewItem.OrderBy(x => x.RowNo).Where(x => x.Dirty).Select(x => x.Entity).Distinct();
    };

    get UpdatedListItems() {
        return this.AllListViewItem.OrderBy(x => x.RowNo).Where(x => x.Dirty);
    };

    /**
     * Retrieves a list of patches if there are updates, optionally updating the view.
     * @param {boolean} [updateView=false] - Indicates whether the view should be updated.
     * @returns {PatchVM[] | null} An array of PatchVM instances or null if no updates are dirty.
     */
    GetPatches(updateView = false) {
        if (!this.Dirty) {
            return null;
        }

        if (this.Meta.IdField !== null && this.Meta.IdField !== this.IdField) {
            this.UpdatedRows.forEach(row => {
                row[this.Meta.IdField] = this.EntityId;
            });
        }

        const res = [];
        this.UpdatedListItems.forEach(item => {
            res.push(item.GetPatchEntity());
        });

        if (updateView) {
            this.UpdateView();
        }

        return res;
    }

    /**
     * Filters and sorts the header components based on their properties.
     * @param {Component[]} components The list of components to filter.
     * @returns {Component[]} The filtered and sorted list of header components.
     */
    FilterColumns(components) {
        if (!components || components.length === 0) return components;
        const headers = this.EditForm.GetComPolicies(components).map(x => {
            x.EntityName = this.Meta.EntityName;
            return this.CalcTextAlign(x);
        }).sort((a, b) => b.Frozen - a.Frozen || (b.ComponentType === "Button" ? 1 : 0) - (a.ComponentType === "Button" ? 1 : 0) || a.Order - b.Order)
        this.OrderHeaderGroup(headers);
        this.Header = [];
        if (!["Dropdown", "Select"].some(x => x === this.Meta.ComponentType)) {
            this.Header.push(this.ToolbarColumn);
        }
        this.Header.push(...headers);
        if (!["Dropdown", "Select"].some(x => x === this.Meta.ComponentType)) {
            this.Header.push(this.LastColumn);
        }
        this.Header = this.Header.filter(x => x !== null && !x.TopEmpty);
        return this.Header;
    }

    /**
     * Applies a filter to the ListView, reloading data based on the current filter settings.
     * @returns {Promise} A promise that resolves once the data has been reloaded with the applied filter.
     */
    ApplyFilter() {
        this.ClearRowData();
        return this.ReloadData(true, 0);
    }

    GetSelectedRows() {
        return this.AllListViewItem.filter(x => !x.GroupRow && x.Selected).map(x => x.Entity);
    }

    ItemSelected() {
        return this.AllListViewItem.filter(x => !x.GroupRow && x.Selected).map(x => x.Entity);
    }

    GetRowFocus() {
        return this.AllListViewItem.filter(x => !x.GroupRow && x.Focused);
    }

    GetRowSelected() {
        return this.AllListViewItem.find(x => !x.GroupRow && x.Selected);
    }

    BodyContextMenuShow = new Action();
    /**
     * Handles the context menu for the body of the list view, showing additional options.
     * @param {Event} e The event object associated with the context menu action.
     */
    BodyContextMenuHandler(e) {
        e.preventDefault();
        e.stopPropagation();
        ContextMenu.Instance.MenuItems.Clear();
        var some = this.AllListViewItem.some(x => x.Selected && (x.Entity["AssignId"] == this.Token.UserId || x.Entity["InsertedBy"] == this.Token.UserId));
        if ((this.Disabled || (!this.Meta.CanWrite && !some)) || (this.Meta.CanWrite && !this.Meta.CanWriteAll && !some)) {
            return;
        }
        this.BodyContextMenuShow?.invoke();
        if (!this.Meta.IsMultiple) {
            this.SetSelected(e);
        }
        let ctxMenu = ContextMenu.Instance;
        this.DispatchEvent(this.Meta.Events, EventType.ContextMenu, this, ctxMenu).then(() => {
            this.RenderCopyPasteMenu(this.Editable);
            this.RenderEditMenu();
            ctxMenu.Top = e.Top();
            ctxMenu.Left = e.Left();
            ctxMenu.EditForm = this.EditForm;
            ctxMenu.Render();
            document.body.appendChild(ctxMenu.Element);
            ctxMenu.Element.style.position = "absolute";
        });
    }

    async RenderRelatedDataMenu() {
        const targetRef = await Client.Instance.GetByIdAsync('EntityRef', this.DataConn, [this.Meta.Id]);
        if (targetRef.Nothing()) {
            return;
        }
        const menuItems = targetRef.Select(x => ({
            Text: x.MenuText,
            Click: (arg) => this.OpenFeature(x),
        })).ToList();
        // @ts-ignore
        ContextMenu.Instance.MenuItems.push({
            Icon: "fal fal fa-ellipsis-h",
            Text: "Dữ liệu liên quan",
            MenuItems: menuItems
        });
    }

    // /** @type {EditableComponent[]} */
    /** @type {CellSelected[]} */
    CellSelected = [];
    /**
     * Applies filtering logic to the ListView based on the EntityRef.
     * It finds a specific GridView based on EntityRef, clears its conditions and dates,
     * and then updates it with new selected conditions.
     *
     * @param {TabEditor} tab - The TabEditor instance.
     * @param {EntityRef} entityRef - The EntityRef containing filtering criteria.
     */
    Filter(tab, entityRef) {
        /** @type {GridView} */
        // @ts-ignore
        let gridView1 = tab.FilterChildren(x => x instanceof EditableComponent.GridViewMd.GridView).find(X => X.Meta.Id === entityRef.TargetComId);
        if (!gridView1) {
            return;
        }

        gridView1.CellSelected = [];
        gridView1.AdvSearchVM.Conditions = [];
        gridView1.ListViewSearch.EntityVM.StartDate = null;
        gridView1.ListViewSearch.EntityVM.EndDate = null;

        this.GetRealTimeSelectedRows().then(Selecteds => {
            let Com = gridView1.Header.find(X => X.FieldName === entityRef.TargetFieldName);
            if (!Com) return;

            let CellSelecteds = Selecteds.map(Selected => ({
                FieldName: entityRef.TargetFieldName,
                FieldText: Com.Label,
                ComponentType: Com.ComponentType,
                Value: Selected[entityRef.FieldName].toString(),
                ValueText: Selected[entityRef.FieldName].toString(),
                Operator: OperatorEnum.In,  // Assuming OperatorEnum is predefined
                OperatorText: "Contains",
                Logic: 'Or',
                IsSearch: true,
                Group: true
            }));

            gridView1.CellSelected.push(...CellSelecteds);
            gridView1.ActionFilter();
        });
    }

    /**
     * Sets the row as selected based on the event target.
     * @param {Event} e The event object.
     */
    SetSelected(e) {
        // @ts-ignore
        let target = e.target.closest('tr');
        /** @type {ListViewItem} */
        // @ts-ignore
        let currentRow = this.MainSection.Children.find(x => x.Element === target);
        if (currentRow) {
            if (!currentRow.GroupRow || this.Meta.GroupReferenceId) {
                if (this.SelectedIds.length === 1) {
                    this.ClearSelected();
                }
                currentRow.Selected = true;
                this.LastListViewItem = currentRow;
                this.SelectedIndex = currentRow.RowNo;
            }
        }
    }

    /**
     * Renders the pagination details and handles the data loading process.
     */
    LoadAllData() {
        this.LoadHeader().then(() => {
            this.ReloadData(true).then();
        });
    }

    Dropdown = "Dropdown";

    async LoadHeader() {
        var columns = this.LoadGridPolicy();
        var pivotRow = columns.find(x => x.ComponentType == "Number" && x.IsMultiple && x.GroupFormat);
        if (pivotRow) {
            var index = columns.indexOf(pivotRow);
            const submitEntity = Utils.IsFunction(pivotRow.PreQuery, false, this);
            const entity = {
                Params: submitEntity ? JSON.stringify(submitEntity) : null,
                ComId: pivotRow.Id,
            };
            var data = await Client.Instance.SubmitAsync({
                Url: "/api/feature/sql",
                IsRawString: true,
                JsonData: JSON.stringify(entity),
                Method: "POST"
            });
            var pivotData = data[0];
            var headers = pivotData.map(x => ({
                FieldName: x.Id,
                Label: Utils.FormatEntity(pivotRow.Label, x),
                ComponentType: "Number",
                IsChild: true,
                Order: pivotRow.Order + 1,
                Width: pivotRow.Width,
                MinWidth: pivotRow.MinWidth,
                MaxWidth: pivotRow.MaxWidth,
                GroupName: x.CodeMn,
                Summary: pivotRow.Summary,
                SummaryColSpan: pivotRow.SummaryColSpan,
                GroupFormat: `const vndAmount = this.ChildrenItems
                    .map(x => x.Entity).reduce((a, b) => a.plus(b["${x.Id}"] || 0), new this.Decimal(0))
                        .toFixed(0)
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return vndAmount == '0' ? '' : vndAmount;`
            }));
            if (pivotRow.IsSumary) {
                headers.push({
                    FieldName: "Total",
                    IsTotal: true,
                    Label: pivotRow.GroupName,
                    ComponentType: "Number",
                    Order: pivotRow.Order + 2,
                    Width: pivotRow.Width,
                    ChildHeader: headers,
                    MinWidth: pivotRow.MinWidth,
                    MaxWidth: pivotRow.MaxWidth,
                    FormatData: pivotRow.FormatData,
                    GroupFormat: pivotRow.GroupFormat,
                    Summary: pivotRow.Summary,
                    SummaryColSpan: pivotRow.SummaryColSpan,
                });
            }
            columns.splice(index, 1, ...headers);
        }
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.UpdateHeader, columns);
        columns = this.FilterColumns(columns);
        this.Header = columns;
    }

    LoadGridPolicy() {
        var sysSetting = [];
        if (this.Meta.Columns?.length > 0) {
            sysSetting = this.Meta.Columns;
        }
        else {
            if (!Utils.isNullOrWhiteSpace(this.Meta.Template) && ["Dropdown", "Select"].some(x => x == this.Meta.ComponentType)) {
                sysSetting = JSON.parse(this.Meta.Template, null, 2);
            }
            else {
                sysSetting = this.EditForm.Meta.GridPolicies.filter(x => x.EntityId == this.Meta.FieldName);
            }
        }
        if (this.EditForm.Meta.UserSettings) {
            var userSetting = this.EditForm.Meta.UserSettings.find(x => x.ComponentId == this.Meta.Id);
            if (userSetting) {
                var policys = JSON.parse(userSetting.Value);
                sysSetting.forEach(item => {
                    var map = policys.find(x => x.FieldName == item.FieldName);
                    if (map) {
                        item.Width = map.Width;
                        item.MinWidth = map.Width;
                        item.MaxWidth = map.Width;
                        item.Order = map.Order;
                    }
                });
            }
        }
        return sysSetting;
    }
    NotCellText = ["Button", "Image", "ImageUploader"]
    /**
     * Filters the columns based on the header configuration and applies sort order.
     */
    OrderHeaderGroup(headers) {
        for (let i = 0; i < headers.length; i++) {
            for (let j = i + 1; j < headers.length; j++) {
                if (headers[i].GroupName && headers[i].GroupName === headers[j].GroupName && headers[i + 1].GroupName !== headers[j].GroupName) {
                    let temp = headers[i + 1];
                    headers[i + 1] = headers[j];
                    headers[j] = temp;
                }
            }
        }
    }

    /** @type {any[]} */
    _copiedRows;

    /**
    * Copies the selected rows.
    * @param {object} ev The event object.
    */
    CopySelected(ev) {
        var selected = this.GetSelectedRows();
        var dataCopy = {
            TableName: this.Meta.RefName,
            RowData: this.copyRowWithoutId(selected)
        }
        this.CopyData = dataCopy;
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCopied, selected, this._copiedRows);
    }

    set CopyData(data) {
        return window["CopyData"] = data;
    }

    get CopyData() {
        var dataCop = window["CopyData"];
        if (!dataCop) {
            return null;
        }
        return dataCop;
    }

    deepCopy(obj, path = null) {
        return JSON.parse(JSON.stringify(obj)); // Simple deep copy implementation
    }

    setPropValue(obj, propName, value) {
        obj[propName] = value;
    }

    getPropValue(obj, propName) {
        return obj[propName];
    }

    processObjectRecursive(obj, callback) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                callback(obj);
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    this.processObjectRecursive(obj[key], callback);
                }
            }
        }
    }

    copyRowWithoutId(selectedRows, path = null) {
        return selectedRows.map(row => {
            let res = this.deepCopy(row, path);
            this.setPropValue(res, this.IdField, Uuid7.NewGuid());
            this.setPropValue(res, this.StatusIdField, 1);
            if (res["NoSubmit"] != undefined || res["NoSubmit"] != null) {
                this.setPropValue(res, "ParentId", null);
            }
            this.setPropValue(res, "NoSubmit", false);
            this.setPropValue(res, "IsLock", false);
            this.setPropValue(res, "ShipmentInvoiceDetailId", null);
            this.setPropValue(res, "ShipmentInvoiceId", null);
            this.setPropValue(res, "ShipmentInvoiceCode", null);
            this.setPropValue(res, "ShipmentInvoiceDate", null);
            this.setPropValue(res, "PaymentRequestId", null);
            this.setPropValue(res, "PaymentRequestDetailId", null);
            this.setPropValue(res, "PaymentCode", null);
            this.setPropValue(res, "PaymentDate", null);
            this.setPropValue(res, "IsPayment", false);
            this.setPropValue(res, "InvoiceId", null);
            this.setPropValue(res, "InvoiceDetailId", null);
            this.setPropValue(res, "InvoiceCode", null);
            this.setPropValue(res, "InvoiceDate", null);
            this.setPropValue(res, "IsPaid", false);
            this.setPropValue(res, "PaidDate", null);
            this.setPropValue(res, "DebtCode", null);
            this.setPropValue(res, "DebtDate", null);
            this.setPropValue(res, "DebtId", null);
            this.setPropValue(res, "IsDebtAcc", false);
            this.setPropValue(res, "PaymentAccId", null);
            this.setPropValue(res, "PaymentAccCode", null);
            this.setPropValue(res, "PaymentAccDate", null);
            this.setPropValue(res, "IsPaymentAcc", false);
            this.setPropValue(res, "InsertedBy", this.Token.UserId);
            this.processObjectRecursive(res, obj => {
                let id = this.getPropValue(obj, this.IdField);
                if (id && id > 0) {
                    this.setPropValue(obj, this.IdField, 0);
                }

                let status = this.getPropValue(obj, this.StatusIdField);
                if (status !== undefined) {
                    this.setPropValue(obj, this.StatusIdField, 1);
                }
            });
            return res;
        });
    }

    /**
    * Pastes the copied rows.
    * @param {object} ev The event object.
    */
    async PasteSelected(ev) {
        var dataCopy = this.CopyData;
        if (!dataCopy || dataCopy.TableName != this.Meta.RefName) {
            return;
        }
        var copyRows = dataCopy.RowData;
        if (copyRows.length == 0) {
            return;
        }
        copyRows.forEach(cell => {
            cell["DisableRow"] = false;
            if (!Utils.isNullOrWhiteSpace(this.Meta.DefaultVal)) {
                var rsObj = Utils.IsFunction(this.Meta.DefaultVal, false, this);
                if (rsObj) {
                    Object.getOwnPropertyNames(rsObj).forEach(x => {
                        cell[x] = rsObj[x];
                    });
                }
            }
        });
        Toast.Success("Copying...");
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforePasted, copyRows).then(() => {
            var index = this.AllListViewItem.reduceRight((acc, x2, index) => {
                if (acc === -1 && x2.Selected) {
                    return index;
                }
                return acc;
            }, -1);
            this.AddRowsNo(copyRows, index).then(list => {
                if (this.Meta.IsRealtime) {
                    Promise.all(list.Select(x => x.PatchUpdateOrCreate())).then(() => {
                        this.CopyData = [];
                        Toast.Success("Data pasted successfully !");
                        super.Dirty = false;
                        this.ClearSelected();
                    });
                }
                else {
                    this.CopyData = [];
                    Toast.Success("Data pasted successfully !");
                }
                this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterPasted, copyRows).then();
            });
        });
    }

    /**
     * Renders menus related to the data linked with the selected rows, such as copy, paste, and editing options.
     * @param {boolean} canWrite Indicates whether the user has write permissions.
     */
    RenderCopyPasteMenu(canWrite) {
        if (this.Meta.CanAdd) {
            ContextMenu.Instance.MenuItems.push({
                Icon: "fal fa-copy",
                Text: "Copy",
                Click: () => this.CopySelected()
            });
            ContextMenu.Instance.MenuItems.push({
                Icon: "fal fa-clone",
                Text: "Copy & Paste",
                Click: () => this.DuplicateSelected(null, false)
            });
        }
        var dataCopy = this.CopyData;
        if (dataCopy && dataCopy.TableName == this.Meta.RefName) {
            if (canWrite && dataCopy.RowData.length > 0) {
                ContextMenu.Instance.MenuItems.push({
                    Icon: "fal fa-paste",
                    Text: "Paste",
                    Click: () => this.PasteSelected()
                });
            }
        }
    }

    /**
     * Renders edit menu options based on user permissions.
     * @param {boolean} canWrite Indicates whether the user has write permissions.
     */
    RenderEditMenu() {
        if (this.Meta.CanRead) {
            ContextMenu.Instance.MenuItems.push({
                Icon: "fal fa-history",
                Text: "View History",
                Click: async () => await this.ViewHistory()
            });
        }
        if (this.Meta.CanDeactivate) {
            ContextMenu.Instance.MenuItems.push({
                Icon: "fal fa-unlink",
                Text: "Deactivate",
                Click: () => this.DeactivateSelected()
            });
        }
        var selected = this.GetSelectedRows();
        var check = selected.some(x => (x["StatusId"] && !x["ProgressId"] && [3, 4].includes(x["StatusId"])) || (x["ProgressId"] && [2, 3].includes(x["ProgressId"])) || x["NoSubmit"] || x["IsLock"] || x["IsPayment"] || x["IsInvoice"] || x["IsPaymentAcc"] || x["IsDebtAcc"]);
        if (this.Meta.CanDelete && !check) {
            if (this.Meta.CanDeleteAll) {
                ContextMenu.Instance.MenuItems.push({
                    Icon: "fal fa-trash",
                    Text: "Delete Data",
                    Click: () => this.HardDeleteSelected()
                });
            }
            else {
                check = selected.some(x => x["InsertedBy"] && x["InsertedBy"] == this.Token.UserId || x["AssignId"] == this.Token.UserId);
                if (check) {
                    ContextMenu.Instance.MenuItems.push({
                        Icon: "fal fa-trash",
                        Text: "Delete Data",
                        Click: () => this.HardDeleteSelected()
                    });
                }
            }
        }
    }
    CanDelete;
    DisposeViewHistory() {
        this._history.innerHTML = null;
    }

    /**
     * Renders the view history popup for the selected row.
     * @param {object} currentItem The currently selected row item.
     */
    async ViewHistory(currentItem) {
        const selectedRows = this.GetSelectedRows();
        currentItem = selectedRows[0];
        if (!currentItem) {
            return;
        }
        Html.Take(this.TabEditor.Element).Div.ClassName("backdrop").TabIndex(-1).Trigger(EventType.Focus)
            .Style("align-items: baseline;");
        this._history = Html.Context;
        Html.Instance.Div.Escape((e) => this.DisposeViewHistory.bind(this)).ClassName("popup-content confirm-dialog").Style("top: 0;")
            .Div.ClassName("popup-title").InnerHTML("View history change")
            .Div.ClassName("icon-box").Span.ClassName("fal fa-times")
            .Event(EventType.Click, () => this._history.remove())
            .EndOf(".popup-title")
            .Div.ClassName("card-body panel group").Width("1000px");
        const body = Html.Context;
        var coms = await Client.Instance.GetService("History Change");
        var com = coms[0][0];
        com.Row = 50;
        var params = {
            RecordId: currentItem.Id,
            TableName: this.Meta.RefName
        }
        com.Columns = [
            {
                FieldName: "TextContent",
                Order: 1,
                ComponentType: "Input",
                Label: "History",
                Width: "70%",
                MinWidth: "400px",
                MaxWidth: "70%",
            },
            {
                FieldName: "InsertedBy",
                ComponentType: "Dropdown",
                RefName: "User",
                Order: 2,
                FormatData: "{FullName}",
                Label: "Inserted By",
                Width: "15%",
                MinWidth: "15%",
                MaxWidth: "15%",
            },
            {
                FieldName: "InsertedDate",
                Order: 3,
                ComponentType: "Datepicker",
                FormatData: "DD/MM/YYYY HH:mm",
                Label: "Inserted Date",
                Width: "15%",
                MinWidth: "15%",
                MaxWidth: "15%",
            }
        ]
        com.PreQuery = JSON.stringify(params);
        com.CanSearch = false;
        const md = await import('./gridView.js');
        const _filterGrid = new md.GridView(com);
        _filterGrid.CanDelete = false;
        _filterGrid.ParentElement = body;
        this.TabEditor.AddChild(_filterGrid);
        _filterGrid.Element.style.width = "100%";
    }

    /** @type {FeaturePolicy[]} */
    RecordPolicy = [];
    static IsOwner = '__IsOwner';
    /**
    * Handles security for selected rows.
    */
    async SecurityRows() {
        const md = await import('./forms/securityBL.js');
        const selectedRowIds = this.GetSelectedRows()
            .filter(x => x[ListView.IsOwner] === true)
            .map(x => x[this.IdField]?.toString());
        // @ts-ignore
        const security = new md.SecurityBL();
        security.Entity = { RecordIds: selectedRowIds, EntityId: this.Meta.ReferenceId };
        security.ParentElement = this.TabEditor.Element;
        this.TabEditor.AddChild(security);
    }


    /**
     * Loads record-specific policies for permissions handling.
     * @param {string} entity The entity reference name.
     * @param {Array<string>} ids Array of record IDs to load policies for.
     * @returns {Promise<Array>} A promise that resolves to an array of policies.
     */
    async LoadRecordPolicy(entity, ids) {
        if (ids.length === 0 || ids.every(x => x === null)) {
            return [];
        }
        const sql = {
            ComId: "Policy",
            Action: "GetById",
            Table: 'FeaturePolicy',
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
            Params: JSON.stringify({ ids, table: entity })
        };
        // @ts-ignore
        return await Client.Instance.UserSvc(sql);
    }

    /**
     * Handles the event for selected row deactivation.
     */
    async DeactivateSelected() {
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Content = "Are you sure you want to deactivate?"
        confirmDialog.EditForm = this;
        confirmDialog.Render();
        confirmDialog.YesConfirmed += async () => {
            confirmDialog.Dispose();
            const deactivatedIds = await this.Deactivate();
            this.DispatchCustomEvent(this.Meta.Events, CustomEventType.Deactivated, this.Entity);
        };
    }

    /**
     * Deactivates selected rows by their IDs.
     * @returns {Promise<Array<string>>} A promise that resolves to an array of deactivated IDs.
     */
    async Deactivate() {
        const ids = this.GetSelectedRows().map(x => x[this.IdField].toString());
        const deactivatedIds = await Client.Instance.DeactivateAsync(ids, this.Meta.RefName, this.DataConn);
        if (deactivatedIds.length > 0) {
            Toast.Success("Data deactivated successfully");
        } else {
            Toast.Warning("An error occurred during deactivation");
        }
        return deactivatedIds;
    }

    /**
     * Handles deleting selected rows after confirming the action.
     */
    async HardDeleteSelected() {
        var deletedItems = [];
        deletedItems = this.GetSelectedRows();
        var check = deletedItems.some(x => (x["StatusId"] && [3, 4].includes(x["StatusId"])) || x["NoSubmit"] || x["IsLock"] || x["IsPayment"] || x["IsInvoice"] || x["IsPaymentAcc"] || x["IsDebtAcc"]);
        if (deletedItems.length == 0 || check || this.Meta.IsMultiple || !this.Meta.CanDelete) {
            return;
        }
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = "Are you sure you want to delete the selected rows?";
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.EditForm = this.EditForm;
        confirmDialog.Render();
        confirmDialog.YesConfirmed.add(() => {
            var jsonQuery = JSON.parse(this.Meta.Query);
            if (jsonQuery && jsonQuery.delete) {
                const ids = deletedItems.map(x => x[this.IdField]).filter(x => !x.startsWith('-'));
                if (ids && ids.length > 0) {
                    let submitEntity = Utils.IsFunction(this.Meta.PreQuery, true, this);
                    Client.Instance.PostAsync({
                        EntityIds: ids,
                        Params: submitEntity ? JSON.stringify(submitEntity) : null,
                        ComId: this.Meta.Id
                    }, "/api/CheckDelete").then((rs) => {
                        if (rs.status == 200) {
                            this.HardDeleteConfirmed(deletedItems).then(async () => {
                                await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterDeleted, this, deletedItems);
                                await this.DispatchCustomEvent(this.Meta.Events, EventType.Change, this);
                            });
                        }
                        else {
                            if (rs.message) {
                                this.EditForm.OpenConfig(rs.message, () => {
                                }, () => { }, false, [], true)
                            }
                            else {
                                var searchEntry = JSON.parse(JSON.stringify(this.Meta));
                                searchEntry.ComponentType = "Dropdown";
                                searchEntry.Events = null;
                                searchEntry.Style = null;
                                searchEntry.ChildStyle = null;
                                searchEntry.CanSearch = false;
                                searchEntry.FieldName = "NewEntityId";
                                this.EditForm.OpenConfig("Please select a replacement data.", () => {
                                    this.HardDeleteConfirmed(deletedItems, this.EditForm.Entity.NewEntityId).then(async deletedIds => {
                                        if (deletedIds) {
                                            this.EditForm.Entity.NewEntityId = null;
                                        }
                                        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterDeleted, this, deletedItems);
                                        await this.DispatchCustomEvent(this.Meta.Events, EventType.Change, this);
                                        this.ActionFilter();
                                    });
                                }, () => { }, true, [searchEntry])
                            }
                        }
                    });
                }
                else {
                    this.HardDeleteConfirmed(deletedItems).then(async deletedIds => {
                        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterDeleted, this, deletedItems);
                        await this.DispatchCustomEvent(this.Meta.Events, EventType.Change, this);
                    });
                }
            }
            else {
                this.HardDeleteConfirmed(deletedItems).then(async deletedIds => {
                    await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterDeleted, this, deletedItems);
                    await this.DispatchCustomEvent(this.Meta.Events, EventType.Change, this);
                });
            }
        });
    }

    /**
     * Confirms the deletion of selected rows and performs the deletion.
     * @param {Array<object>} deletedItems Items to be deleted.
     * @returns {Promise<Array<object>>} A promise that resolves to the array of deleted items.
     */
    async HardDeleteConfirmed(deletedItems, newId) {
        const ids = deletedItems.map(x => x[this.IdField]).filter(x => !x.startsWith('-'));
        if (this.Meta.Editable) {
            ids.forEach(x => {
                this.DeleteTempIds.push(x);
            });
            this.AllListViewItem.filter(x => x.Selected).forEach(x => {
                x.Dispose();
                if (x.GroupSection && x.GroupSection.ChildrenItems.length > 0) {
                    const index = x.GroupSection.ChildrenItems.indexOf(x);
                    if (index > -1) {
                        x.GroupSection.ChildrenItems.splice(index, 1);
                    }
                    if (x.GroupSection.ChildrenItems.length == 0) {
                        x.GroupSection.Dispose();
                    }
                }
            });
            this.ClearSelected();
            this.Dirty = true;
            Toast.Success("Deleted successfully");
        }
        else {
            const result = await Client.Instance.HardDeleteAsync(ids, this.Meta.RefName, newId, this.Meta.Id);
            if (result) {
                this.AllListViewItem.filter(x => x.Selected).forEach(x => x.Dispose());
                this.ClearSelected();
                if (this.Meta.IsRealtime) {
                    this.Dirty = false;
                }
                Toast.Success("Deleted successfully");
            } else {
                Toast.Warning("No rows were deleted");
            }
        }
        return deletedItems;
    }

    /**
     * Duplicates the selected rows and optionally adds a new row based on the duplicate.
     * @param {Event} ev The event object (not used in this method).
     * @param {boolean} addRow Whether to add a new row based on the duplication.
     */
    async DuplicateSelected(ev, addRow = false) {
        this.CopySelected();
        await this.PasteSelected();
    }

    /**
     * Adds rows at a specified index without clearing existing data.
     * @param {Array<object>} rows Array of row data to add.
     * @param {number} index The index at which to insert the new rows.
     * @returns {Promise<Array<ListViewItem>>} A promise that resolves to an array of added ListViewItem instances.
     */
    AddRowsNo(rows, index = 0) {
        let ok, err;
        let promise = new Promise((a, b) => { ok = a; err = b; });
        this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreated, rows, this).then(() => {
            const tasks = rows.map((data, i) => this.AddRow(data, index + i + 1, false));
            Promise.all(tasks).then(results => {
                this.AddNewEmptyRow();
                this.RenderIndex();
                this.ClearSelected();
                results.forEach(x => x.Selected = true);
                ok(results);
                this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreated, rows).then();
            }).catch(err);
        });
        return promise;
    }

    /**
     * Updates pagination details based on the current data state.
     */
    RenderIndex() {
        if (this.MainSection.Children.length === 0 || this.Meta.IsMultiple) {
            return;
        }
        this.AllListViewItem.forEach((row, rowIndex) => {
            if (row.Children.length === 0 || row.FirstChild === null || row.FirstChild.Element === null) {
                return;
            }
            const previous = row.FirstChild.Element.closest('td').previousElementSibling;
            if (previous === null) {
                return;
            }
            const index = this.Paginator.Options.StartIndex + rowIndex;
            previous.innerHTML = index.toString();
            row.Selected = this.SelectedIds.includes(row.Entity[this.IdField]);
            row.RowNo = index;
        });
    }

    /**
     * Updates pagination details based on the current data state.
     */
    async RenderIndex2() {
        if (this.MainSection.Children.length === 0) {
            return;
        }
        for (let rowIndex = 0; rowIndex < this.MainSection.Element.children.length; rowIndex++) {
            var trElement = this.MainSection.Element.children[rowIndex];
            var item = this.Item.find(x => x.Element == trElement);
            var tdIndex = trElement.children[0];
            if (tdIndex != null) {
                const index = this.Paginator.Options.StartIndex + rowIndex;
                tdIndex.innerHTML = index.toString();
                if (item != null) {
                    item.Entity[this.Meta.HotKey || "Order"] = index;
                    item.UpdateView(true, false, "Order");
                }
            }
        }
        const columns = this.Item.map(x => x.Entity).map(header => {
            const dirtyPatch = [
                { Field: "Id", Value: header.Id },
                { Field: "Order", Value: header.Order },
                { Field: "FeatureId", Value: header.FeatureId }
            ];
            return {
                Changes: dirtyPatch,
                NotMessage: true,
                Table: this.Meta.RefName,
            };
        }).filter(x => x != null);
        Client.Instance.PatchAsync2(columns).then();
    }

    /**
     * Handles custom events based on row changes, applying data updates and managing component state.
     * @param {object} rowData The data of the row that triggered the change.
     * @param {ListViewItem} rowSection The ListViewItem corresponding to the row.
     * @param {ObservableArgs} observableArgs Additional arguments or data relevant to the event.
     * @param {EditableComponent} [component=null] Optional component that might be affected by the row change.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure of the event handling.
     */
    RowChangeHandler(rowData, rowSection, observableArgs, component = null) {
        const tcs = new Promise((resolve, reject) => {
            if (!rowSection.EmptyRow || !this.Editable) {
                this.DispatchEvent(this.Meta.Events, EventType.Change, this, rowSection, rowData).then(() => {
                    resolve(false);
                });
            } else {
                this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreated, rowData, this).then(() => {
                    this.RowData.Data.push(rowData);
                    rowSection.FilterChildren(child => true).forEach(child => {
                        child.EmptyRow = false;
                        child.UpdateView(true);
                    });
                    this.EmptySection.Children.Clear();
                    this.AddNewEmptyRow();
                    this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreated, rowData, this).then(() => {
                        resolve(true);
                    });
                });
            }
        });
        return tcs;
    }

    /**
    * Removes a row from the ListView by its identifier.
    * @param {string} id The identifier of the row to remove.
    */
    RemoveRowById(id) {
        const listViewItem = this.MainSection.Children.find(x => x.EntityId === id);
        if (listViewItem) {
            listViewItem.Dispose();
        }
    }

    /**
     * Adds a single row to the ListView.
     * @param {object} rowData The data object representing the row.
     * @param {number} index The index at which to insert the new row.
     * @param {boolean} singleAdd Specifies whether to add the row as a single addition.
     * @returns {Promise<ListViewItem>} A promise that resolves to the ListViewItem added.
     */
    async AddRow(rowData, index = 0, singleAdd = true) {
        if (singleAdd) {
            this.RowData.Data.splice(index, 0, rowData);
        }
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreated, rowData, this);
        const row = this.RenderRowData(this.Header, rowData, this.MainSection, index);
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreated, rowData);
        return row;
    }

    /**
     * Adds multiple rows to the ListView.
     * @param {Array<object>} rows An array of objects to be added as rows.
     * @param {number} index The starting index to add new rows.
     * @returns {Promise<Array<ListViewItem>>} A promise that resolves to an array of ListViewItem instances.
     */
    async AddRows(rows, index = 0) {
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.BeforeCreatedList, this, rows);
        const listItems = [];
        await this.LoadMasterData(rows);
        for (let i = 0; i < rows.length; i++) {
            const row = await this.AddRow(rows[i], index + i, false);
            listItems.push(row);
        }
        await this.DispatchCustomEvent(this.Meta.Events, EventType.Change, this);
        await this.DispatchCustomEvent(this.Meta.Events, CustomEventType.AfterCreatedList, this, this, rows);
        this.AddNewEmptyRow();
        this.RenderIndex();
        return listItems;
    }

    /**
     * Clears selected rows based on provided criteria or clears all if no criteria provided.
     */
    ClearSelected() {
        this.AllListViewItem.forEach(x => x.Selected = false);
        /** @type {string[]} */
        this.SelectedIds = [];
        this.LastListViewItem = null;
    }

    ClearFocused() {
        this.AllListViewItem.forEach(x => x.Focused = false);
    }

    /**
     * Updates a specific row in the ListView.
     * @param {object} rowData The data object that represents the row to update.
     * @param {boolean} force Whether to force the update regardless of the current state.
     * @param {Array<string>} fields Specific fields to update, if provided.
     */
    UpdateRow(rowData, force = false, fields = []) {
        const row = this.AllListViewItem.find(x => x.Entity === rowData);
        if (row) {
            row.UpdateView(force, fields);
        }
    }

    DomLoaded() {
        if (!this.Meta.LocalRender) {
            this.Header.ForEach(x => x.LocalData = null);
        }
        this.DOMContentLoaded?.invoke();
    }
    AddContentRendered = false;
    /**
     * Renders additional content after rows have been added or updated.
     */
    ContentRendered() {
        this.RenderIndex();
        this.DomLoaded();
        if (this.Editable) {
            this.AddNewEmptyRow();
        }
    }

    GetItemFocus() {
        return this.AllListViewItem.find(x => x.Focused);
    }

    GetRealTimeSelectedRows() {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            Client.Instance.GetByIdAsync(this.Meta.RefName, this.DataConn || Client.DataConn, this.SelectedIds.ToArray())
                .then(res => {
                    resolve(res ? res.slice() : []);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    GetRowCountByHeight(scrollTop) {
        return (scrollTop / this._rowHeight >= 0) ?
            Math.floor(scrollTop / this._rowHeight) :
            Math.ceil(scrollTop / this._rowHeight);
    }

    RemoveRow(row) {
        if (row === null) {
            return;
        }
        this.RowData.Data.Remove(row);
        this.MainSection.FirstOrDefault(x => x.Entity == row)?.Dispose();
    }

    CalcTextAlign(header) {
        if (header.TextAlign && header.TextAlign.length > 0) {
            const parsed = Object.values(header.TextAlign).includes(header.textAlign);
            if (parsed) {
                header.textAlignEnum = header.textAlign;
            }
        }
        return header;
    }

    ValidateAsync() {
        this.Children.forEach(x => x.ValidateAsync());
        if (this.ValidationRules.length == 0) {
            return Promise.resolve(true);
        }
        const tcs = new Promise((resolve, reject) => {
            resolve(this.ValidateRequired(this.value));
        });
        return tcs;
    }

    MergeComponent(sysSetting, userSetting) {
        if (!userSetting) return sysSetting;
        const column = JSON.parse(userSetting.value);
        if (!column || column.length === 0) {
            return sysSetting;
        }
        const userSettings = column.reduce((acc, current) => {
            acc[current.Id] = current;
            return acc;
        }, {});

        sysSetting.forEach(component => {
            const current = userSettings[component.id];
            if (current) {
                component.width = current.width;
                component.maxWidth = current.maxWidth;
                component.minWidth = current.minWidth;
                component.order = current.order;
                component.frozen = current.frozen;
            }
        });
        return sysSetting;
    }

    ActionFilter() {
        this.ClearRowData();
        this.ReloadData().then();
    }

    MoveUp() {
        var selected = this.GetRowSelected();
        this.ClearSelected();
        this.ClearFocused();
        var height = 26;
        var firstElement = this.AllListViewItem[0];
        if (firstElement) {
            height = firstElement.Element.clientHeight;
        }
        if (!selected) {
            if (this.AllListViewItem[this.AllListViewItem.length - 1]) {
                this.AllListViewItem[this.AllListViewItem.length - 1].Selected = true;
                this.AllListViewItem[this.AllListViewItem.length - 1].Focused = true;
                this.DataTable.parentElement.scrollTop = this.DataTable.parentElement.scrollHeight;
                this.SelectedIndex = this.AllListViewItem.length - 1;
                this.Ele
            }
        }
        else {
            var indexCurrent = this.AllListViewItem.indexOf(selected);
            if (!this.AllListViewItem[indexCurrent - 1]) {
                this.AllListViewItem[this.AllListViewItem.length - 1].Selected = true;
                this.AllListViewItem[this.AllListViewItem.length - 1].Focused = true;
                this.DataTable.parentElement.scrollTop = this.DataTable.parentElement.scrollHeight;
                this.SelectedIndex = this.AllListViewItem.length - 1;
            }
            else {
                this.AllListViewItem[indexCurrent - 1].Selected = true;
                this.AllListViewItem[indexCurrent - 1].Focused = true;
                this.DataTable.parentElement.scrollTop = this.DataTable.parentElement.scrollTop - height;
                this.SelectedIndex = indexCurrent - 1;
            }
        }
    }

    MoveDown() {
        var selected = this.GetRowSelected();
        this.ClearSelected();
        this.ClearFocused();
        var height = 26;
        var firstElement = this.AllListViewItem[0];
        if (firstElement) {
            height = firstElement.Element.clientHeight;
        }
        if (!selected) {
            if (this.AllListViewItem[0]) {
                this.AllListViewItem[0].Selected = true;
                this.AllListViewItem[0].Focused = true;
                this.DataTable.parentElement.scrollTop = 0;
                this.SelectedIndex = 0;
            }
        }
        else {
            var indexCurrent = this.AllListViewItem.indexOf(selected);
            if (!this.AllListViewItem[indexCurrent + 1]) {
                this.AllListViewItem[0].Selected = true;
                this.AllListViewItem[0].Focused = true;
                this.DataTable.parentElement.scrollTop = 0;
                this.SelectedIndex = 0;
            }
            else {
                this.AllListViewItem[indexCurrent + 1].Selected = true;
                this.AllListViewItem[indexCurrent + 1].Focused = true;
                this.DataTable.parentElement.scrollTop = this.DataTable.parentElement.scrollTop + height;
                this.SelectedIndex = indexCurrent + 1;
            }
        }
    }

    GetUserSetting(prefix) {
        // @ts-ignore
        return Client.Instance.UserSvc({
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
            ComId: "UserSetting",
            Action: "GetByComId",
            Params: JSON.stringify({ ComId: this.Meta.Id, Prefix: prefix })
        });
    }

    /**
     * Updates a specific row in the ListView.
     * @param {ListViewItem} rowData The data object that represents the row to update.
     */
    async RealtimeUpdateAsync(rowData, arg) {
        if (this.EmptyRow) {
            this.EmptyRow = false;
            return;
        }
        if (!this.Meta.IsRealtime || !arg) {
            return;
        }
        var isValid = await rowData.ValidateAsync();
        if (!isValid) {
            return;
        }
        if (this.EditForm.ChildCom.some(x => !x.IsListView && x.Dirty)) {
            this.EditForm.SavePatch().then(async () => {
                await rowData.PatchUpdateOrCreate();
            });
        }
        else {
            await rowData.PatchUpdateOrCreate();
        }
    }
}
