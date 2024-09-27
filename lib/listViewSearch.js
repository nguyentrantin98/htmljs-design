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

    Render() {
        if (!this.Meta.CanSearch) {
            return;
        }
        // @ts-ignore
        Html.Take(this.Parent.Element.firstChild.firstChild).TabIndex(-1).Event(EventType.KeyPress, this.EnterSearch.bind(this));
        this.Element = Html.Context;
        this.RenderImportBtn();
        Html.Take(this.Element).Div.Render();
        var txtSearch = new Textbox({
            FieldName: 'SearchTerm',
            Visibility: true,
            Label: 'Search',
            PlainText: 'Search',
            ShowLabel: false,
        });
        txtSearch.ParentElement = Html.Context;
        txtSearch.UserInput = null;
        this.AddChild(txtSearch);
        Html.End.Render();
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
            .Button.ClassName("btn btn-light btn-sm mr-1").Event(EventType.Click, this.RefreshListView.bind(this)).Icon('fal fa-undo').End.End
            .Render();
        this.BasicSearch = this.Parent.EditForm.Meta.GridPolicies.filter(x => x.EntityId == this.Parent.Meta.FieldName).filter(x => x.Active && x.BasicSearch).sort((a, b) => b.Order - a.Order);
        if (this.BasicSearch.length === 0) {
            return;
        }
        Html.Take(this.Element);
        var components = this.BasicSearch.map(header => {
            this.Parent.AdvSearchVM.Conditions.push({
                FieldId: header.FieldName,
                CompareOperatorId: OperatorEnum.In,
                LogicOperatorId: LogicOperation.And,
                Field: header
            });
            return {
                ShowLabel: false,
                Id: header.Id,
                FieldName: header.FieldName,
                ComponentType: header.ComponentType,
                FormatData: header.FormatData,
                Query: header.Query,
                PreQuery: header.PreQuery,
                PlainText: header.Label,
                Visibility: true,
                Template: header.Template,
                BasicSearch: true,
                Column: 1
            };
        });
        var sectionInfo = {
            Components: components,
            Column: components.length,
            IsSimple: true,
            ClassName: 'wrapper'
        };
        var _basicSearchGroup = Section.RenderSection(this, sectionInfo);
        _basicSearchGroup.Children.forEach(child => {
            child.UserInput.add(changes => {
                var condition = this.Parent.AdvSearchVM.Conditions.find(x => x.Field.FieldName === child.Meta.FieldName);
                condition.Value = child.FieldVal?.toString();
            });
        });
        this.Element.insertBefore(_basicSearchGroup.Element, this.Element.firstChild);
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
        listView.CellSelected = [];
        listView.AdvSearchVM.Conditions = [];
        listView.Wheres = [];
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
        if (this.Meta.CanExport) {
            ctxMenu.MenuItems = [
                { Icon: 'fa fa-download mr-1', Text: 'Export excel', Click: this.ExportAllData.bind(this) },
            ];
        }
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
        const headers = this.Parent.Header.filter(x => x.ComponentType == "Dropdown" || x.ComponentType == "Textarea" || x.ComponentType == "Input" || x.ComponentType == "Datepicker");
        const searchTerm = this.EntityVM.SearchTerm;
        var check = false;
        const operators = headers.map(x => {
            var mapCom = this.Parent.SearchSection.Children.find(y => y.Meta.FieldName == x.FieldName);
            var textFilter = ComponentExt.MapToFilterOperator(x, searchTerm);
            if (mapCom && mapCom.GetValueText()) {
                if (mapCom instanceof Datepicker) {
                    textFilter = ComponentExt.MapToFilterOperator(x, mapCom.Value.format('YYYY-MM-DD') || "")
                }
                else {
                    textFilter = ComponentExt.MapToFilterOperator(x, mapCom.GetValueText() || "")
                }
                check = true;
            }
            return textFilter;
        }).filter(x => !Utils.isNullOrWhiteSpace(x));
        let finalFilter = operators.join(check ? " and " : " or ");
        const basicsAddDate = this.Parent.Header.filter(x => x.AddDate).map(x => x.Id);
        const parentGrid = basicsAddDate.length && basicsAddDate.some(id => this.Parent.AdvSearchVM.Conditions.some(cond => cond.FieldId === id && cond.Value));
        if (!parentGrid && this.EntityVM.StartDate) {
            const startDateCondition = `ds.[${this.DateTimeField}] >= '${this.EntityVM.StartDate}'`;
            const oldStartDate = this.Parent.Wheres.find(x => x.Condition.includes(`ds.[${this.DateTimeField}] >=`));
            if (!oldStartDate) {
                this.Parent.Wheres.push({ Condition: startDateCondition, Group: false });
            } else {
                oldStartDate.Condition = startDateCondition;
            }
        } else if (!this.EntityVM.StartDate) {
            const startDateIndex = this.Parent.Wheres.findIndex(x => x.Condition.includes(`ds.[${this.DateTimeField}] >=`));
            if (startDateIndex !== -1) {
                this.Parent.Wheres.splice(startDateIndex, 1);
            }
        }

        if (!parentGrid && this.EntityVM.EndDate) {
            if (finalFilter) {
                finalFilter += " and ";
            }
            const endDateCondition = `ds.[${this.DateTimeField}] <= '${this.EntityVM.EndDate}'`;
            const oldEndDate = this.Parent.Wheres.find(x => x.Condition.includes(`ds.[${this.DateTimeField}] <`));
            if (!oldEndDate) {
                this.Parent.Wheres.push({ Condition: endDateCondition, Group: false });
            } else {
                oldEndDate.Condition = endDateCondition;
            }
        } else if (!this.EntityVM.EndDate) {
            const endDateIndex = this.Parent.Wheres.findIndex(x => x.Condition.includes(`ds.[${this.DateTimeField}] <`));
            if (endDateIndex !== -1) {
                this.Parent.Wheres.splice(endDateIndex, 1);
            }
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

