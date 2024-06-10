import { Component } from "./models/component.js";
import EditableComponent from "./editableComponent.js";
import EventType from "./models/eventType.js";
import ObservableArgs from "./models/observable.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";

/**
 * Represents a Checkbox component.
 */
export class Checkbox extends EditableComponent {
    /** @type {?boolean} */
    _value = null;

    /** @type {HTMLInputElement} */
    _input = null;

    /**
     * Constructs a Checkbox component.
     * @param {Component} ui - The UI component associated with the checkbox.
     * @param {HTMLElement} [ele=null] - The HTML element to which the checkbox belongs.
     * @throws {Error} If the UI component is not provided.
     */
    constructor(ui, ele = null) {
        super(ui);
        if (!ui) throw new Error("ui is required");
        this.Meta = ui;
        this.ParentElement = ele;
        if (ele && ele.tagName.toLowerCase() === 'input') {
            this.Element = ele;
            // @ts-ignore
            this._input = ele;
        }
        else this.ParentElement = ele;
        this.DefaultValue = false;
    }

    /**
     * Renders the Checkbox into the DOM.
     */
    Render() {
        if (this.ParentElement != null && this.Element == null) {
            Html.Take(this.ParentElement).TabIndex(-1).SmallCheckbox(this._value ?? false);
            // @ts-ignore
            this._input = Html.Context.previousElementSibling;
        }
        this.Element = this._input.parentElement ?? this._input;
        Html.Take(this._input).Event('input', this.UserChange.bind(this));
        this.SetDisableUI(!this.Meta.Editable);
        this.SetDefaultVal();
        this.Value = Utils.GetPropValue(this.Entity, this.Name);
        this.Entity.SetComplexPropValue(this.Name, this._value);
        this.Element.closest('td')?.addEventListener('keydown', this.ListViewItemTab.bind(this));
        this.DOMContentLoaded?.invoke();
    }

    /**
     * Gets the value of the Checkbox as a string.
     * @returns {string} The string representation of the Checkbox's value.
     */
    GetValueText() {
        return this._value === null ? "N/A" : (this._value ? "Check" : "Not check");
    }

    /**
     * Handles user interactions with the Checkbox.
     * @param {Event} e - The event object.
     */
    UserChange(e) {
        if (this.Disabled) {
            e.preventDefault();
            return;
        }
        const check = this._input.checked;
        this.DataChanged(check);
    }

    /**
     * Handles data changes in the Checkbox.
     * @param {boolean} check - The new checked state of the Checkbox.
     */
    DataChanged(check) {
        const oldVal = this._value;
        this._value = check;
        if (this.Entity) {
            this.Entity.SetComplexPropValue(this.Name, check);
        }
        this.Dirty = true;
        // @ts-ignore
        var arg = new ObservableArgs({ NewData: this._value, OldData: oldVal, EvType: EventType.Change });
        /** @type {ObservableArgs} */
        // @ts-ignore
        var arg = { NewData: this._value, OldData: oldVal, EvType: EventType.Change };
        this.UserInput?.invoke(arg);
        this.PopulateFields();
        this.CascadeField();
        this.DispatchEvent(this.Meta.Events, EventType.Change, this.Entity).Done();
    }

    get Value() { return this._value; }
    set Value(val) {
        this._value = val;
            this._input.checked = val;
    }
    /**
     * Updates the view of the Checkbox based on the current state.
     * @param {boolean} [force=false] - Force the update regardless of changes.
     * @param {?boolean} [dirty=null] - The new dirty state.
     * @param {...string} componentNames - Additional component names to update.
     */
    UpdateView(force = false, dirty = null, ...componentNames) {
        const val = this.Entity?.GetComplexProp(this.Name);
        this.Value = val;
        if (!this.Dirty) {
            this.OldValue = this._input.value;
        }
    }

    /**
     * Sets the UI disabled state for the Checkbox.
     * @param {boolean} value - Whether to disable the UI.
     */
    SetDisableUI(value) {
        if (value) {
            this.Element.setAttribute('disabled', 'disabled');
        } else {
            this.Element.removeAttribute('disabled');
        }
        this._input.disabled = value;
    }
}
