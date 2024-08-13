import { ObservableArgs, Component, KeyCodeEnum, EventType } from "./models/";
import { EditableComponent } from "./editableComponent.js";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { ComponentExt } from "./utils/componentExt.js";
import "dayjs/locale/vi.js";
dayjs.locale('vi');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
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
        this.DefaultValue = dayjs.tz(dayjs(), dayjs.tz.guess());
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
        this.someday = dayjs.tz(dayjs(), dayjs.tz.guess());
        this.hour = null;
        this.minute = null;
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
        this.Input.selectionStart = selectionEnd;
        this.Input.selectionEnd = selectionEnd;
        if (this.Meta.Precision == 7) {
            this.Entity[this.Name] = this.value.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        }
        else {
            this.Entity[this.Name] = this.value.format('YYYY-MM-DD');
        }
    }
    /**
     * Sets the value of the datepicker and triggers related updates.
     * @type {HTMLInputElement} value - The new date value.
     */
    Input;
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
        }).Event("focus", () => {
            if (this.simpleNoEvent) {
                this.simpleNoEvent = false;
                return;
            }
            if (!this.Meta.FocusSearch) {
                this.RenderCalendar();
            }
        }).Event("change", () => this.ParseDate())
            .PlaceHolder(this.Meta.PlainText).Attr("autocomplete", "off")
            .Attr('name', this.Name);
        let str = null;
        if (this.Entity[this.Name]) {
            str = dayjs.tz(this.Entity[this.Name], dayjs.tz.guess()).format(this.InitFormat);
            this.value = dayjs.tz(this.Entity[this.Meta.FieldName], dayjs.tz.guess());
        }
        else {
            this.value = null;
        }
        this.Input.value = str;
        this.OriginalText = str;
        this.OldValue = this.Entity[this.Meta.FieldName];
        this.Input.addEventListener("keydown", (e) => this.KeyDownDateTime(e));
        this.Input.parentElement?.addEventListener("focusout", () => this.CloseCalendar());
        Html.End.Div.ClassName("btn-group").Button.TabIndex(-1).Span.ClassName("fal fa-calendar")
            .Event("click", () => {
                if (this.Input.Disabled) return;
                this.show ? this.CloseCalendar() : this.RenderCalendar();
            });
    }


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
     * Closes the calendar UI.
     */
    CloseCalendar() {
        this._closeAwaiter = setTimeout(() => {
            this.show = false;
            if (this.calendar) {
                this.calendar.style.display = "none";
            }
            this.hour = null;
            this.minute = null;
        }, 250);
    }

    /**
     * Renders the calendar UI.
     * @param {Date} someday - The date to use for rendering the calendar.
     */
    RenderCalendar(someday = null) {
        if (this.Disabled) {
            return;
        }
        clearTimeout(this._closeAwaiter);
        this._closeAwaiter = setTimeout(() => {
            this.RenderCalendarTask(someday || this.value || dayjs.tz(dayjs(), dayjs.tz.guess()));
        }, 100);
    }

    _closeAwaiter;
    /**
     * Detailed rendering logic for the calendar, handling navigation and selection of dates.
     * @param {dayjs.Dayjs} someday - The date to render in the calendar.
     */
    RenderCalendarTask(someday) {
        if (this.Disabled) {
            return;
        }

        let _someday = someday || this.value || dayjs.tz(dayjs(), dayjs.tz.guess());
        this.show = true;
        clearTimeout(this._closeAwaiter);

        if (this.calendar) {
            this.calendar.innerHTML = '';
            this.calendar.style.display = '';
        } else {
            Html.Take(document.body).Div.ClassName("datepicker-content open open-up").TabIndex(-1).Trigger("focus");
            this.calendar = Html.Context;
            this.calendar.addEventListener("focusout", (e) => this.CloseCalendar());
        }

        Html.Take(this.calendar).Div.ClassName("calendar-container datepicker")
            .Div.ClassName("v2-calendar relative")
            .Div.ClassName("calendar-header day-select")
            .Div.ClassName("relative flex justify-space align-center")
            .Div.ClassName("icon-calendar-header left-icon fal fa-arrow-left").Event("click", () => {
                _someday = _someday.set('date', 1).subtract(1, 'month');
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("calender-current-date").Span.IText((_someday.month() + 1).toString()).End.End
            .Div.ClassName("icon-calendar-header right-icon fal fa-arrow-right").Event("click", () => {
                _someday = _someday.set('date', 1).add(1, 'month');
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("icon-calendar-header left-icon fal fa-arrow-left").Event("click", () => {
                _someday = _someday.set('date', 1).subtract(1, 'year');
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("calender-current-date").Span.IText(_someday.year().toString()).End.End
            .Div.ClassName("icon-calendar-header right-icon fal fa-arrow-right").Event("click", () => {
                _someday = _someday.set('date', 1).add(1, 'year');
                this.RenderCalendarTask(_someday);
            }).End.End.End
            .Div.ClassName("separate-line-header").End
            .Div.ClassName("calendar-body")
            .Table.ClassName("calendar-table")
            .Thead
            .TRow
            .Th.Text("T2").End
            .Th.Text("T3").End
            .Th.Text("T4").End
            .Th.Text("T5").End
            .Th.Text("T6").End
            .Th.Text("T7").End
            .Th.Text("CN").End
            .End.End
            .TBody.ClassName("date-in-month").Render();

        const now = dayjs.tz(dayjs(), dayjs.tz.guess());
        var firstDayOfMonth = _someday.set('date', 1);
        var lastDayOfMonth = _someday.set('date', 1).add(1, 'month').subtract(1, 'day');
        var firstOutsideDayOfMonth = firstDayOfMonth;
        while (firstOutsideDayOfMonth.day() !== 1) { // Monday
            firstOutsideDayOfMonth = firstOutsideDayOfMonth.subtract(1, 'day');
        }

        var lastOutsideDayOfMonth = lastDayOfMonth;
        while (lastOutsideDayOfMonth.day() !== 0) { // Sunday
            lastOutsideDayOfMonth = lastOutsideDayOfMonth.add(1, 'day');
        }

        if (lastOutsideDayOfMonth.diff(firstOutsideDayOfMonth, 'week') >= 6) {
            lastOutsideDayOfMonth = lastOutsideDayOfMonth.subtract(1, 'week');
        }

        var runner = firstOutsideDayOfMonth;
        const handler = this.SetSelectedDay.bind(this);
        while (runner <= lastOutsideDayOfMonth) {
            for (var day = 0; day < 7; day++) {
                if (runner.day() === 1) { // Monday
                    Html.Instance.TRow.Render();
                }
                if (runner.isBefore(firstDayOfMonth) || runner.isAfter(lastDayOfMonth)) {
                    Html.Instance.TData.ClassName("ms-date").Text("");
                } else {
                    Html.Instance.TData.ClassName("date-in-table ms-date").Text(runner.date().toString())
                        .Event("click", handler, runner);
                }
                if (runner.isSame(now, 'date') && runner.isSame(now, 'month') && runner.isSame(_someday, 'year')) {
                    Html.Instance.ClassName("date-in-table ms-date ms-date-current");
                }
                if (this.value && runner.isSame(this.value, 'date') && runner.isSame(this.value, 'month') && runner.isSame(this.value, 'year')) {
                    Html.Instance.ClassName("date-in-table ms-date ms-date-day-seleted");
                }
                Html.Instance.End.Render();
                if (runner.day() === 0) { // Sunday
                    Html.Instance.End.Render();
                }
                runner = runner.add(1, 'day');
            }
        }

        Html.Instance.End.End.Div.ClassName("SeparateLine").End.End.Render();
        if (this.Meta.Precision === 7) {
            Html.Instance.Div.ClassName("time")
                .Div.ClassName("ms-label mr-12-px ms-label-bold").IText("Time").End
                .Div.ClassName("change-hour")
                .Div.ClassName("ms-number ms-number-container input-time")
                .Span.Div.ClassName("ms-number-group").Div.ClassName("ms-number-input")
                .Input.Value(_someday.hour().toString().padStart(2, '0'))
                .Event("focus", (e) => {
                    clearTimeout(this._closeAwaiter);
                    e.target.select();
                })
                .Event("input", this.ChangeHour.bind(this)).End.End.End.End.End
                .Div.ClassName("ms-label mr-6-px ml-6-px").Text(":").End
                .Div.ClassName("change-minute")
                .Div.ClassName("ms-number ms-number-container input-time")
                .Span.Div.ClassName("ms-number-group").Div.ClassName("ms-number-input")
                .Input.Value(_someday.minute().toString().padStart(2, '0'))
                .Event("focus", (e) => {
                    clearTimeout(this._closeAwaiter);
                    e.target.select();
                })
                .Event("input", this.ChangeMinute.bind(this)).EndOf(".time");
        }
        Html.Instance.Div.ClassName("calendar-footer")
            .Button.Event("click", () => {
                this.TriggerUserChange(now);
            }).ClassName("pick-today-button").IText("Today").End
            .End.End.End.Render();
        ComponentExt.AlterPosition(this.calendar, this.Element);
        const scrollElement = this.Element.closest(".scroll-content");
        if (scrollElement) {
            scrollElement.addEventListener(EventType.Scroll, this.AlterPositionGV.bind(this));
        }
    }

    AlterPositionGV() {
        ComponentExt.AlterPosition(this.calendar, this.Element);
    }

    /**
     * Attempts to parse a datetime string using known formats.
     * @param {string} value - The datetime string to parse.
     * @returns {{parsed: boolean, datetime: Date | null}}
     */
    TryParseDateTime(value) {
        let dateTime = dayjs.tz(dayjs(), dayjs.tz.guess());
        let parsed = false;
        let format = null;
        var length = value.length;
        switch (length) {
            case 4:
                dateTime = dayjs.tz(value, "DDMM", dayjs.tz.guess()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DDMM";
                }
                break;
            case 5:
                dateTime = dayjs.tz(value, "DD/MM", dayjs.tz.guess()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM";
                }
                break;
            case 8:
                dateTime = dayjs.tz(value, "DDMMYYYY", dayjs.tz.guess()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DDMMYYYY";
                }
                break;
            case 10:
                dateTime = dayjs.tz(value, "DD/MM/YYYY", dayjs.tz.guess()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM/YYYY";
                }
                break;
            case 16:
                dateTime = dayjs.tz(value, "DD/MM/YYYY HH:mm", dayjs.tz.guess()); // true for strict parsing
                if (dateTime.isValid()) {
                    parsed = true;
                    format = "DD/MM/YYYY HH:mm";
                }
                break;
            default:
                dateTime = dayjs.tz(value, "DDMM", dayjs.tz.guess()); // true for strict parsing
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
                    if (this.Parent.Parent.Children[groupIndex + 1].Children[0]) {
                        this.Parent.Parent.Children[groupIndex + 1].Children[0].Focus();
                    }
                }
            }
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

    /**
     * Validates the current date value against defined rules.
     * @returns {Promise<boolean>} A promise that resolves to true if the validation passes.
     */
    ValidateAsync() {
        if (!this.ValidationRules || this.ValidationRules.length == 0) {
            return Promise.resolve(true);
        }
        let isValid = true;
        let rules = ['gt', 'lt', 'min', 'max', 'eq', 'ne'];
        rules.forEach(rule => {
            isValid = isValid && this.Validate(rule, this.value);
        });
        return Promise.resolve(isValid);
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
                return value > dayjs.tz(this.Meta.MinDate, dayjs.tz.guess());
            case 'lt':
                return value < dayjs.tz(this.Meta.MaxDate, dayjs.tz.guess());
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
            this.Input.readOnly = value;
        }
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        var data = this.Entity[this.Meta.FieldName];
        if (data) {
            this.Value = dayjs.tz(data, dayjs.tz.guess());
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
