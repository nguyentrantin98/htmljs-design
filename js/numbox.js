import EditableComponent from './editableComponent.js';
import EventType from './models/eventType.js';
import { Utils } from './utils/utils.js';
import { ValidationRule } from './models/validationRule.js';
import { Html } from './utils/html.js';
import Decimal from 'decimal.js';

export class Numbox extends EditableComponent {
    constructor(ui, ele = null) {
        super(ui, ele);
        /** @type {HTMLInputElement} */
        this._input = ele;
        /** @type {Decimal} */
        this._value = null;
        this._isString = false;
        this._decimalSeparator = '.';
        this.SetSelection = true;
        this.DefaultValue = 0;
    }

    /** @type {Decimal} */
    get Value() {
        return this._value;
    }

    set Value(value) {
        const oldValue = this._value;
        this._value = value;
        if (value === null) {
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
                var text = this._value.toFixed(this.Meta.Precision ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                this._input.value = text;
                const addedDot = (this._input.value?.match(/,/g) || []).length - dotCount;
                if (this.SetSelection) {
                    this._input.selectionStart = selectionEnd + addedDot;
                    this._input.selectionEnd = selectionEnd + addedDot;
                }
            }
            else {
                var [success, parsedVal] = Utils.TryParseDecimal(oldValue?.toString());
                if (!success) {
                    this.parsedVal = new Decimal(0);
                }
                this._value = new Decimal(parsedVal);
                this._input.value = parsedVal.toFixed(this.Meta.Precision || 0);
            }
        }
        if (oldValue == null || this._value == null) {
            this.Dirty = oldValue != this._value;
        } else {
            this.Dirty = !this._value?.eq(oldValue);
        }
        this.Entity[this.Name] = this._value;
        this.PopulateFields();
        var customizeFn = Utils.IsFunction(this.Meta.Renderer);
        if (customizeFn) {
            customizeFn.call(this, this);
        }
    }

    SetValue() {
        const oldVal = this._value;
        this.EmptyRow = false;
        if (!this._input.value) {
            this.Value = null;
            return;
        }
        this._input.value = this._input.value.trim();
        if (this._input.value.slice(-1) === this._decimalSeparator) {
            this._input.value = this._input.value.substring(0, this._input.value.length - 1);
        }

        const text = this._input.value.replace(/,/g, "");
        const [success, parsedResult] = Utils.TryParseDecimal(text);
        if (!success) {
            this.Value = this._value; // Set old value to avoid accepting an invalid value
            return;
        }
        this._value = new Decimal(parsedResult);;
        this.Value = this._value;
        this.UserInput?.invoke({ NewData: this._value, OldData: oldVal, EvType: EventType.Input });
        this.DispatchEvent(this.Meta.Events, EventType.Input, this.Entity, this._value, oldVal).done();
    }

    Render() {
        this.SetDefaultVal();
        if (this.Entity != null) {
            const fieldVal = this.Entity[this.Name];
            if (fieldVal != null) {
                this._value = this.GetDecimalValue();
            }
        }
        if (this._input === null) {
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
        this._input.addEventListener('change', this.ChangeSetValue.bind(this));
        this._input.autocomplete = 'off';
        this.Value = this._value; // set again to render in correct format
        let fn = Utils.IsFunction(this.Meta.Renderer);
        if (fn) {
            window.setTimeout(() => fn.call(this, this, this._input), 100);
        }
        this.DOMContentLoaded?.invoke();
    }

    IsNullable() {
        const val = this.Entity.GetComplexProp(this.Name);
        return val === null || val === undefined;
    }

    ChangeSetValue() {
        const oldVal = this._value;
        this.EmptyRow = false;
        if (!this._input.value) {
            this.Value = null;
            this.UserInput?.Invoke({ NewData: null, OldData: oldVal, EvType: EventType.Change });
            return;
        }
        this._input.value = this._input.value.trim();
        if (this._input.value.slice(-1) === '.') {
            this._input.value = this._input.value.substring(0, this._input.value.length - 1);
        }

        const text = this._input.value.replace(",", "");
        const [success, parsedResult] = Utils.TryParseDecimal(text);
        if (!success) {
            this.Value = this._value; // Set old value to avoid accept invalid value
            return;
        }
        this.Value = new Decimal(parsedResult);
        this.Dirty = true;
        this.UserInput?.Invoke({ NewData: parsedResult, OldData: oldVal, EvType: EventType.Change });
        this.PopulateFields();
        this.DispatchEvent(this.Meta.Events, EventType.Change, this.Entity, parsedResult, oldVal).done();
    }

    GetDecimalValue() {
        if (this.Entity == null) {
            return null;
        }

        const value = this.Entity[this.Meta.FieldName];
        if (value == null) {
            return null;
        }

        if (this._isString && value.toString().IsNullOrWhiteSpace()) {
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
        if (!this.Dirty) {
            this.DOMContentLoaded?.invoke();
            this.OldValue = this._input.value;
        }
    }

    async ValidateAsync() {
        if (this.ValidationRules.Nothing()) {
            return true;
        }
        this.ValidationResult.Clear();
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
