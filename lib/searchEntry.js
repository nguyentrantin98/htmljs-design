import { EditableComponent } from './editableComponent.js';
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { PositionEnum, KeyCodeEnum, ObservableList, Component, EventType, ValidationRule } from "./models/";
import { LangSelect } from "./utils/langSelect.js";
import { ComponentExt } from './utils/componentExt.js';
import { GridView } from './gridView.js';
import { Client } from './clients/client.js';
import { Toast } from './toast.js';

export class SearchEntry extends EditableComponent {
    IsSearchEntry = true;
    IsMultiple = false;
    /**
     * Create instance of component
     * @param {Component | null} ui 
     * @param {HTMLElement | null} ele 
     */
    constructor(ui, ele = null) {
        super(ui);
        this.DefaultValue = '';
        this.SEntryClass = "search-entry"
        this.Meta.ComponentGroup = null;
        this.Meta.Row = this.Meta.Row ?? 50;
        this.RowData = new ObservableList();
        /** @type {HTMLInputElement} */
        this._input = null;
        /** @type {HTMLElement} */
        this._rootResult = null;
        /** @type {HTMLElement} */
        this._parentInput = null;
        /** @type {HTMLElement} */
        this._backdrop = null;
        this._waitForInput = null;
        this._waitForDispose = null;
        this._contextMenu = false;
        this.SearchResultEle = null;
        this._gv = null;
        let containId = Utils.isNullOrWhiteSpace(this.Meta.TabGroup) ? this.Meta.FieldName.substr(this.Meta.FieldName.length - 2) === this.IdField : this.Meta.TabGroup.substr(this.Meta.TabGroup.length - 2) === this.IdField;
        if (containId) {
            this.DisplayField = Utils.isNullOrWhiteSpace(this.Meta.TabGroup) ? this.Meta.FieldName.substr(0, this.Meta.FieldName.length - 2) : this.Meta.TabGroup.substr(0, this.Meta.TabGroup.length - 2);
        }
        else {
            this.DisplayField = this.Meta.FieldName + "MasterData";
        }
        if (this.Meta.FieldName == "CurrencyId") {
            this.IsCurrency = true;
        }
    }

    Render() {
        this.SetDefaultVal();
        this._value = this.Entity[this.Name];
        this.RenderInputAndEvents();
        if (this.Meta.ShowHotKey) {
            this.RenderIcons();
        }
        this.FindMatchText();
        this.SearchResultEle = document.body;
    }

    RenderInputAndEvents() {
        if (this.ParentElement.tagName == "INPUT") {
            this.Element = this._input = this.ParentElement;
        }
        if (this.Element == null) {
            this.Element = this._input = Html.Take(this.ParentElement).Div.Position(PositionEnum.relative).TabIndex(-1).ClassName(this.SEntryClass).Input.GetContext();
            this._parentInput = this._input.parentElement;
        }
        else {
            this._input = this.Element;
            if (!this._input.parentElement.classList.includes(this.SEntryClass)) {
                var parent = document.createElement("div");
                parent.classList.add(this.SEntryClass);
                this._input.parentElement.appendChild(parent);
                this._input.parentElement.insertBefore(parent, this._input);
            }
        }
        this._input.autocomplete = "off";
        Html.Take(this._input).PlaceHolder(this.Meta.PlainText)
            .Event(EventType.ContextMenu, () => this._contextMenu = true)
            .Event(EventType.Focus, this.FocusIn.bind(this))
            .Event(EventType.FocusOut, this.DiposeGvWrapper.bind(this))
            .Event(EventType.KeyDown, this.SEKeydownHandler.bind(this))
            .Event(EventType.Input, () => this.Search(this._input.value, true, null, true, false));
    }

    SEKeydownHandler(e) {
        if (this.Disabled || e === null) {
            return;
        }
        let code = e.KeyCodeEnum();
        switch (code) {
            case KeyCodeEnum.Escape:
                if (this._gv && this._gv.Element !== null) {
                    e.stopPropagation();
                    this._gv.Show = false;
                }
                break;
            case KeyCodeEnum.UpArrow:
                if (this._gv && this._gv.Element !== null && this._gv.Show) {
                    e.stopPropagation();
                    this._gv.MoveUp();
                }
                break;
            case KeyCodeEnum.DownArrow:
                if (this._gv && this._gv.Element !== null && this._gv.Show) {
                    e.stopPropagation();
                    this._gv.MoveDown();
                }
                break;
            case KeyCodeEnum.Enter:
                this.EnterKeydownHandler(code);
                break;
            case KeyCodeEnum.F6:
                if (this._gv && this._gv.Element !== null && this._gv.Show) {
                    e.preventDefault();
                    this._gv.HotKeyF6Handler(e, KeyCodeEnum.F6);
                }
                break;
            default:
                if (e.shiftKey && code === KeyCodeEnum.Delete) {
                    this._input.value = null;
                    this.Search();
                }
                break;
        }
    }

    EnterKeydownHandler(code) {
        if (this._gv !== null && this._gv.Show) {
            this.EnterKeydownTableStillShow(code);
        } else {
            this.Search(null, false, 0);
        }
    }

    EnterKeydownTableStillShow(code) {
        if (this._gv.SelectedIndex > -1) {
            let row = this._gv.AllListViewItem[this._gv.SelectedIndex].Entity;
            this.EntrySelected(row);
        } else {
            if (this._gv.AllListViewItem && this._gv.AllListViewItem.length === 1 && code === KeyCodeEnum.Enter) {
                this.EntrySelected(this._gv.AllListViewItem[0].Entity);
            }
        }
    }

    FocusIn() {
        this.ParentElement.classList.add('cell-selected');
        if (this._contextMenu) {
            this._contextMenu = false;
            return;
        }
        if (this.Disabled || this.Meta.FocusSearch) {
            return;
        }
        this.Search(null, false, 0);
    }

    FocusOut() {
        this.ParentElement.classList.remove('cell-selected');
    }

    Dispose() {
        this.DisposeGv();
        super.Dispose();
    }

    DiposeGvWrapper(e = null) {
        window.clearTimeout(this._waitForDispose);
        this._waitForDispose = window.setTimeout(this.DisposeGv.bind(this), 50);
    }

    DisposeGv() {
        this.DisposeMobileSearchResult();
        if (this._gv !== null) {
            this._gv.Show = false;
        }
        this._parentInput.appendChild(this._input);
    }

    RenderIcons() {
        let title = LangSelect.Get('Create new data');
        Html.Take(this.Element.parentElement).Div.ClassName('search-icons');
        let div = Html.Instance.Icon('fa fa-plus').Title(`${title} ${LangSelect.Get(this.Meta.Label)}`).Event('click', this.OpenRefAdd.bind(this)).End.GetContext();
        if (this.Element.nextElementSibling !== null) {
            this.Element.parentElement.insertBefore(div, this.Element.nextElementSibling);
        } else {
            this.Element.parentElement.appendChild(div);
        }
    }

    OpenRefDetail() {
        if (Utils.isNullOrWhiteSpace(this.Meta.Events)) {
            return;
        }
        this.DispatchCustomEvent(this.Meta.Events, "edit", this).then();
    }

    OpenRefAdd() {
        if (Utils.isNullOrWhiteSpace(this.Meta.Events)) {
            return;
        }
        this.DispatchCustomEvent(this.Meta.Events, "add", this).then();
    }

    FeatureLoaded(feature) {
        let instance = new (eval(this.Meta.RefClass))();
        instance.Id = feature.Name;
        instance.ParentForm = this.TabEditor;
        instance.ParentElement = this.TabEditor.Element;
        this.TabEditor.AddChild(instance);
        let res;
        // @ts-ignore
        if (!this.Meta.Template.trim() !== "") {
            var fn = Utils.IsFunction(this.Meta.Template, false, this);
            if (!fn) {
                res = Utils.FormatEntity2(this.Meta.Template, null, this.Matched, Utils.EmptyFormat, Utils.EmptyFormat);
            }
            let entity = JSON.parse(res);
            instance.Entity = entity;
        }
        instance.DOMContentLoaded += () => {
            let groupButton = instance.FindComponentByName('Button');
            let htmlTd = document.createElement('td');
            let htmlTr = groupButton.Element.querySelector('tr');
            htmlTr.prepend(htmlTd);
            Html.Take(htmlTd).Button.ClassName('btn btn-secondary').Icon('fal fa-file-check').End.IText('Apply').Event('click', () => {
                instance.IsFormValid().Done(valid => {
                    if (!valid) return;
                    instance.SavePatch().Done(success => {
                        if (success) {
                            this.SaveAndApply(instance.Entity);
                            instance.Dispose();
                        }
                    });
                });
            }).End.Render();
        };
    }

    SaveAndApply(entity) {
        let oldValue = this.Value;
        this.Dirty = true;
        this.Matched = entity;
        if (!(this.Parent.IsListViewItem)) {
            this.Value = entity[this.IdField]?.toString();
            this.Dirty = true;
            this.Parent.EditForm.Dirty = true;
            if (this.UserInput !== null) {
                this.PopulateFields(this.Matched);
                // @ts-ignore
                this.UserInput?.Invoke({ NewData: this._value, OldData: oldValue, EvType: EventType.Change });
            }
            return;
        }
        if (this.UserInput !== null) {
            this.PopulateFields(this.Matched);
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, this.Parent.Entity, this.Matched).then();
            // @ts-ignore
            this.UserInput?.Invoke({ NewData: this._value, OldData: oldValue, EvType: EventType.Change });
        }
    }

    Search(term = null, changeEvent = true, timeout = 500, Delete = false, search = false) {
        if (!Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
            if (this._input.value != this.OriginalText) {
                this._value = this._input.value;
                this.Entity[this.Meta.FieldName] = this._input.value;
                this.Entity[this.Meta.TabGroup] = null;
                this.Entity[this.DisplayField] = null;
                this.Matched = null;
                this.Dirty = true;
            }
        }
        if (this.Meta.HideGrid && !search) {
            return;
        }
        window.clearTimeout(this._waitForInput);
        this._waitForInput = window.setTimeout(() => {
            if (this._gv !== null) {
                this._gv.Wheres = [];
                this._gv.AdvSearchVM.Conditions = [];
                this._gv.CellSelected = [];
            }
            if (changeEvent && !this._input.value) {
                this.InputEmptyHandler(Delete);
                return;
            }
            this.TriggerSearch(term);
        }, timeout);
    }

    TriggerSearch(term = null) {
        this.RenderGridView(term);
    }

    async RenderGridView(term = null) {
        if (this._isRendering) {
            return;
        }
        this._isRendering = true;
        if (this._gv !== null) {
            this.RenderRootResult();
            this._gv.ParentElement = this._rootResult;
            this._gv.Entity = this.Entity;
            this._gv.ListViewSearch.EntityVM.SearchTerm = term;
            this._gv.RowData.Data = [];
            this._gv.ActionFilter();
            this.GridResultDomLoaded();
            this._isRendering = false;
            return;
        }
        /**
             * @type {Component}
             */
        var newMeta = JSON.parse(JSON.stringify(this.Meta));
        newMeta.DisabledExp = null;
        newMeta.ShowExp = null;
        // @ts-ignore
        if (Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
            this._gv = new GridView(newMeta);
            this._gv.Meta = newMeta;
        } else {
            //this._gv = new GroupGridView(this.Meta);
        }
        this.RenderRootResult();
        this._gv.Meta = newMeta;
        this.ParentElement = this._rootResult;
        this._gv.EditForm = this.EditForm;
        this._gv.ParentElement = this._rootResult;
        this._gv.Entity = this.Entity;
        this._gv.Parent = this;
        this._gv.AlwaysValid = true;
        this._gv.PopulateDirty = false;
        this._gv.ShouldSetEntity = false;
        this._gv.DOMContentLoaded.add(this.GridResultDomLoaded.bind(this));
        this._gv.AddSections();
        this._gv.Render();
        this._gv.Show = false;
        this._gv.Element.classList.add('floating');
        this._gv.RowClick.add(this.EntrySelected.bind(this));
        this._isRendering = false;
        if (this._gv.Paginator && this._gv.Paginator?.Element !== null) {
            this._gv.Paginator.Element.tabIndex = -1;
            this._gv.Paginator.Element.addEventListener('focusin', () => window.clearTimeout(this._waitForDispose));
            this._gv.Paginator.Element.addEventListener('focusout', this.DiposeGvWrapper.bind(this));
        }
        if (this._gv.MainSection && this._gv.MainSection?.Element !== null) {
            this._gv.MainSection.Element.tabIndex = -1;
            this._gv.MainSection.Element.addEventListener('focusin', () => window.clearTimeout(this._waitForDispose));
            this._gv.MainSection.Element.addEventListener('focusout', this.DiposeGvWrapper.bind(this));
        }
        if (this._gv.HeaderSection && this._gv.HeaderSection?.Element !== null) {
            this._gv.HeaderSection.Element.tabIndex = -1;
            this._gv.HeaderSection.Element.addEventListener('focusin', () => window.clearTimeout(this._waitForDispose));
            this._gv.HeaderSection.Element.addEventListener('focusout', this.DiposeGvWrapper.bind(this));
        }
        if (this.Meta.LocalHeader === null) {
            this.Meta.LocalHeader = Array.from(this._gv.header.filter(x => x.id != null));
        }
        var crollElement = this.Element.closest(".scroll-content");
        if (crollElement != null) {
            crollElement.addEventListener(EventType.Scroll, this.AlterPositionGV.bind(this));
        }
    }

    RenderRootResult() {
        if (this._rootResult !== null) {
            return;
        }
        if (!this.IsSmallUp && this._backdrop === null) {
            Html.Take(EditableComponent.TabContainer).Div.ClassName('backdrop');
            this._backdrop = Html.Context;
            Html.Instance.Div.ClassName('popup-content').Style('top: 0;width: 100%;')
                .Div.ClassName('popup-title').Span.IconForSpan('fal fal fa-search').End
                .Span.IText('Search').End.Div.ClassName('icon-box')
                .Span.ClassName('fa fa-times').Event('click', this.DisposeMobileSearchResult.bind(this)).End
                .End.End.Div.ClassName('popup-body scroll-content');
            this._rootResult = Html.Context;
            this._rootResult.appendChild(this._input);
        } else if (this.IsSmallUp) {
            this._rootResult = document.createElement('div');
            this._rootResult.classList.add('result-wrapper');
            this.SearchResultEle.appendChild(this._rootResult);
        }
    }

    DisposeMobileSearchResult() {
        this._parentInput.appendChild(this._input);
        if (this._backdrop !== null) {
            this._backdrop.remove();
            this._backdrop = null;
        }
        if (this._rootResult !== null) {
            this._rootResult.remove();
            this._rootResult = null;
        }
    }

    async GridResultDomLoaded() {
        this.FocusBackWithoutEvent();
        this._gv.SelectedIndex = -1;
        this._gv.RowAction(x => {
            x.Selected = false;
        });
        this._gv.Element.style.inset = null;
        this.RenderRootResult();
        this._rootResult.appendChild(this._gv.Element);
        if (!this.Meta.HideGrid) {
            this._gv.Show = true;
        }
        if (this.IsSmallUp) {
            ComponentExt.AlterPosition(this._gv.Element, this._input);
        } else {
            this._gv.Element.style.maxWidth = '100%';
            this._gv.Element.style.minWidth = 'calc(100% - 2rem)';
        }
        if (this.Meta.HideGrid) {
            this.EntrySelected(this._gv?.RowData.Data[0]);
        }
        this.FocusBackWithoutEvent();
    }

    AlterPositionGV() {
        ComponentExt.AlterPosition(this._gv.Element, this._input);
    }

    FocusBackWithoutEvent() {
        window.clearTimeout(this._waitForDispose);
        window.clearTimeout(this._waitForInput);
        if (!this.Meta.IsPivot) {
            this._input.focus();
        }
    }

    InputEmptyHandler(deleteFlag) {
        let oldValue = this._value;
        let oldMatch = this.Matched;
        this.Matched = null;
        this._value = null;
        this._input.value = '';
        this.Dirty = true;
        if (oldMatch !== this.Matched) {
            this.Entity[this.Name] = null;
            if (!Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
                this.Entity[this.Meta.TabGroup] = null;
                this.Entity[this.DisplayField] = null;
            }
            this.PopulateFields(this.Matched);
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, this.Matched, oldMatch).then();
            // @ts-ignore
            this.UserInput?.Invoke({ NewData: this._value, OldData: oldValue, EvType: EventType.Change });
        }
        if (deleteFlag && !this._input.value) {
            return;
        }
        if (this.IsMultiple) {
            this._isRendering = false;
        }
        this.TriggerSearch(null);
    }

    _findMatchTextAwaiter;

    FindMatchText() {
        if (!Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
            if (this.Entity[this.Meta.TabGroup]) {
                Client.Instance.GetByIdAsync(this.Meta.RefName, [this.Entity[this.Meta.TabGroup]]).then(data => {
                    this.Matched = data.data ? data.data[0] : null;
                    this.SetMatchedValue();
                })
            }
            else {
                this._input.value = this.Entity[this.Meta.FieldName] || '';
                this.SetMatchedValue();
            }
            return;
        }
        if (Utils.isNullOrWhiteSpace(this.Meta.RefName)) {
            window.setTimeout(() => {
                var data = Utils.IsFunction(this.Meta.Query, false, this);
                this.Matched = data.filter(x => x.Id == this.Entity[this.Meta.FieldName])[0];
                this.SetMatchedValue();
            }, 500);
        }
        else {
            this.Matched = this.Entity[this.DisplayField] || null;
            if ((this._value && this.Matched && this.Matched.Id != this._value) || (!this.Matched && this._value)) {
                Client.Instance.GetByIdAsync(this.Meta.RefName, [this._value]).then(data => {
                    this.Matched = data.data ? data.data[0] : null;
                    this.SetMatchedValue();
                })
            }
            else {
                this.SetMatchedValue();
            }
        }
    }

    SetMatchedValue() {
        if (!Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
            this._input.value = !this.Matched ? (this.Entity[this.Meta.FieldName] || '') : this.GetMatchedText(this.Matched);
            this.Entity[this.Meta.TabGroup] = !this.Matched ? null : this.Matched[this.IdField];
            this.Entity[this.Name] = !this._input.value ? null : this._input.value.trim();
        }
        else {
            this._input.value = this.EmptyRow ? "" : this.GetMatchedText(this.Matched);
            this.Entity[this.Name + "Text"] = !this._input.value ? null : this._input.value.trim();
        }
        this.UpdateValue();
        if (this.IsCurrency) {
            this.Entity.ExchangeRateVND = (EditableComponent.ExchangeRateVND[this.GetValueText()] || null);
            this.Entity.ExchangeRateUSD = (EditableComponent.ExchangeRateUSD[this.GetValueText()] || null);
        }
    }

    UpdateValue() {
        if (!this.Dirty) {
            this.OriginalText = this._input.value;
            this.DOMContentLoaded?.invoke();
            this.OldValue = this._value?.toString();
        }
    }

    PatchDetail() {
        let res = [
            {
                Label: this.ComLabel + '(value)',
                Field: this.Name,
                Value: this._value,
                OldVal: this.OldValue
            }
        ];
        if (!this.Meta.FieldText) {
            let display = Utils.GetPropValue(this.Entity, this.Meta.DisplayField) ?? {};
            display[this.Meta.DisplayDetail] = this._input.value;
            res.push({
                Label: this.ComLabel + '(text)',
                Field: this.Meta.DisplayField,
                Value: JSON.stringify(display),
                HistoryValue: this._input.value,
                OldVal: this.OriginalText,
            });
        }
        return res;
    }

    GetMatchedText(matched) {
        if (matched === null && this.Entity === null || !matched) {
            this.Entity[this.DisplayField] = null;
            return '';
        }
        this.Entity[this.DisplayField] = matched;
        let res = Utils.FormatEntity(this.Meta.FormatData, matched);
        return res || "";
    }

    ActEntrySelected(rowData) {
        window.clearTimeout(this._waitForDispose);
        this.EmptyRow = false;
        if (rowData === null || this.Disabled) {
            return;
        }

        let oldMatch = this.Matched;
        this.Matched = rowData;
        let oldValue = this._value;
        if (!Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
            this._value = this.GetMatchedText(this.Matched);
            this.Entity[this.Meta.TabGroup] = rowData[this.IdField];
        }
        else {
            this._value = rowData[this.IdField];
        }
        if (this.Entity !== null && this.Name) {
            if (Utils.isNullOrWhiteSpace(this.Meta.TabGroup)) {
                this.Entity[this.Name] = this._value;
            }
            else {
                this.Entity[this.Meta.FieldName] = this.GetMatchedText(this.Matched);
                this.Entity[this.Meta.TabGroup] = rowData[this.IdField];
            }
        }
        this.Dirty = true;
        this.Matched = rowData;
        this.SetMatchedValue();
        if (this._gv !== null) {
            this._gv.Show = false;
        }
        this.PopulateFields(this.Matched);
        this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, rowData, oldMatch).then(() => {
            // @ts-ignore
            this.UserInput?.Invoke({ NewData: this._value, OldData: oldValue, EvType: EventType.Change });
            this.DiposeGvWrapper();
        });
        if (this.Parent.IsListViewItem) {
            window.setTimeout(() => {
                this._input.focus();
            }, 200);
        }
        else {
            if (!Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
                var groups = this.EditForm.ChildCom.filter(x => x.Meta.GroupBy == this.Meta.GroupBy);
                var index = groups.indexOf(this);
                if (groups[index + 1]) {
                    groups[index + 1].Focus();
                }
                else {
                    var groupIndex = this.Parent.Parent.Children.indexOf(this.Parent);
                    if (this.Parent.Parent.Children[groupIndex + 1] && this.Parent.Parent.Children[groupIndex + 1].Children[0]) {
                        this.Parent.Parent.Children[groupIndex + 1].Children[0].Focus();
                    }
                }
            }
            else {
                var index = this.Parent.Children.indexOf(this);
                if (this.Parent.Children[index + 1]) {
                    this.Parent.Children[index + 1].Focus();
                }
                else {
                    var groupIndex = this.Parent.Parent.Children.indexOf(this.Parent);
                    if (this.Parent.Parent.Children[groupIndex + 1] && this.Parent.Parent.Children[groupIndex + 1].Children[0]) {
                        this.Parent.Parent.Children[groupIndex + 1].Children[0].Focus();
                    }
                }
            }
        }
    }

    EntrySelected(rowData) {
        if (!Utils.isNullOrWhiteSpace(rowData["ToastWarning"])) {
            this.EditForm.OpenConfig(rowData["ToastWarning"], () => {
                this.ActEntrySelected(rowData);
            }, () => { }, false, [], true)
        }
        else {
            this.ActEntrySelected(rowData);
        }
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        var newValue = this.Entity[this.Meta.FieldName];
        this._value = this.Entity[this.Meta.FieldName];
        if (newValue === null) {
            this.Matched = null;
            this.GetMatchedText(this.Matched);
            this._input.value = null;
            this.UpdateValue();
            return;
        }
        this.FindMatchText();
    }

    async ValidateAsync() {
        if (this.ValidationRules.length == 0) {
            return true;
        }
        this.ValidationResult = [];
        this.ValidateRequired(this._value);
        this.Validate(ValidationRule.Equal, this._value, (value, ruleValue) => value === ruleValue);
        this.Validate(ValidationRule.NotEqual, this._value, (value, ruleValue) => value !== ruleValue);
        return this.IsValid;
    }

    SetDisableUI(value) {
        if (this._input !== null) {
            this._input.readOnly = value;
            this._input.placeholder = value ? "" : (Utils.isNullOrWhiteSpace(this.Meta.PlainText) ? "" : this.Meta.PlainText);
        }
    }

    RemoveDOM() {
        if (this._input !== null && this._input.parentElement !== null) {
            this._input.parentElement.remove();
        }
    }
}
