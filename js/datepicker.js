import { Component } from "./models/component.js";
import EditableComponent from "./editableComponent.js";
import ObservableArgs from "./models/observable.js";
import dayjs from "dayjs";
import "dayjs/locale/vi.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { KeyCodeEnum } from "./models/enum.js";
import { ComponentExt } from "./utils/componentExt.js";

dayjs.locale('vi')
export class Datepicker extends EditableComponent {
    HHmmFormat = "00";
    formats = [
        "DD/MM/YYYY - HH:mm", "DD/MM/YYYY - HH:m", "DD/MM/YYYY - H:mm",
        "DD/MM/YYYY - HH:", "DD/MM/YYYY - H:", "DD/MM/YYYY - H:m", "DD/MM/YYYY - HH", "DD/MM/YYYY - H", "DD/MM/YYYY", "DDMMYYYY", "D/M/YYYY", "DMYYYY", "DD/MM/YY", "DDMMYY", "D/M", "DM", "DD/MM", "DDMM"
    ];
    calendar = null;
    renderAwaiter = null;
    closeAwaiter = null;
    /** @type {Date} */
    value;

    constructor(ui, ele = null) {
        super(ui);
        this.DefaultValue = dayjs();
        /** @type {Component} */
        this.Meta = ui;
        this.InitFormat = this.Meta.FormatData?.includes("{0:") ? this.Meta.FormatData.replace("{0:", "").replace("}", "") : (this.Meta.Precision === 7 ? "dd/MM/yyyy - HH:mm" : "DD/DD/YYYY");
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
        this.someday = new Date();
        this.hour = null;
        this.minute = null;
    }

    /**
     * Gets the value of the datepicker.
     * @returns {Date | null}
     */
    get Value() {
        return this.value;
    }

    /**
     * Sets the value of the datepicker and triggers related updates.
     * @param {Date | null} value - The new date value.
     */
    set Value(value) {
        if (this.value === value) {
            return;
        }
        this.value = value;
        if (this.value) {
            const selectionEnd = this.Input.selectionEnd;
            var isFn = Utils.IsFunction(this.Meta.FormatEntity);
            if (isFn) this.Input.value = isFn.call(this, value, this);
            else {
                this.Input.value = dayjs(this.value).format(this.InitFormat)
            }
            this.Input.selectionStart = selectionEnd;
            this.Input.selectionEnd = selectionEnd;
        } else if (!this.nullable) {
            this.value = new Date();
            this.Input.value = dayjs(this.value).format(this.InitFormat);
        } else {
            this.Input.value = null;
        }
        this.Entity[this.Name] = this.value;
        this.Dirty = true;
    }

    /**
     * Renders the datepicker component in the DOM.
     */
    Render() {
        this.SetDefaultVal();
        this.Entity[this.Name] = this.value;
        let str = "";
        if (this.Entity[this.Name] !== null) {
            str = dayjs(this.Entity[this.Name]).format(this.InitFormat);
        }
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
            if (e.keyCode === 13) this.ParseDate();
        }).Value(str).Event("focus", () => {
            if (this.simpleNoEvent) {
                this.simpleNoEvent = false;
                return;
            }
            if (!this.Meta.FocusSearch) {
                this.RenderCalendar();
            }
        }).Event("change", () => this.ParseDate())
            .PlaceHolder(this.Meta.PlainText).Attr("autocomplete", "off")
            .Attr('name', this.Name)
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
        const { parsed, datetime, format } = this.TryParseDateTime(this.Input.value);
        if (!parsed) {
            if (this.EditForm.Meta.CustomNextCell) {
                return;
            }
            this.Input.value = "";
            this.TriggerUserChange(null);
        } else {
            this.Value = datetime;
            this.TriggerUserChange(datetime);
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
            this.Input.value = this.value ? dayjs(this.value).format(this.InitFormat) : "";
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
            this.RenderCalendarTask(someday || this.value || new Date());
        }, 100);
    }

    _closeAwaiter;
    /**
     * Detailed rendering logic for the calendar, handling navigation and selection of dates.
     * @param {Date} someday - The date to render in the calendar.
     */
    RenderCalendarTask(someday) {
        if (this.Disabled) {
            return;
        }

        let _someday = someday || this.value || new Date();
        this.show = true;
        clearTimeout(this._closeAwaiter);
        if (this.calendar) {
            this.calendar.innerHTML = '';
            this.calendar.style.display = '';
        } else {
            Html.Take(document.body).Div.ClassName("datepicker-content open open-up").TabIndex(-1).Trigger("focus");
            this.calendar = Html.Context;
        }

        Html.Take(this.calendar).Div.ClassName("calendar-container datepicker")
            .Div.ClassName("v2-calendar relative")
            .Div.ClassName("calendar-header day-select")
            .Div.ClassName("relative flex justify-space align-center")
            .Div.ClassName("icon-calendar-header left-icon fal fa-arrow-left").Event("click", () => {
                _someday.setDate(1);
                _someday.setMonth(_someday.getMonth() - 1);
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("calender-current-date").Span.IText(_someday.getMonth() + 1).End.End
            .Div.ClassName("icon-calendar-header right-icon fal fa-arrow-right").Event("click", () => {
                _someday.setDate(1);
                _someday.setMonth(_someday.getMonth() + 1);
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("icon-calendar-header left-icon fal fa-arrow-left").Event("click", () => {
                _someday.setDate(1);
                _someday.setFullYear(_someday.getFullYear() - 1);
                this.RenderCalendarTask(_someday);
            }).End
            .Div.ClassName("calender-current-date").Span.IText(_someday.getFullYear()).End.End
            .Div.ClassName("icon-calendar-header right-icon fal fa-arrow-right").Event("click", () => {
                _someday.setDate(1);
                _someday.setFullYear(_someday.getFullYear() + 1);
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

        const now = new Date();
        const firstDayOfMonth = new Date(_someday.getFullYear(), _someday.getMonth(), 1);
        const lastDayOfMonth = new Date(_someday.getFullYear(), _someday.getMonth() + 1, 0);

        var firstOutsideDayOfMonth = new Date(firstDayOfMonth);
        while (firstOutsideDayOfMonth.getDay() !== 1) { // Monday
            firstOutsideDayOfMonth.setDate(firstOutsideDayOfMonth.getDate() - 1);
        }

        var lastOutsideDayOfMonth = new Date(lastDayOfMonth);
        while (lastOutsideDayOfMonth.getDay() !== 0) { // Sunday
            lastOutsideDayOfMonth.setDate(lastOutsideDayOfMonth.getDate() + 1);
        }

        if ((lastOutsideDayOfMonth - firstOutsideDayOfMonth) / (1000 * 60 * 60 * 24 * 7) >= 6) {
            lastOutsideDayOfMonth.setDate(lastOutsideDayOfMonth.getDate() - 7);
        }

        var runner = new Date(firstOutsideDayOfMonth);
        const handler = this.SetSelectedDay.bind(this);
        while (runner <= lastOutsideDayOfMonth) {
            for (var day = 0; day < 7; day++) {
                if (runner.getDay() === 1) { // Monday
                    Html.Instance.TRow.Render();
                }
                if (runner < firstDayOfMonth || runner > lastDayOfMonth) {
                    Html.Instance.TData.ClassName("ms-date").Text("");
                } else {
                    Html.Instance.TData.ClassName("date-in-table ms-date").Text(runner.getDate().toString())
                        .Event("click", handler, runner);
                }
                if (runner.getDate() === now.getDate() && runner.getMonth() === now.getMonth() && runner.getFullYear() === _someday.getFullYear()) {
                    Html.Instance.ClassName("date-in-table ms-date ms-date-current");
                }
                if (this.value && runner.getDate() === this.value.getDate() && runner.getMonth() === this.value.getMonth() && runner.getFullYear() === this.value.getFullYear()) {
                    Html.Instance.ClassName("date-in-table ms-date ms-date-day-seleted");
                }
                Html.Instance.End.Render();
                if (runner.getDay() === 0) { // Sunday
                    Html.Instance.End.Render();
                }
                runner = runner.addDays(1);
            }
        }

        Html.Instance.End.End.Div.ClassName("SeparateLine").End.End.Render();

        if (this.Meta.Precision === 7) {
            Html.Instance.Div.ClassName("Time")
                .Div.ClassName("ms-label mr-12-px ms-label-bold").IText("Time").End
                .Div.ClassName("change-hour")
                .Div.ClassName("ms-number ms-number-container input-time")
                .Span.Div.ClassName("ms-number-group").Div.ClassName("ms-number-input")
                .Input.Value(_someday.getHours().toString().padStart(2, '0'))
                .Event("click", () => clearTimeout(_closeAwaiter))
                .Event("change", this.ChangeHour).End.End.End.End.End
                .Div.ClassName("ms-label mr-6-px ml-6-px").Text(":").End
                .Div.ClassName("change-minute")
                .Div.ClassName("ms-number ms-number-container input-time")
                .Span.Div.ClassName("ms-number-group").Div.ClassName("ms-number-input")
                .Input.Value(_someday.getMinutes().toString().padStart(2, '0'))
                .Event("click", () => clearTimeout(_closeAwaiter))
                .Event("change", this.ChangeMinute).End.End.End.End.End.End.Render();
        }

        Html.Instance.Div.ClassName("calendar-footer")
            .Button.Event("click", () => {
                this.TriggerUserChange(now);
            }).ClassName("pick-today-button").IText("Today").End
            .End.End.End.Render();

        ComponentExt.AlterPosition(this.calendar, this.Element);
        const scrollElement = this.Element.closest(".scroll-content");
        if (scrollElement) {
            scrollElement.addEventListener('scroll', ComponentExt.AlterPosition(this.calendar, this.Element));
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
        for (let i = 0; i < this.formats.length; i++) {
            dateTime = dayjs(value, this.formats[i], true); // true for strict parsing
            if (dateTime.isValid()) {
                parsed = true;
                format = this.formats[i];
                break;
            }
        }
        return { parsed, dateTime, format };
    }

    /**
     * Triggers user-defined change actions and updates the UI.
     * @param {Date | null} selected - The selected date.
     */
    TriggerUserChange(selected) {
        if (this.Disabled) {
            return;
        }
        let oldVal = this.value;
        this.Value = selected;
        /** @type {ObservableArgs} */
        // @ts-ignore
        var arg = { NewData: this.value, OldData: oldVal, EvType: "change" };
        this.UserInput?.invoke(arg);
        this.PopulateFields();
        this.CascadeField();
        this.simpleNoEvent = true;
        this.Input.focus();
    }

    /**
 * Sets the day selected by the user and updates the internal state.
 * @param {Date} selected - The day selected by the user.
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
            time.setHours(time.getHours() + value);
            this.hour.value = time.getHours().toString().padStart(2, '0');
        } else {
            time.setMinutes(time.getMinutes() + value);
            this.minute.value = time.getMinutes().toString().padStart(2, '0');
        }
        this.TriggerUserChange(time);
    }

    /**
     * Changes the hour based on user input from the hour input field.
     * @param {Event} e - The event object, containing the user input.
     */
    ChangeHour(e) {
        let newHour = parseInt(this.hour.value);
        if (isNaN(newHour) || newHour < 0 || newHour > 23) {
            return;
        }
        let time = (this.value || this.someday);
        time.setHours(newHour);
        this.TriggerUserChange(time);
    }

    /**
     * Changes the minute based on user input from the minute input field.
     * @param {Event} e - The event object, containing the user input.
     */
    ChangeMinute(e) {
        let newMinute = parseInt(this.minute.value);
        if (isNaN(newMinute) || newMinute < 0 || newMinute > 59) {
            return;
        }
        let time = (this.value || this.someday);
        time.setMinutes(newMinute);
        this.TriggerUserChange(time);
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
        if (!this.ValidationRules || this.ValidationRules.Nothing()) {
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
                return value > new Date(this.Meta.MinDate);
            case 'lt':
                return value < new Date(this.Meta.MaxDate);
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
            this.Input.readonly = value;
        }
        return this.FieldVal?.toString();
    }
}
