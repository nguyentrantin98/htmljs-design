import { EditableComponent } from './editableComponent.js';
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { ValidationRule } from "./models/validationRule.js";
import { LangSelect } from "./utils/langSelect.js";
import { Client } from "./clients/client.js";
import EventType from './models/eventType.js';
import { Str } from './utils/ext.js';
import { Component } from './models/component.js';


export class Textbox extends EditableComponent {
    /**
     * @param {Component} ui
     * @param {HTMLElement} ele
     */
    constructor(ui, ele) {
        super(ui, ele);
        this.DefaultValue = "";
        if (ele.tagName == "INPUT") {
            this.Input = ele;
        } else if (ele.tagName == "TEXTAREA") {
            this.TextArea = ele;
        }
        this._value = null;
        this.MultipleLine = false;
        this.Password = false;
        this._text = "";
        this._oldText = "";
    }
    /** @type {String} */
    get Text() {
        return this._text;
    }

    set Text(value) {
        this._text = value;
        if (this.Input != null) {
            this.Input.value = this._text;
        }

        if (this.TextArea != null) {
            this.TextArea.value = this._text;
        }
    }

    get Value() { return this._value; }

    set Value(newValue) {
        this._value = newValue;
        if (this._value !== null && typeof this._value === Str.Type) {
            if (this.EditForm && this.EditForm.Meta && !this.EditForm.Meta.IgnoreEncode) {
                this.Entity.SetComplexPropValue(this.Name, Utils.EncodeSpecialChar(Utils.DecodeSpecialChar(this._value)));
            }
        }
        if (this.Entity) {
            this.Entity.SetComplexPropValue(this.Name, this._value);
        }

        let text = (this.EditForm && this.EditForm.Meta && this.EditForm.Meta.IgnoreEncode) ? this._value : Utils.DecodeSpecialChar(this._value);
        if (this.Meta.FormatData) {
            text = Utils.FormatEntity(this.Meta.FormatData, this.Entity.GetPropValue(this.Name));
        }

        if (this.Meta.FormatEntity) {
            text = Utils.FormatEntity2(this.Meta.FormatEntity, null, this.Entity, Utils.EmptyFormat, Utils.EmptyFormat);
        }
        Utils.IsFunction(this.Meta.Renderer)?.call(this, this);
        this.Text = text;
        this.PopulateFields();
    }

    Render() {
        this.SetDefaultVal();
        var val = this.Entity && this.Entity[this.Name] || null;
        var shouldEncode = val !== null && val !== undefined && typeof val === Str.Type && this.EditForm != null
            && this.EditForm.Meta != null && !this.EditForm.Meta.IgnoreEncode;
        if (shouldEncode) {
            const decode = Utils.DecodeSpecialChar(val);
            const encode = Utils.EncodeSpecialChar(decode);
            this.Entity[this.Name] = encode;
        }
        var text = val;
        if (this.Meta.FormatData) {
            text = Utils.FormatEntity(this.Meta.FormatData, val);
        }
        if (this.Meta.FormatEntity) {
            text = Utils.FormatEntity(this.Meta.FormatEntity, this.Entity);
        }
        this._text = this.EditForm != null && this.EditForm.Meta != null && this.EditForm.Meta.IgnoreEncode ? text : Utils.DecodeSpecialChar(text) ?? '';
        this.OldValue = this._text;
        if (this.MultipleLine || this.TextArea != null) {
            if (this.TextArea == null) {
                Html.Take(this.ParentElement).TextArea.Value(this._text).PlaceHolder(this.Meta.PlainText);
                // @ts-ignore
                this.Element = this.TextArea = Html.Context;
            } else if (this.TextArea) {
                Html.Take(this.Element);
                this.Element = this.TextArea;
                this.TextArea.value = this._text;
            }
            if (this.Meta.Row > 0) {
                Html.Instance.Attr("rows", this.Meta.Row ?? 1);
            }
            this.TextArea.addEventListener("input", (e) => this.PopulateUIChange(EventType.Input));
            this.TextArea.addEventListener("change", (e) => this.PopulateUIChange(EventType.Change));
        }
        else {
            if (this.Input == null) {
                Html.Take(this.ParentElement).Input.Value(this._text)?.PlaceHolder(this.Meta.PlainText);
                // @ts-ignore
                this.Element = this.Input = Html.Context;
            } else {
                Html.Take(this.Element);
                this.Element = this.Input;
                this.Input.value = this._text;
            }
            this.Input.addEventListener("input", (e) => this.PopulateUIChange(EventType.Input));
            this.Input.addEventListener("change", (e) => this.PopulateUIChange(EventType.Change));
        }
        Utils.IsFunction(this.Meta.Renderer)?.call(this, this);
        if (this.Password) {
            Html.Instance.Style("text-security: disc;-webkit-text-security: disc;-moz-text-security: disc;");
        }
        if (!this.Meta.ShowLabel) {
            Html.Instance.PlaceHolder(this.Meta.PlainText);
        }
        if (this.Element && this.Element.closest("td")) {
            this.Element.closest("td").addEventListener("keydown", this.ListViewItemTab.bind(this));
        }
        this.DOMContentLoaded?.Invoke();
    }

    PopulateUIChange(type, shouldTrim = false) {
        if (this.Disabled) {
            return;
        }
        this._oldText = this._text;
        this._text = this.Input ? this.Input.value : this.TextArea.value;
        this._text = this.Password ? this._text : (shouldTrim ? this._text?.trim() : this._text);
        if (this.Meta.UpperCase && this._text != null) {
            this.Text = this._text.toLocaleUpperCase();
        }
        this._value = (this.EditForm != null && this.EditForm.Meta != null && this.EditForm.Meta.IgnoreEncode) ? this._text : Utils.EncodeSpecialChar(this._text);
        this.Entity.SetComplexPropValue(this.Name, this._value);
        this.Dirty = true;
        this.UserInput?.Invoke({ NewData: this._text, OldData: this._oldText, EvType: type });
        this.PopulateFields();
        this.DispatchEvent(this.Meta.Events, type, this.Entity);

    }
    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Value = this.Entity && Utils.GetPropValue(this.Entity, this.Name);
        if (!this.Dirty) {
            this.DOMContentLoaded?.Invoke();
            this.OldValue = this._text;
        }
    }

    ValidateAsync() {
        if (this.ValidationRules.Nothing()) {
            return Promise.resolve(true);
        }
        const tcs = new Promise((resolve, reject) => {
            this.ValidationResult.Clear();
            this.Validate(ValidationRule.MinLength, this._text, (value, minLength) => this._text != null && this._text.length >= minLength);
            this.Validate(ValidationRule.CheckLength, this._text, (text, checkLength) => this._text == null || this._text == "" || this._text.length == checkLength);
            this.Validate(ValidationRule.MaxLength, this._text, (text, maxLength) => this._text == null || this._text.length <= maxLength);
            this.Validate(ValidationRule.RegEx, this._text, this.ValidateRegEx);
            this.ValidateRequired(this.Text);
            this.ValidateUnique().then(() => {
                resolve(this.IsValid);
            });
        });

        return tcs;
    }

    /**
     * @param {string} value
     * @param {string | RegExp} regText
     */
    ValidateRegEx(value, regText) {
        if (value === null) {
            return true;
        }
        var regEx = new RegExp(regText);
        var res = regEx.test(value);
        var rule = this.ValidationRules[ValidationRule.RegEx];
        if (rule && !res && rule.RejectInvalid) {
            var end = this.Input.selectionEnd;
            this.Text = this._oldText;
            this._value = this._oldText;
            this.Input.selectionStart = end;
            this.Input.selectionEnd = end;
            return regEx.test(this._oldText);
        }
        return res;
    }

    ValidateUnique() {
        if (!this.ValidationRules.hasOwnProperty(ValidationRule.Unique)) {
            return Promise.resolve(true);
        }
        var rule = this.ValidationRules[ValidationRule.Unique];

        if (rule === null || this._text.trim() === "") {
            return Promise.resolve(true);
        }
        const fn = Utils.IsFunction(this.Meta.PreQuery);
        var table = !this.Meta.RefName ? this.Meta.RefName : this.EditForm.Meta.EntityName;
        const submit = {
            ComId: this.Meta.Id,
            Params: fn ? JSON.stringify(fn.call(null, this)) : null,
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
        };
        var tcs = new Promise((resolve, reject) => {
            Client.Instance.ComQuery(submit)
                .then(ds => {
                    var exists = ds.length > 0 && ds[0].length > 0;
                    return exists;
                })
                .then(exists => {
                    if (exists) {
                        this.ValidationResult[ValidationRule.Unique] = `${rule.Message} ${LangSelect.Get(this.Meta.Label)} ${this._text}`;
                    } else {
                        delete this.ValidationResult[ValidationRule.Unique];
                    }
                    resolve(true);
                })
                .catch(error => {
                    console.error('Query error:', error);
                    reject(error);
                });
        });

        return tcs;
    }

    SetDisableUI(value) {
        if (this.Input != null) {
            this.Input.readOnly = value;
        }

        if (this.TextArea != null) {
            this.TextArea.readOnly = value;
        }
    }
}
