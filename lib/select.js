import { EditableComponent } from './editableComponent.js';
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { PositionEnum, KeyCodeEnum, ObservableList, Component, EventType, ValidationRule } from "./models/index.js";
import { LangSelect } from "./utils/langSelect.js";
import { ComponentExt } from './utils/componentExt.js';
import { GridView } from './gridView.js';
import { Client } from './clients/client.js';
import SlimSelect from 'slim-select';

export class Select extends EditableComponent {
    IsSearchEntry = true;
    IsMultiple = false;
    /**
     * @type {SlimSelect}
     */
    SS;
    Data;
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
        /** @type {HTMLDivElement} */
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
        this.Data = Utils.IsFunction(this.Meta.Query, false, this);
        this.SS = new SlimSelect({
            select: this.Element.firstElementChild,
            data: this.Data.map(x => ({ text: x.Name, value: x.Id, html: x.Description || x.Name })),
            settings: {
                disabled: this.Meta.Disabled,
                showSearch: this.Data.length >= 5
            },
            events: {
                afterChange: (newVal) => {
                    var mapEntity = this.Data.find(x => x.Id == newVal[0].value);
                    this.EntrySelected(mapEntity);
                }
            }
        });
        this.SS.setSelected(this.Entity[this.Name] || this.Data[0].Id);
        this.FindMatchText();
    }

    RenderInputAndEvents() {
        if (this.Element == null) {
            this._input = Html.Take(this.ParentElement).TextAlign("left").Div.Position(PositionEnum.relative).TabIndex(-1).ClassName(this.SEntryClass).Select.TabIndex(-1).GetContext();
            this._parentInput = this._input.parentElement;
            this.Element = this._input.parentElement;
        }
        else {
            this._input = this.Element.firstElementChild;
        }
        if (this.Parent.IsListViewItem) {
            Html.Take(this.Element.parentElement).Event(EventType.KeyDown, (e) => this.SEKeydownHandler(e));
        }
        else {
            Html.Take(this.Element).Event(EventType.KeyDown, (e) => this.SEKeydownHandler(e));
        }
    }

    SEKeydownHandler(e) {
        if (this.Disabled || e === null) {
            return;
        }
        let code = e.KeyCodeEnum();
        switch (code) {
            case KeyCodeEnum.Enter:
                this.SS.open();
                break;
            default:
                break;
        }
    }

    Dispose() {
        super.Dispose();
    }

    FindMatchText() {
        this.Matched = this.Data.filter(x => x.Id == this.Entity[this.Meta.FieldName])[0];
    }

    EntrySelected(rowData) {
        this.EmptyRow = false;
        if (rowData === null || this.Disabled) {
            return;
        }

        let oldMatch = this.Matched;
        this.Matched = rowData;
        let oldValue = this._value;
        this._value = rowData.Id;
        this.Entity[this.Name] = this._value;
        this.Dirty = true;
        this.Matched = rowData;
        if (this._gv !== null) {
            this._gv.Show = false;
        }
        this.PopulateFields(this.Matched);
        this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, rowData, oldMatch).then(() => {
            this.UserInput?.Invoke({ NewData: this._value, OldData: oldValue, EvType: EventType.Change });
        });
        window.setTimeout(() => {
            if (this.Parent.IsListViewItem) {
                this.Element.parentElement.focus()
            }
            else {
                this.Element.focus()
            }
        }, 100);
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this._value = this.Entity[this.Meta.FieldName];
        if (this._value === null) {
            this.Matched = null;
            this.SS.setSelected(this.Data[0].Id);
            return;
        }
        else {
            this.SS.setSelected(this._value);
            this.FindMatchText();
        }
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
        if (this.SS !== null) {
            if (value) {
                this.SS.disable();
            }
            else {
                this.SS.enable();
            }
        }
    }

    RemoveDOM() {
        if (this._input !== null && this._input.parentElement !== null) {
            this._input.parentElement.remove();
        }
    }
}
