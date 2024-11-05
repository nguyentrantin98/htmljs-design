import { EditableComponent } from './editableComponent.js';
import EventType from './models/eventType.js';
import { Utils } from './utils/utils.js';
import { ValidationRule } from './models/validationRule.js';
import { Html } from './utils/html.js';
import { Component } from './models/component.js';
import Decimal from 'decimal.js';
import { LangSelect } from './utils/langSelect.js';

export class Numbox extends EditableComponent {
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        /** @type {HTMLInputElement} */
        if (ele && ele.tagName == "INPUT") {
            this._input = ele;
        }
        /** @type {Decimal} */
        this._value = null;
        this._isString = false;
        this._decimalSeparator = '.';
        this.SetSelection = true;
        this.DefaultValue = 0;
        this.Meta.Precision = this.Meta.GroupTypeId ? parseInt(LangSelect._webConfig[this.Meta.GroupTypeId]) : parseInt(this.Meta.Precision || 0);
    }

    /** @type {Decimal} */
    get Value() {
        return this._value;
    }

    set Value(value) {
        const oldValue = this._value;
        this._value = value;
        if (value === null || value == undefined) {
            this._input.value = '';
            this._value = null;
        }
        else {
            var [success, parsedVal] = Utils.TryParseDecimal(this._value?.toString());
            if (success) {
                this._value = parsedVal;
                const dotCount = (this._input.value?.match(/,/g) || []).length;
                const selectionEnd = this._input.selectionEnd;

                var hasDot = false;
                if (this._input.value.split('').filter(x => x === '.').length > 1) {
                    hasDot = true;
                }
                var text = this._value.toFixed(parseInt(this.Meta.Precision ?? 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                this._input.value = text;
                const addedDot = (this._input.value?.match(/,/g) || []).length - dotCount;
                if (hasDot) {
                    var dotIndex = this._input.value.lastIndexOf('.');
                    this._input.selectionStart = dotIndex + 1;
                    this._input.selectionEnd = this._input.selectionStart + 1;
                }
                else {
                    if (this.SetSelection && oldValue != this._value) {
                        this._input.selectionStart = selectionEnd + addedDot;
                        this._input.selectionEnd = selectionEnd + addedDot;
                    }
                }
                if (parsedVal.isNegative()) {
                    this._input.classList.add("negative");
                }
                else {
                    this._input.classList.remove("negative");
                }
            }
            else {
                var [success, parsedVal] = Utils.TryParseDecimal(oldValue?.toString());
                if (!success) {
                    this.parsedVal = new Decimal(0);
                }
                this._value = new Decimal(parsedVal);
                this._input.value = parsedVal.toFixed(parseInt(this.Meta.Precision || 0));
                if (parsedVal.isNegative()) {
                    this._input.classList.add("negative");
                }
                else {
                    this._input.classList.remove("negative");
                }
            }
        }
        this.Entity[this.Name] = this._value;
        Utils.IsFunction(this.Meta.Renderer, false, this);
    }

    SetValue() {
        const oldVal = this._value;
        this.EmptyRow = false;
        if (this._input.value == "-") {
            this.DispatchEvent(this.Meta.Events, EventType.Input, this, this.Entity, this._value, oldVal).then();
            return;
        }
        if (Utils.isNullOrWhiteSpace(this._input.value)) {
            this.Value = null;
            this.DispatchEvent(this.Meta.Events, EventType.Input, this, this.Entity, this._value, oldVal).then();
            return;
        }
        this._input.value = this._input.value.trim();
        if (this._input.value.slice(-1) === this._decimalSeparator) {
            this._input.value = this._input.value.substring(0, this._input.value.length - 1);
        }

        const text = this._input.value.replace(/,/g, "");
        const [success, parsedResult] = Utils.TryParseDecimal(text);
        if (!success) {
            this.Value = this._value;
            this.DispatchEvent(this.Meta.Events, EventType.Input, this, this.Entity, this._value, oldVal).then();
            return;
        }
        this._value = new Decimal(parsedResult);;
        this.Value = this._value;
        this.UserInput?.invoke({ NewData: this._value, OldData: oldVal, EvType: EventType.Input });
        this.DispatchEvent(this.Meta.Events, EventType.Input, this, this.Entity, this._value, oldVal).then();
    }

    Render() {
        this.SetDefaultVal();
        if (this.Entity != null) {
            const fieldVal = this.Entity[this.Name];
            if (fieldVal != null) {
                this._value = this.GetDecimalValue();
            }
        }
        if (!this._input || this._input === null) {
            Html.Take(this.ParentElement).Input.Render();
            const inputElement = Html.Context;
            if (inputElement instanceof HTMLInputElement) {
                this.Element = this._input = inputElement;
            }
        } else {
            this.Element = this._input;
        }
        this._input.type = 'tel';
        this._input.setAttribute('autocorrect', 'off');
        this._input.setAttribute('spellcheck', 'false');
        this._input.addEventListener('input', this.SetValue.bind(this));
        this._input.addEventListener('keydown', this.KeydownHandler.bind(this));
        this._input.addEventListener('change', this.ChangeSetValue.bind(this));
        this._input.autocomplete = 'off';
        this.OldValue = this._value;
        this.Value = this._value;
        window.setTimeout(() => Utils.IsFunction(this.Meta.Renderer), 100);
        this.DOMContentLoaded?.invoke();
    }

    IsNullable() {
        const val = this.Entity.GetComplexProp(this.Name);
        return val === null || val === undefined;
    }

    ChangeSetValue() {
        const oldVal = this._value;
        this.EmptyRow = false;
        if (Utils.isNullOrWhiteSpace(this._input.value)) {
            this.Value = null;
            this.Dirty = true;
            this.UserInput?.Invoke({ NewData: null, OldData: oldVal, EvType: EventType.Change });
            this.PopulateFields();
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then();
            return;
        }
        this._input.value = this._input.value.trim();
        if (this._input.value.slice(-1) === '.') {
            this._input.value = this._input.value.substring(0, this._input.value.length - 1);
        }

        const text = this._input.value.replace(",", "");
        const [success, parsedResult] = Utils.TryParseDecimal(text);
        if (!success) {
            this.Dirty = true;
            this.Value = this._value; // Set old value to avoid accept invalid value
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, parsedResult, oldVal).then();
            return;
        }
        this.Value = new Decimal(parsedResult);
        this.Dirty = true;
        this.UserInput?.Invoke({ NewData: parsedResult, OldData: oldVal, EvType: EventType.Change });
        this.PopulateFields();
        this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity, parsedResult, oldVal).then();
    }

    GetDecimalValue() {
        if (this.Entity == null) {
            return null;
        }
        const value = this.Entity[this.Meta.FieldName];
        if (value == null) {
            return null;
        }
        try {
            return new Decimal(value);
        } catch (e) {
            return null;
        }
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Value = this.GetDecimalValue();
        this.SetRequired();
        if (!this.Dirty) {
            this.OriginalText = this._input;
            this.DOMContentLoaded?.Invoke();
            this.OldValue = this._input;
        }
    }

    async ValidateAsync() {
        if (this.ValidationRules.length == 0) {
            return true;
        }
        this.ValidationResult = [];
        this.ValidateRequired(this._value);
        this.Validate(ValidationRule.GreaterThan, this._value, (value, ruleValue) => ruleValue == null || value != null && value > ruleValue);
        this.Validate(ValidationRule.LessThan, this._value, (value, ruleValue) => ruleValue == null || value != null && value < ruleValue);
        this.Validate(ValidationRule.GreaterThanOrEqual, this._value, (value, ruleValue) => ruleValue == null || value != null && value >= ruleValue);
        this.Validate(ValidationRule.LessThanOrEqual, this._value, (value, ruleValue) => ruleValue == null || value != null && value <= ruleValue);
        this.Validate(ValidationRule.Equal, this._value, (value, ruleValue) => value === ruleValue);
        this.Validate(ValidationRule.NotEqual, this._value, (value, ruleValue) => value !== ruleValue);
        return this.IsValid;
    }

    SetDisableUI(value) {
        this._input.readOnly = value;
    }
}
