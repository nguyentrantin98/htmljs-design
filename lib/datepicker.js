import { ObservableArgs, Component, KeyCodeEnum, EventType } from "./models/";
import { EditableComponent } from "./editableComponent.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { ComponentExt } from "./utils/componentExt.js";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { SearchMethodEnum } from "./models/enum.js";
import "flatpickr/dist/flatpickr.min.css";
import flatpickr from "flatpickr";
import { Vietnamese } from "flatpickr/dist/l10n/vn.js"
import { LangSelect } from "./index.js";
// Extend dayjs with the necessary plugins
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
export class Datepicker extends EditableComponent {
    /** @type {HTMLElement} */
    calendar = null;
    renderAwaiter = null;
    closeAwaiter = null;
    /** @type {dayjs.Dayjs} */
    value;
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.DefaultValue = dayjs();
        /** @type {Component} */
        this.Meta = ui;
        this.InitFormat = this.Meta.FormatData?.includes("{0:") ? this.Meta.FormatData.replace("{0:", "").replace("}", "") : (this.Meta.Precision === 7 ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY");
        this.currentFormat = this.InitFormat;
        if (ele != null) {
            if (ele.firstElementChild instanceof HTMLInputElement) {
                this.Input = ele.firstElementChild;
            } else {
                this.Input = Html.Take(ele).Input.Context;
            }
        }
        this.value = null;
        this.nullable = false;
        this.simpleNoEvent = false;
        this.show = false;
        this.someday = dayjs();
        this.hour = null;
        this.minute = null;
        this.SearchMethod = SearchMethodEnum.Equal;
        this.SearchIcon = "fas fa-equals";
        this.SearchIconElement = null;
    }

    /**
     * Gets the value of the datepicker.
     * @returns {dayjs.Dayjs | null}
     */
    get Value() {
        return this.value;
    }

    /**
     * Sets the value of the datepicker and triggers related updates.
     * @param {dayjs.Dayjs | null} value - The new date value.
     */
    set Value(value) {
        if (this.value === value) {
            return;
        }
        if (!value) {
            this.Input.value = "";
            this.Entity[this.Name] = null;
            this.flatpickr.setDate(null);
            return;
        }
        this.value = value;
        const selectionEnd = this.Input.selectionEnd;
        var data = Utils.IsFunction(this.Meta.FormatEntity, false, this);
        if (data) {
            this.Input.value = data;
        }
        else {
            this.Input.value = this.value.format(this.InitFormat)
        }
        this.flatpickr.setDate(this.Input.value);
        this.Input.selectionStart = selectionEnd;
        this.Input.selectionEnd = selectionEnd;
        if (this.Meta.Precision == 7) {
            this.Entity[this.Name] = this.value.format('YYYY-MM-DDTHH:mm:ss');
        }
        else {
            this.Entity[this.Name] = this.dayjs(this.value.format('YYYY-MM-DD'), 'YYYY-MM-DD').format('YYYY-MM-DDTHH:mm:ss');
        }
    }
    /**
     * Sets the value of the datepicker and triggers related updates.
     * @type {HTMLInputElement} value - The new date value.
     */
    Input;
    /**@type {flatpickr} */
    flatpickr
    /**
     * Renders the datepicker component in the DOM.
     */
    Render() {
        this.SetDefaultVal();
        Html.Take(this.ParentElement);
        if (!this.Input) {
            Html.Div.ClassName("datetime-picker").TabIndex(-1);
            Html.Input.Render();
            this.Element = Html.Context;
            this.Input = this.Element;
        } else {
            Html.Take(this.Input);
            this.Element = this.Input;
        }
        Html.Event("keydown", (e) => {
            if (this.Disabled || !e) return;
            if (e.keyCode === 13) {
                this.ParseDate();
            }
        }).Event("change", () => this.ParseDate())
            .PlaceHolder(this.Meta.PlainText).Attr("autocomplete", "off")
            .Attr('name', this.Name);
        if (!this.Meta.ShowHotKey) {
            Html.End.Div.ClassName("btn-group").Button.TabIndex(-1).Span.ClassName("fal fa-calendar")
                .Event("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.Input.disabled) return;
                    if (this.flatpickr.isOpen) {
                        this.flatpickr.close();
                    } else {
                        this.flatpickr.open();
                    }
                });
        }
        const scrollElement = this.Element.closest(".scroll-content");
        var mode = "single";
        if (this.Meta && this.Meta.Precision === 2) {
            mode = "range";
        }
        if (this.Meta && this.Meta.IsMultiple) {
            mode = "multiple";
        }
        var seft = this;
        this.flatpickr = flatpickr(this.Input, {
            enableTime: this.Meta.Precision === 7,
            allowInput: true,
            weekNumbers: true,
            locale: LangSelect.Culture == "vi" ? Vietnamese : null,
            dateFormat: (this.Meta.Precision === 7 ? "d/m/Y H:i" : "d/m/Y"),
            clickOpens: !this.Meta.FocusSearch,
            mode: mode,
            time_24hr: this.Meta.Precision === 7 ? true : false,
            onOpen: () => {
                if (scrollElement) {
                    scrollElement.addEventListener(EventType.Scroll, this.RepositionFlatpickr.bind(this), true);
                }
            },
            onChange: function (selectedDates, dateStr, instance) {
                if (seft.Meta.Precision == 2) {
                    if (selectedDates[0]) {
                        seft.Entity[seft.Meta.FieldName] = selectedDates[0];
                    }
                    else {
                        seft.Entity[seft.Meta.FieldName] = null;
                    }
                    if (selectedDates[1]) {
                        seft.Entity[seft.Meta.FieldName + "To"] = selectedDates[1];
                    }
                    else {
                        seft.Entity[seft.Meta.FieldName + "To"] = null;
                    }
                }
            },
            onClose: () => {
                if (scrollElement) {
                    scrollElement.removeEventListener(EventType.Scroll, this.RepositionFlatpickr.bind(this), true);
                }
            }
        });
        let str = null;
        if (this.Entity[this.Name]) {
            str = dayjs(this.Entity[this.Name]).format(this.InitFormat);
            this.value = dayjs(this.Entity[this.Meta.FieldName]);
            this.flatpickr.setDate(str);
        }
        else {
            this.value = null;
            this.flatpickr.setDate(null);
        }
        this.Input.value = str;
        this.OriginalText = str;
        this.OldValue = this.Entity[this.Meta.FieldName];
        if (this.Meta.Precision !== 7 && this.value) {
            this.Entity[this.Name] = this.dayjs(this.value.format('YYYY-MM-DD'), 'YYYY-MM-DD').format('YYYY-MM-DDTHH:mm:ss');
        }
    }

    RepositionFlatpickr() {
        if (this.flatpickr && this.flatpickr.isOpen) {
            this.flatpickr._positionCalendar();
        }
    };

    /**
     * Handles key down events specifically for managing date and time inputs.
     * @param {Event} e - The event object.
     */
    KeyDownDateTime(e) {
        if (e.KeyCodeEnum() === KeyCodeEnum.Enter && this.value === null) {
            if (this.Disabled) {
                return;
            }
            if (this.show) {
                this.CloseCalendar();
            } else {
                this.RenderCalendar();
            }
        }
    }

    /**
     * Determines if a given type is nullable.
     * @param {string} type - The type to check.
     * @returns {boolean} Whether the type is nullable.
     */
    IsNullable(type) {
        return this.Entity === null || Utils.IsNullable(this.Name, this.Entity);
    }

    /**
     * Parses the date from the input and sets the component's value.
     */
    ParseDate() {
        if (this.Meta.Precision == 2) {
            return;
        }
        if (Utils.isNullOrWhiteSpace(this.Input.value)) {
            this.Input.value = "";
            this.TriggerUserChange(null);
            return;
        }
        const { parsed, dateTime, format } = this.TryParseDateTime(this.Input.value);
        if (!parsed) {
            if (this.EditForm.Meta.CustomNextCell) {
                return;
            }
            this.Input.value = "";
            this.TriggerUserChange(null);
        } else {
            this.Value = dateTime;
            this.TriggerUserChange(dateTime);
        }
    }

    /**
 * Attempts to parse a datetime string using known formats.
 * @param {string} value - The datetime string to parse.
 * @returns {{parsed: boolean, datetime: Date | null}}
 */
    TryParseDateTime(value) {
        let dateTime = dayjs();
        let parsed = false;
        let format = null;
        var length = value.length;
        switch (length) {
            case 4:
                dateTime = dayjs(value, "DDMM", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DDMM";
                }
                break;
            case 5:
                dateTime = dayjs(value, "DD/MM", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM";
                }
                break;
            case 8:
                dateTime = dayjs(value, "DDMMYYYY", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DDMMYYYY";
                }
                break;
            case 10:
                dateTime = dayjs(value, "DD/MM/YYYY", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM/YYYY";
                }
                break;
            case 16:
                dateTime = dayjs(value, "DD/MM/YYYY HH:mm", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM/YYYY HH:mm";
                }
                break;
            default:
                dateTime = dayjs(value, "DDMM", dayjs()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DDMM";
                    break;
                }
                break;
        }
        return { parsed, dateTime, format };
    }

    /**
     * Triggers user-defined change actions and updates the UI.
     * @param {dayjs.Dayjs | null} selected - The selected date.
     */
    TriggerUserChange(selected, input = false) {
        if (this.Disabled) {
            return;
        }
        let oldVal = this.value;
        if (this.hour) {
            this.Value = selected.hour(this.hour);
        }
        if (this.minute) {
            this.Value = selected.minute(this.minute);
        }
        if (!this.hour && !this.minute) {
            this.Value = selected;
        }
        this.Dirty = true;
        /** @type {ObservableArgs} */
        // @ts-ignore
        if (!input) {
            var arg = { NewData: this.value, OldData: oldVal, EvType: "change" };
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then(() => {
                this.UserInput?.invoke(arg);
                this.PopulateFields();
                this.CascadeField();
                this.simpleNoEvent = true;
                if (this.Parent.IsListViewItem) {
                    if (this.Meta.Precision != 7) {
                        this.Input.focus();
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
            });
        }
    }
    /**
     * Triggers user-defined change actions and updates the UI.
     * @param {dayjs.Dayjs | null} selected - The selected date.
     */
    TriggerRangeChange(selecteds, input = false) {
        if (this.Disabled) {
            return;
        }
        this.Dirty = true;
        /** @type {ObservableArgs} */
        // @ts-ignore
        if (!input) {
            var arg = { NewData: this.value, OldData: oldVal, EvType: "change" };
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then(() => {
                this.UserInput?.invoke(arg);
                this.PopulateFields();
                this.CascadeField();
                this.simpleNoEvent = true;
                if (this.Parent.IsListViewItem) {
                    this.Input.focus();
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
            });
        }

    }

    /**
     * Sets the day selected by the user and updates the internal state.
     * @param {dayjs.Dayjs} selected - The day selected by the user.
     */
    SetSelectedDay(evt, selected) {
        this.CloseCalendar();
        this.TriggerUserChange(selected);
    }

    /**
     * Increases the time by a specified amount for hours or minutes.
     * @param {number} value - The amount to increase the time by.
     * @param {boolean} minute - Whether to increase minutes instead of hours.
     */
    IncreaseTime(value, minute = false) {
        let time = this.value || this.someday;
        if (!minute) {
            time.setHours(time.get('hour') + value);
            this.hour = time.get('hour').toString().padStart(2, '0');
        } else {
            time.setMinutes(time.get('minute') + value);
            this.minute = time.get('minute').toString().padStart(2, '0');
        }
        this.TriggerUserChange(time);
    }

    /**
     * Changes the hour based on user input from the hour input field.
     * @param {Event} e - The event object, containing the user input.
     */
    ChangeHour(e) {
        let newHour = parseInt(e.target.value || "0");
        if (newHour < 0 || newHour > 23) {
            return;
        }
        let time = (this.value || this.someday);
        this.hour = newHour;
        var newDate = time.hour(newHour);
        this.TriggerUserChange(newDate, true);
    }

    /**
     * Changes the minute based on user input from the minute input field.
     * @param {Event} e - The event object, containing the user input.
     */
    ChangeMinute(e) {
        let newMinute = parseInt(e.target.value || "0");
        if (newMinute < 0 || newMinute > 59) {
            return;
        }
        let time = (this.value || this.someday);
        this.minute = newMinute;
        var newDate = time.minute(newMinute);
        this.TriggerUserChange(newDate, true);
    }

    /**
     * Handles keyboard shortcuts for changing hours and minutes.
     * @param {Event} e - The event object.
     */
    ChangeHourMinuteHotKey(e) {
        if (e.KeyCode() === KeyCodeEnum.UpArrow) { // Arrow Up
            this.IncreaseTime(1, e.target === this.minute);
        } else if (e.KeyCode() === KeyCodeEnum.DownArrow) { // Arrow Down
            this.IncreaseTime(-1, e.target === this.minute);
        }
    }

    ValidateAsync() {
        if (this.ValidationRules.length == 0) {
            return Promise.resolve(true);
        }
        const tcs = new Promise((resolve, reject) => {
            resolve(this.ValidateRequired(this.value));
        });
        return tcs;
    }

    /**
     * Generic validation method to apply different types of validation rules.
     * @param {string} rule - The rule to apply.
     * @param {Date} value - The value to validate.
     * @returns {boolean} Whether the value passes the validation.
     */
    Validate(rule, value) {
        // Example: Extend to include specific rule validation
        switch (rule) {
            case 'gt':
                return value > dayjs(this.Meta.MinDate);
            case 'lt':
                return value < dayjs(this.Meta.MaxDate);
            default:
                return true;
        }
    }

    /**
     * Removes the datepicker and its elements from the DOM.
     */
    RemoveDOM() {
        if (!this.Element?.parentElement) return;
        this.Element.parentElement.innerHTML = Str.Empty;
        this.Element = null;
    }

    /**
     * Sets the UI of the datepicker to either enabled or disabled based on the given value.
     * @param {boolean} value - Whether the datepicker should be disabled.
     */
    SetDisableUI(value) {
        if (this.Input) {
            this.Input.disabled = value;
        }
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        var newValue = this.Entity[this.Meta.FieldName];
        if (newValue != this.OldValue) {
            if (newValue) {
                try {
                    this.Value = dayjs(newValue, 'YYYY-MM-DDTHH:mm:ss');
                } catch {
                    this.Value = null;
                }
            }
            else {
                this.Value = null;
            }
            if (!this.Dirty) {
                this.OriginalText = this.Input.value;
                this.DOMContentLoaded?.Invoke();
                this.OldValue = this.Input.value;
            }
        }
    }

    SetDefaultVal() {
        if (Utils.isNullOrWhiteSpace(this.Meta.DefaultVal)) {
            return;
        }
        var data = Utils.IsFunction(this.Meta.DefaultVal, true, this);
        if (!data) {
            data = this.Meta.DefaultVal;
        }
        if (data && this.Entity[this.Name] == null && this.Entity[this.IdField].toString().startsWith("-")) {
            if (dayjs.isDayjs(this.Entity[this.Name])) {
                if (this.Meta.Precision == 7) {
                    this.Entity[this.Name] = this.value.format('YYYY-MM-DDTHH:mm:ss');
                }
                else {
                    this.Entity[this.Name] = this.dayjs(this.value.format('YYYY-MM-DD'), 'YYYY-MM-DD').format('YYYY-MM-DDTHH:mm:ss');
                }
            }
            else {
                this.Entity[this.Name] = data;
            }
        }
    }
}
