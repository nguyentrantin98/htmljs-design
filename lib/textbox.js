import { EditableComponent } from './editableComponent.js';
import { Component, EventType, ValidationRule, KeyCodeEnum } from "./models/";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { LangSelect } from "./utils/langSelect.js";
import { Client } from "./clients/client.js";
import { Str } from './utils/ext.js';
import { SearchMethodEnum } from './models/enum.js';


export class Textbox extends EditableComponent {
    /**
     * @param {Component} ui
     * @param {HTMLElement} ele
     */
    constructor(ui, ele) {
        super(ui, ele);
        this.DefaultValue = "";
        if (ele && ele.tagName == "INPUT") {
            this.Input = ele;
        } else if (ele && ele.tagName == "TEXTAREA") {
            this.TextArea = ele;
        }
        this._value = null;
        this.Password = false;
        this._text = "";
        this._oldText = "";
        this.SearchMethod = SearchMethodEnum.Contain;
        this.SearchIcon = "fas fa-check";
        /**
         * @type {HTMLElement}
         */
        this.SearchIconElement = null;
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
        if (newValue == undefined) {
            newValue = null;
        }
        this._value = newValue;
        if (this._value !== null && typeof this._value === Str.Type) {
            if (this.EditForm && this.EditForm.Meta && !this.EditForm.Meta.IgnoreEncode) {
                this.Entity[this.Name] = this._value;
            }
        }
        if (this.Entity) {
            this.Entity[this.Name] = this._value;
        }
        let text = this._value;
        if (this.Meta.FormatData) {
            text = Utils.FormatEntity(this.Meta.FormatData, this.Entity[this.Name]);
        }

        if (this.Meta.FormatEntity) {
            text = Utils.FormatEntity2(this.Meta.FormatEntity, null, this.Entity, Utils.EmptyFormat, Utils.EmptyFormat);
        }
        this.Text = text;
        this.PopulateFields();
    }

    Render() {
        this.SetDefaultVal();
        var val = this.Entity && this.Entity[this.Name] || null;
        var text = val;
        if (this.Meta.FormatData) {
            text = Utils.FormatEntity(this.Meta.FormatData, val);
        }
        if (this.Meta.FormatEntity) {
            text = Utils.FormatEntity(this.Meta.FormatEntity, this.Entity);
        }
        this._text = text || "";
        this.OldValue = this._text;
        this._value = this._text;
        if (this.ComponentType == "Textarea" || this.TextArea != null) {
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
            this.Input.addEventListener('keydown', this.KeydownHandler.bind(this));
            this.Input.addEventListener("input", (e) => this.PopulateUIChange(EventType.Input));
            this.Input.addEventListener("change", (e) => this.PopulateUIChange(EventType.Change));
        }
        if (this.Password) {
            Html.Instance.Style("text-security: disc;-webkit-text-security: disc;-moz-text-security: disc;");
        }
        if (!this.Meta.ShowLabel) {
            Html.Instance.PlaceHolder(this.Meta.PlainText);
        }
        if (this.Element && this.Element.closest("td")) {
            this.Element.closest("td").addEventListener("keydown", this.ListViewItemTab.bind(this));
        }
        this.Validate(ValidationRule.RegEx, this._text, this.ValidateRegEx);
        this.Validate(ValidationRule.Replace, this._text, this.ValidateReplace);
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
        this._value = this._text;
        this.Entity[this.Name] = this._value;
        this.Dirty = true;
        this.UserInput?.Invoke({ NewData: this._text, OldData: this._oldText, EvType: type });
        this.PopulateFields();
        if (type == EventType.Input) {
            this.Validate(ValidationRule.Replace, this._text, this.ValidateReplace);
        }
        if (type == EventType.Change) {
            this.Validate(ValidationRule.RegEx, this._text, this.ValidateRegEx);
        }
        this.DispatchEvent(this.Meta.Events, type, this, this.Entity).then();
    }
    UpdateView(force = false, dirty = null, ...componentNames) {
        var newValue = this.Entity[this.Meta.FieldName];
        if (newValue != this._value) {
            this.Value = newValue;
            this.SetRequired();
            if (!this.Dirty) {
                this.OriginalText = this._text;
                this.DOMContentLoaded?.Invoke();
                this.OldValue = this._text;
            }
        }
    }

    ValidateAsync() {
        if (this.ValidationRules.length == 0) {
            return Promise.resolve(true);
        }
        const tcs = new Promise((resolve, reject) => {
            this.ValidationResult = [];
            this.Validate(ValidationRule.MinLength, this._text, (value, minLength) => this._text != null && this._text.length >= minLength);
            this.Validate(ValidationRule.CheckLength, this._text, (text, checkLength) => this._text == null || this._text == "" || this._text.length == checkLength);
            this.Validate(ValidationRule.MaxLength, this._text, (text, maxLength) => this._text == null || this._text.length <= maxLength);
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
        if (!this.ValidationRules.hasOwnProperty(ValidationRule.RegEx)) {
            return Promise.resolve(true);
        }
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
            var rs1 = regEx.test(this._oldText);
            if (rs1) {
                this.Element.classList.add("reg-text");
            }
            return rs1;
        }
        if (!res) {
            this.Element.classList.add("reg-text");
        }
        else {
            this.Element.classList.remove("reg-text");
        }
        return res;
    }

    /**
     * @param {string} value
     * @param {string } regText
     * @param {string} format
     */
    ValidateReplace(value, regText, format) {
        if (!this.ValidationRules.hasOwnProperty(ValidationRule.Replace)) {
            return Promise.resolve(true);
        }
        if (value === null) {
            return true;
        }
        let input = value;
        input = input.replace(/[^a-zA-Z0-9]/g, '');
        let formattedInput = '';
        let formatIndex = 0;
        let inputIndex = 0;
        while (formatIndex < format.length && inputIndex < input.length) {
            if (format[formatIndex] === '#') {
                formattedInput += input[inputIndex];
                inputIndex++;
            } else {
                formattedInput += format[formatIndex];
            }
            formatIndex++;
        }
        const isValid = formattedInput.length == format.length;
        this.Element.value = formattedInput;
        this._value = formattedInput;
        this.Entity[this.Name] = formattedInput;
        if (isValid) {
            this.Element.classList.remove("reg-text");
        } else {
            this.Element.classList.add("reg-text");
        }
        return isValid;
    }

    ValidateUnique() {
        if (!this.ValidationRules.hasOwnProperty(ValidationRule.Unique)) {
            return Promise.resolve(true);
        }
        var rule = this.ValidationRules[ValidationRule.Unique];

        if (rule === null || this._text.trim() === "") {
            return Promise.resolve(true);
        }
        const params = Utils.IsFunction(this.Meta.PreQuery, false, this);
        var table = !this.Meta.RefName ? this.Meta.RefName : this.EditForm.Meta.EntityName;
        const submit = {
            ComId: this.Meta.Id,
            Params: params,
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
