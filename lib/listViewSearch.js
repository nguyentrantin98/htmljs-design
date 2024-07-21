import {
    ElementType, ComponentType, EventType, HttpMethod,
    KeyCodeEnum, LogicOperation, OperatorEnum
} from './models/';
import { Section } from './section.js';
import { EditableComponent } from './editableComponent.js';
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import { Uuid7 } from './structs/uuidv7.js';
import { AdvancedSearch } from './advancedSearch.js';
import { Toast } from './toast.js';
import { ContextMenu } from './contextMenu.js';
import { ComponentExt } from './utils/componentExt.js';
import { Textbox } from './textbox.js';
import { Datepicker } from './datepicker.js';
import { SearchEntry } from './searchEntry.js';


/**
 * @typedef {import('./models/component.js').Component} Component
 * @typedef {import('./listView.js').ListView} ListView
 * @typedef {import('./gridView.js').GridView} GridView
 * @typedef {import('./tabEditor.js').TabEditor} TabEditor
 * @typedef {import('./datepicker.js').Datepicker} Datepicker
 * @typedef {import('./searchEntry.js').SearchEntry} SearchEntry
 */

/**
 * @class
 */
// @ts-ignore
export class ListViewSearchVM {
    constructor() {
        this.Id = Uuid7.Id25();
        this.SearchTerm = '';
        this.FullTextSearch = '';
        this.ScanTerm = '';
        this.StartDate = null;
        this.DateTimeField = '';
        this.EndDate = null;
    }
}

/**
 * @class
 * @extends EditableComponent
 */
export class ListViewSearch extends EditableComponent {
    /** @type {ListView} */
    // @ts-ignore
    Parent;

    /** @type {GridView} */
    ParentGridView;
    /**
     * @type {HTMLInputElement}
     * @private
     */
    _uploader;

    /**
     * @type {HTMLInputElement}
     * @private
     */
    _fullTextSearch;

    /**
     * @type {ListViewSearchVM}
     */
    get EntityVM() {
        return this.Entity;
    }

    /**
     * @type {string}
     */
    get DateTimeField() {
        return this._dateTimeField;
    }

    /**
     * @param {string} value
     */
    set DateTimeField(value) {
        this._dateTimeField = value;
    }

    /**
     * @type {Component[]}
     */
    BasicSearch;

    /**
     * @type {boolean}
     * @private
     */
    _hasRender = false;

    /**
     * @param {Component} ui
     */
    constructor(ui) {
        super(ui, null);
        this.PopulateDirty = false;
        this.AlwaysValid = true;
        this.Meta = ui;
        this.DateTimeField = ui.DateTimeField ?? 'InsertedDate';
        this.Entity = new ListViewSearchVM();
        this.Disabled = false;
    }
    /**
     * @param {Event[][]} basicSearchHeader
     */
    ListView_DataLoaded(basicSearchHeader) {
        if (this._hasRender) return;
        this._hasRender = true;
        this.BasicSearch = this.Parent.Header
            .filter(x => x.Active && !x.Hidden)
            .sort((a, b) => b.Order - a.Order);
        if (this.BasicSearch.length === 0) {
            return;
        }
        Html.Take(this.Element);
        var components = this.BasicSearch.map(header => {
            var com = header;
            var componentType = com.ComponentType;
            com.ShowLabel = false;
            com.PlainText = header.Label;
            com.Visibility = true;
            com.Column = 1;
            var compareOpId = AdvancedSearch.OperatorFactory(componentType ?? ComponentType.Textbox)[0].Id;
            // @ts-ignore
            this.Parent.AdvSearchVM.Conditions.push({
                FieldId: com.Id,
                CompareOperatorId: compareOpId,
                LogicOperatorId: LogicOperation.And,
                Field: header,
            });
            return com;
        });
        var sectionInfo = {
            Children: components,
            Responsive: true,
            Column: components.length,
            ClassName: 'wrapper'
        };
        // @ts-ignore
        var _basicSearchGroup = Section.RenderSection(this, sectionInfo);
        _basicSearchGroup.Children.forEach(child => {
            child.UserInput.add(changes => {
                var condition = this.Parent.AdvSearchVM.Conditions.find(x => x.FieldId === child.Meta.Id);
                condition.Value = child.FieldVal?.toString();
            });
        });
        while (_basicSearchGroup.Element.children.length > 0) {
            this.Element.insertBefore(_basicSearchGroup.Element.firstChild, this.Element.firstChild);
        }
    }

    Render() {
        this.Parent.DataLoaded.add(this.ListView_DataLoaded.bind(this));
        if (!this.Meta.CanSearch) {
            return;
        }
        // @ts-ignore
        Html.Take(this.Parent.Element.firstChild.firstChild).TabIndex(-1).Event(EventType.KeyPress, this.EnterSearch.bind(this));
        this.Element = Html.Context;
        this.RenderImportBtn();
        if (this.Meta.ComponentType === 'GridView' || this.Meta.ComponentType === 'TreeView' || !this.Meta.IsRealtime) {
            // @ts-ignore
            var txtSearch = new Textbox({
                FieldName: 'SearchTerm',
                Visibility: true,
                Label: 'Search',
                PlainText: 'Search',
                ShowLabel: false,
            });
            txtSearch.ParentElement = this.Element;
            txtSearch.UserInput = null;
            this.AddChild(txtSearch);
        }

        var startDate = new Datepicker({
            FieldName: 'StartDate',
            Visibility: true,
            Label: 'From date',
            PlainText: 'From date',
            ShowLabel: false,
        });
        startDate.ParentElement = this.Element;
        startDate.UserInput = null;
        this.AddChild(startDate);
        var endDate = new Datepicker({
            FieldName: 'EndDate',
            Visibility: true,
            Label: 'To date',
            PlainText: 'To date',
            ShowLabel: false,
        });
        endDate.ParentElement = this.Element;
        endDate.UserInput = null;
        this.AddChild(endDate);
        if (this.Parent.Meta.ShowDatetimeField) {
            // @ts-ignore
            var dateType = new SearchEntry({
                FieldName: 'DateTimeField',
                PlainText: 'DateTime field',
                FormatData: '{ShortDesc}',
                ShowLabel: false,
                RefName: 'Component',
            });
            dateType.ParentElement = this.Element;
            dateType.UserInput = null;
            this.AddChild(dateType);
        }
        Html.Take(this.Element).Div.ClassName('searching-block')
            .Button.ClassName("btn btn-light btn-sm mr-1").Event(EventType.Click, () => {
                this.Parent.ClearSelected();
                this.Parent.ReloadData().then();
            }).Icon('fal fa-search')
            .End.End
            .Button.ClassName("btn btn-light btn-sm mr-1").Event(EventType.Click, this.AdvancedOptions.bind(this)).Icon('fal fa-cog').End.End
            .Button.ClassName("btn btn-light btn-sm mr-1").Event(EventType.Click, this.RefreshListView.bind(this)).Icon('fal fa-undo').End.End
            .Render();
        if (this.Meta.ShowHotKey && this.ParentGridView != null) {
            Html.Take(this.Element).Div.ClassName('hotkey-block')
                .Button2('F1', "btn btn-light btn-sm mr-1").Event(EventType.Click, () => this.ParentGridView.ToggleAll())
                .Attr('title', 'Uncheck all').End
                .Button2('F2', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F2);
                })
                .Attr('title', 'Filter except').End
                .Button2('F3', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F3);
                })
                .Attr('title', 'Summary selected').End
                .Button2('F4', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F4);
                })
                .Attr('title', 'Lọc tiếp theo các phép tính (Chứa: Bằng; Lớn hơn; Nhỏ hơn; Lớn hơn hoặc bằng;...)').End
                .Button2('F6', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    this.ParentGridView.HotKeyF6Handler(e, KeyCodeEnum.F6);
                })
                .Attr('title', 'Quay lại lần lọc trước').End
                .Button2('F8', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F8);
                })
                .Attr('title', 'Xóa/ Vô hiệu hóa dòng hiện thời hoặc các dòng đánh dấu').End
                .Button2('F9', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F9);
                })
                .Attr('title', 'Lọc tại chỗ theo giá trị ô hiện thời').End
                .Button2('F10', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F10);
                })
                .Attr('title', 'Gộp theo cột hiện thời(thống kê lại số nội dung trong cột)').End
                .Button2('F11', "btn btn-light btn-sm mr-1").Event(EventType.Click, (e) => {
                    var com = this.Parent.LastListViewItem.Children.find(x => x.Meta.Id === this.ParentGridView.LastComponentFocus.Id);
                    this.ParentGridView.ActionKeyHandler(e, this.ParentGridView.LastComponentFocus, this.ParentGridView.LastListViewItem, com, com.Element.Closest(ElementType.td.toString()), KeyCodeEnum.F11);
                })
                .Attr('title', 'Sắp xếp thứ tự tăng dần, giảm dần. (Shift+F11 để sort nhiều cấp)').End.Render();
        }
    }

    RefreshListView() {
        this.EntityVM.SearchTerm = '';
        this.EntityVM.StartDate = null;
        this.EntityVM.EndDate = null;
        this.UpdateView();

        if (!(this.Parent)) {
            return;
        }

        const listView = this.Parent;
        listView.ClearSelected();
        listView.CellSelected.Clear();
        listView.AdvSearchVM.Conditions.Clear();
        listView.Wheres.Clear();
        listView.ApplyFilter();
    }

    FullScreen() {
        var elem = this.Parent.Element;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        }
    }

    /**
     * @param {Event} e
     */
    EnterSearch(e) {
        if (e.KeyCode() !== 13) {
            return;
        }

        this.Parent.ApplyFilter().Done();
    }

    /**
     * @param {Event} e
     */
    UploadCsv(e) {
        /** @type {File[]} */
        var files = e.target['files'];
        if (!files || files.length === 0) {
            return;
        }

        /** @type {HTMLFormElement} */
        // @ts-ignore
        var uploadForm = this._uploader.parentElement;
        var formData = new FormData(uploadForm);
        var meta = this.Parent.Meta;
        // @ts-ignore
        Client.Instance.SubmitAsync({
            FormData: formData,
            Url: `/user/importCsv?table=${meta.RefName}&comId=${meta.Id}&connKey=${meta.MetaConn}`,
            Method: HttpMethod.POST,
            ResponseMimeType: Utils.GetMimeType('csv')
        }).Done(() => {
            Toast.Success('Import excel success');
            this._uploader.value = '';
        }).catch(error => {
            Toast.Warning(error.Message);
            this._uploader.value = '';
        });
    }

    /**
     * @param {Event} e
     */
    AdvancedOptions(e) {
        /** @type {HTMLElement} */
        // @ts-ignore
        const ele = e.target;
        var buttonRect = ele.getBoundingClientRect();
        var show = localStorage.getItem(`Show${this.Meta.Id}`) ?? false;
        var ctxMenu = ContextMenu.Instance;
        ctxMenu.Top = buttonRect.bottom;
        ctxMenu.Left = buttonRect.left;
        ctxMenu.MenuItems = [
            { Icon: 'fa fa-download mr-1', Text: 'Export template', Click: this.ExportAllData.bind(this) },
            { Icon: 'fa fa-download mr-1', Text: 'Import excel', Click: () => this._uploader.Click() },
        ];
        ctxMenu.Render();
    }

    RenderImportBtn() {
        Html.Take(this.Element).Form.Attr('method', 'POST').Attr('enctype', 'multipart/form-data')
            .Display(false).Input.Type('file').Id(`id_${Uuid7.Id25()}`).Attr('name', 'files').Attr('accept', '.csv');
        // @ts-ignore
        this._uploader = Html.Context;
        this._uploader.addEventListener(EventType.Change, (/** @type {Event} */ ev) => this.UploadCsv(ev));
    }

    /**
     * @param {object} arg
     */
    FilterSelected(arg) {
        var selectedIds = this.Parent.SelectedIds;
        if (!selectedIds || selectedIds.length === 0) {
            Toast.Warning('Select rows to filter');
            return;
        }
        if (this.Parent.CellSelected.some(x => x.FieldName === this.IdField)) {
            this.Parent.CellSelected.find(x => x.FieldName === this.IdField).Value = selectedIds.join();
            this.Parent.CellSelected.find(x => x.FieldName === this.IdField).ValueText = selectedIds.join();
        } else {
            // @ts-ignore
            this.Parent.CellSelected.push({
                FieldName: this.IdField,
                FieldText: 'Mã',
                ComponentType: 'Input',
                Value: selectedIds.join(),
                ValueText: selectedIds.join(),
                Operator: OperatorEnum.In,
                OperatorText: 'Chứa',
                Logic: LogicOperation.And,
            });
            this.ParentGridView._summarys.push(new HTMLElement());
        }
        this.Parent.ActionFilter();
    }

    /**
     * @param {object} arg
     */
    ExportCustomData(arg) {
        this.TabEditor?.OpenPopup('Export CustomData', () => this.Exporter()).Done();
    }

    /**
     * @typedef {import('./exportCustomData.js').ExportCustomData} ExportCustomData
     * @returns {Promise<ExportCustomData>}
     */
    async Exporter() {
        const { ExportCustomData } = await import('./exportCustomData.js');
        if (!this._export) {
            this._export = new ExportCustomData(this.Parent);
            this._export.ParentElement = this.TabEditor?.Element;
            this._export.Disposed.add(() => this._export = null);
        }
        return this._export;
    }

    /**
     * @param {object} arg
     */
    async ExportAllData(arg) {
        const exporter = await this.Exporter();
        exporter.Export();
    }

    /**
     * @param {object} arg
     */
    async ExportSelectedData(arg) {
        if (!this.Parent.SelectedIds || this.Parent.SelectedIds.length === 0) {
            Toast.Warning('Select at least 1 one to export excel');
            return;
        }
        const exporter = await this.Exporter();
        exporter.Export(this.Parent.SelectedIds);
    }

    /**
     * @param {object} arg
     */
    OpenExcelFileDialog(arg) {
        this._uploader.click();
    }

    /**
     * Calculates the filter query based on the search terms and date range.
     * @returns {string} The final filter query.
     */
    CalcFilterQuery() {
        if (this.EntityVM.DateTimeField) {
            this.DateTimeField = this.Parent.Header.find(x => x.Id === this.EntityVM.DateTimeField).FieldName;
        }
        const headers = this.Parent.Header.filter(x => !x.HasFilter && (x.ComponentType == "Input" || x.ComponentType == "Textarea" || x.ComponentType == "Dropdown"));
        const searchTerm = Utils.EncodeSpecialChar(this.EntityVM.SearchTerm?.trim()) || '';
        const operators = headers.map(x => ComponentExt.MapToFilterOperator(x, searchTerm)).filter(x => x != null && x != "");
        let finalFilter = operators.join(" or ");
        const basicsAddDate = this.Parent.Header.filter(x => x.AddDate).map(x => x.Id);
        const parentGrid = basicsAddDate.length && basicsAddDate.some(id => this.ParentGridView.AdvSearchVM.Conditions.some(cond => cond.FieldId === id && cond.Value));
        if (!parentGrid && this.EntityVM.StartDate) {
            const startDateCondition = `ds.[${this.DateTimeField}] >= '${this.EntityVM.StartDate.toISOString().slice(0, 10)}'`;
            const oldStartDate = this.Parent.Wheres.find(x => x.Condition.includes(`ds.[${this.DateTimeField}] >=`));
            if (!oldStartDate) {
                this.Parent.Wheres.push({ Condition: startDateCondition, Group: false });
            } else {
                oldStartDate.Condition = startDateCondition;
            }
            localStorage.setItem("FromDate" + this.Parent.Meta.Id, this.EntityVM.StartDate.toISOString().slice(0, 10));
        } else if (!this.EntityVM.StartDate) {
            const startDateIndex = this.Parent.Wheres.findIndex(x => x.Condition.includes(`ds.[${this.DateTimeField}] >=`));
            if (startDateIndex !== -1) {
                this.Parent.Wheres.splice(startDateIndex, 1);
            }
            localStorage.removeItem("FromDate" + this.Parent.Meta.Id);
        }

        if (!parentGrid && this.EntityVM.EndDate) {
            if (finalFilter) {
                finalFilter += " and ";
            }
            const endDate = new Date(this.EntityVM.EndDate.getTime() + 86400000);  // Add one day
            const endDateCondition = `ds.[${this.DateTimeField}] < '${endDate.toISOString().slice(0, 10)}'`;
            const oldEndDate = this.Parent.Wheres.find(x => x.Condition.includes(`ds.[${this.DateTimeField}] <`));
            if (!oldEndDate) {
                this.Parent.Wheres.push({ Condition: endDateCondition, Group: false });
            } else {
                oldEndDate.Condition = endDateCondition;
            }
            localStorage.setItem("ToDate" + this.Parent.Meta.Id, endDate.toISOString().slice(0, 10));
        } else if (!this.EntityVM.EndDate) {
            const endDateIndex = this.Parent.Wheres.findIndex(x => x.Condition.includes(`ds.[${this.DateTimeField}] <`));
            if (endDateIndex !== -1) {
                this.Parent.Wheres.splice(endDateIndex, 1);
            }
            localStorage.removeItem("ToDate" + this.Parent.Meta.Id);
        }

        if ((this.EntityVM.EndDate || this.EntityVM.StartDate) && this.Parent.Meta.ShowNull) {
            finalFilter += ` or ds.${this.DateTimeField} is null`;
        }
        return finalFilter;
    }

    /**
     * Gets or sets whether the component is disabled.
     * Always returns false indicating that it cannot be disabled.
     */
    get Disabled() {
        return false;
    }

    set Disabled(value) {
        // Components are never disabled, ignore the input.
    }

    AdvancedSearch(arg) {
        ComponentExt.OpenPopup(this.TabEditor, "AdvancedSearch", () => {
            // @ts-ignore
            var editor = new AdvancedSearch(this.ParentListView);
            editor.Parent = this.Parent,
                editor.ParentElement = this.TabEditor.Element
            return editor;
        }).Done();
    }
}

