import { Str } from "./utils/ext.js";
import { Utils } from "./utils/utils.js";
import { Component, Action, EventType, ValidationRule, KeyCodeEnum } from "./models/";
import { Uuid7 } from "./structs/uuidv7.js";
import { Html } from "./utils/html.js";
import { LangSelect } from "./utils/langSelect.js";
import Decimal from "decimal.js";
import { Toast } from "./toast.js";
import { Client } from "./clients/";
import { Token } from "./models/";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";
import "dayjs/locale/vi.js";
dayjs.locale('vi');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
/**
 * @typedef {import('./gridView.js').GridView} GridView
 * @typedef {import('./listViewItem.js').ListViewItem} ListViewItem
 * @typedef {import('./searchEntry.js').SearchEntry} SearchEntry
 * @typedef {import('./section.js').Section} Section
 * @typedef {import('./label.js').Label} Label
 * @typedef {import('./editForm.js').EditForm} EditForm
 * @typedef {import('./tabEditor.js').TabEditor} TabEditor
 * @typedef {import('./models/observable.js').default} ObservableArgs
 * @typedef {{ [key: string] : (ValidationRule) }} Validation
 */
/**
 * @class
 */
export class EditableComponent {
    static ExchangeRateVND = {};
    static ExchangeRateSaleVND = {};
    static ExchangeRateProfitVND = {};
    static ExchangeRateUSD = {};
    static ExchangeRateSaleUSD = {};
    static ExchangeRateProfitUSD = {};
    /** @type {Client} */
    Client = Client.Instance;
    /** @type {Uuid7} */
    Uuid7 = Uuid7;
    /** @type {Decimal} */
    Decimal = Decimal;
    /** @type {dayjs} */
    dayjs = dayjs;
    /** @type {any} */
    SalesFunction;
    /** @type {Toast} */
    Toast = Toast;
    /**
     * @type {number}
     */
    static SmallScreen = 768;
    DefaultObject = {};
    /**
     * @type {boolean}
     */
    IsListViewItem = false;
    /**
     * @type {boolean}
     */
    IsVND = false;
    /**
     * @type {boolean}
     */
    IsSection = false;
    /**
     * @type {number}
     */
    static ExSmallScreen = 567;

    /**
     * @type {number}
     */
    static MediumScreen = 992;
    /**
     * @type {number}
     */
    static LargeScreen = 1200;
    /**
     * @type {number}
     */
    static ExLargeScreen = 1452;
    /** @type {EditableComponent} */
    Parent;
    /** @type {EditableComponent[]} */
    Children = [];
    /** @type {HTMLElement}*/
    ParentElement;
    /** @type {HTMLElement} */
    Element;
    /** @type {Object} */
    Entity = null;
    /** @type {Component} */
    Meta;
    /** @type {any} */
    DefaultValue;
    /** @type {string[]} Classes - Represent hierarchy class of the component instance. */
    Classes = [];
    /** @type {boolean} emptyRow - True if the component is in empty row or screen, otherwise false. */
    #emptyRow;
    /** @type {Action} Disposed - Handle after dispose event. */
    Disposed = new Action();
    /** @type {Action} Disposed - Handle DOM Content loaded event. */
    DOMContentLoaded = new Action();
    /** @type {Action} Handle toggle event. */
    OnToggle = new Action();
    /** @type {TabEditor} Handle toggle event. */
    #rootTab;
    UserInput = new Action();
    /** @type {Decimal} */
    OldValue;
    /** @type {{[key: string]: string}} */
    ValidationResult = {};
    get ClassName() { return this.Element.className; }
    set ClassName(value) { this.Element.className = value; }
    /** @type {Validation} */
    ValidationRules = {};
    /** @type {boolean} */
    #disabled;
    /** @type {EditForm} */
    #editForm;
    /** @type {boolean} */
    _dirty;
    /** @type {boolean} */
    _dirtyEntity;
    /** @type {boolean} */
    AlwaysValid;
    IdField = 'Id';
    StatusIdField = 'StatusId';
    AfterSaved = new Action();
    BeforeSaved = new Action();
    PopulateDirty = true;
    LocalData = [];
    IsListViewItem = false;
    IsButton = false;
    IsRow = false;
    IsListView = false;
    IsSearchEntry = false;
    IsTabComponent = false;
    IsEditForm = false;
    /** @type {Token} */
    get Token() {
        return Client.Token;
    }
    /** @type {TabEditor} Handle toggle event. */
    get TabEditor() {
        return this.FindClosest(x => x.IsTab);
    }
    /** @type {EditForm} */
    get EditForm() {
        return this.#editForm;
    }
    /**
     * @param {EditForm} editor
     */
    set EditForm(editor) {
        this.#editForm = editor;
    }
    get IsSmallUp() { return document.body.clientWidth > 768 }
    get IsMediumUp() { return document.body.clientWidth > 992 }
    get IsLargeUp() { return document.body.clientWidth > 1200 }
    /** @type {boolean} */
    get Disabled() {
        return this.#disabled;
    }
    set Disabled(value) {
        this.#disabled = value;
        this.SetDisableUI(value);
        this.Children.Flattern(x => x.Children).filter(y => y.Meta && Utils.isNullOrWhiteSpace(y.Meta.DisabledExp)).forEach(x => {
            x.#disabled = value;
            x.SetDisableUI(value);
        });
    }
    get Dirty() {
        var check = this._dirty && !this.AlwaysValid || this.FilterChildren(x => x._dirty, x => !x.PopulateDirty || x.AlwaysValid).length > 0;
        return check;
    }
    set Dirty(value) {
        this._dirty = value;
        var name = "_dirty";
        if (!Utils.isNullOrWhiteSpace(this.Meta.EntityName)) {
            name = name + this.Meta.EntityName;
            this[name] = value;
        }
        if (!value) {
            this.FilterChildren(x => x._dirty, x => !x.PopulateDirty || x.AlwaysValid).forEach(x => x[name] = false);
        }
    }

    DirtyEntity(entityName) {
        var name = "_dirty";
        var check = this[name + entityName] && !this.AlwaysValid || this.FilterChildren(x => x[name + entityName], x => !x.PopulateDirty || x.AlwaysValid).length > 0;
        return check;
    }
    get IsValid() {
        return Object.keys(this.ValidationResult).length === 0;
    }
    get CacheName() {
        var exp = this.Meta?.CacheName;
        if (!exp) return null;
        var data = Utils.IsFunction(exp, false, this);
        return data ? data : exp;
    }
    get QueueName() {
        return this.Meta?.QueueName;
    }
    /** @returns {string} Entity's Id */
    get EntityId() {
        return this.Entity?.Id;
    }
    set EntityId(value) {
        if (this.Entity == null) return;
        this.Entity.Id = value;
    }
    /** @returns {string} Meta Label */
    get ComLabel() {
        return this.Meta?.Label;
    }
    /** @returns {string} Meta fieldname */
    get Name() {
        return this.Meta?.FieldName;
    }
    set Name(val) {
        if (this.Meta == null)
            this.Meta = new Component();
        this.Meta.FieldName = val || null;
    }
    get ComponentType() {
        return this.Meta?.ComponentType;
    }
    set ComponentType(val) {
        if (this.Meta == null)
            this.Meta = new Component();
        this.Meta.ComponentType = val;
    }
    /** @type {boolean} emptyRow - True if the component is in empty row or screen, otherwise false. */
    get EmptyRow() {
        return this.#emptyRow;
    }
    set EmptyRow(val) {
        this.#emptyRow = val;
    }
    get MetaConn() {
        return this.Meta?.MetaConn;
    }
    get DataConn() {
        return this.Meta?.DataConn;
    }
    get FieldVal() { return !this.Entity || !this.Name ? null : this.Entity[this.Name]; }
    set FieldVal(val) {
        if (this.Entity == null || this.Name == null) return;
        this.Entity[this.Name] = val;
    }
    static TabContainer = document.getElementById("tab-content");
    Popup = false;
    IsTab = false;
    get FirstChild() { return this.Children.FirstOrDefault(); }
    constructor(meta, element = null) {
        this.Meta = meta;
        this.AlwaysValid = false;
        this.ParentElement = this.Meta?.ParentElement;
        this.Element = element;
        this.AlwaysLogHistory = false;
        this.Entity = {};
        this.SalesFunction = JSON.parse(localStorage.getItem("SalesFunction"));
        this.UpdateValidation();
        this.DOMContentLoaded.add(() => {
            this.SetRequired();
            this.SendQueueAction("Subscribe");
            if (meta != null && meta.Events) {
                this.DispatchEvent(meta.Events, EventType.DOMContentLoaded, this, this.Entity).then();
            }
            this.SetOldTextAndVal();
        });
    }

    UpdateValidation(setRequired) {
        if (!Utils.isNullOrWhiteSpace(this.Meta?.Validation)) {
            /** @type {Validation[]} */
            var rules = Utils.IsFunction(this.Meta.Validation, false, this);
            if (rules.length > 0) {
                this.ValidationRules = rules.ToDictionary(x => x.Rule, x => x);
            }
        }
        if (setRequired) {
            this.SetRequired();
        }
    }
    /**
     * @param {any} events
     * @param {string} eventType
     * @param {any[]} parameters
     */
    DispatchEvent(events, eventType, ...parameters) {
        if (!events) {
            return Promise.resolve(true);
        }
        return Promise.resolve(this.InvokeEvent(events, eventType, ...parameters));
    }
    /**
     * @param {any} events
     * @param {string} eventType
     * @param {any[]} parameters
     */
    InvokeEvent(events, eventTypeName, ...parameters) {
        let eventObj;
        try {
            eventObj = JSON.parse(events);
        } catch {
            return Promise.resolve(false);
        }
        const eventName = eventObj[eventTypeName];
        if (!eventName) {
            return Promise.resolve(false);
        }
        const data = Utils.IsFunction(eventName, false, this);
        if (data) {
            return Promise.resolve(true);
        }
        let form = this.EditForm;
        if (!form) {
            return Promise.resolve(false);
        }
        /**
         * @type {Function}
         */
        const method = form[eventName];
        if (!method) {
            return Promise.resolve(false);
        }
        const tcs = new Promise((resolve, reject) => {
            let task = method.apply(form, parameters);
            if (!task || task.isCompleted == null) {
                resolve(task);
            } else {
                task.then(() => resolve(task)).catch(e => reject(e));
            }
        });
        return tcs;
    }
    /**
     * @param {string} events
     * @param {string} eventType
     * @param {any[]} parameters
     */
    DispatchCustomEvent(events, eventType, ...parameters) {
        if (!events) {
            return Promise.resolve(true);
        }
        const eventTypeName = eventType.toString();
        return Promise.resolve(this.InvokeEvent(events, eventTypeName, ...parameters));
    }

    SetOldTextAndVal() {
        this.OriginalText = this.GetValueText();
        this.OldValue = this.Entity[this.Meta.FieldName];
    }

    SetRequired() {
        const ele = this.Element;
        if (ele == null) return;
        if (this.ValidationRules?.hasOwnProperty(ValidationRule.Required)) {
            ele.setAttribute(ValidationRule.Required, true.toString());
        }
        else {
            ele.removeAttribute(ValidationRule.Required);
        }
    }
    /**
     * 
     * @param {string} ruleType
     * @param {any} value
     * @param {(item: any, rule: any) => boolean} validPredicate 
     * @returns 
     */
    Validate(ruleType, value, validPredicate) {
        if (!this.ValidationRules.hasOwnProperty(ruleType)) {
            return true;
        }
        let rule = this.ValidationRules[ruleType];
        if (rule === null || rule.Value1 === null) {
            return true;
        }
        let field = rule.Value1.toString();
        if (field === "") {
            return true;
        }
        let ruleValue = rule.Value1;
        let rule2Value = rule.Value2;
        let label = ruleValue;
        let fieldVal = this.Entity[field];
        if (fieldVal) {
            label = this.Meta?.Label;
            ruleValue = fieldVal;
        }
        if (!validPredicate.bind(this)(value, ruleValue, rule2Value)) {
            if (![ValidationRule.RegEx, ValidationRule.Replace].some(x => x == ruleType)) {
                this.ValidationResult[ruleType] = Str.Format(rule.Message, this.Meta.Label, label);
            }
            else {
                delete this.ValidationResult[ruleType];
            }
            return true;
        }
        else {
            delete this.ValidationResult[ruleType];
        }
        return false;
    }
    /**
     * @param {boolean} [disabled]
     */
    SetDisableUI(disabled) {
        const ele = this.Element;
        if (ele == null) {
            return;
        }

        if (disabled) {
            ele.setAttribute("disabled", "disabled");
        }
        else {
            ele.removeAttribute("disabled");
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
        if (data && this.Entity && this.Entity[this.Name] == null && this.Entity[this.IdField].startsWith("-")) {
            this.Entity[this.Name] = data;
        }
    }

    ValidateRequired(value) {
        if (this.Element === null || Object.keys(this.ValidationRules).length === 0 || this.EmptyRow || this.AlwaysValid) {
            return true;
        }

        if (!this.ValidationRules.hasOwnProperty(ValidationRule.Required)) {
            this.Element.removeAttribute(ValidationRule.Required);
            return true;
        }

        const requiredRule = this.ValidationRules[ValidationRule.Required];
        this.Element.setAttribute(ValidationRule.Required, true.toString());

        if (value === null || value === undefined || value.toString().trim() === "") {
            this.Element.removeAttribute("readonly");
            this.ValidationResult[ValidationRule.Required] = requiredRule.Message.replace("{0}", LangSelect.Get(this.Meta.Label)).replace("{1}", this.Entity);
            return false;
        } else {
            delete this.ValidationResult[ValidationRule.Required];
            return true;
        }
    }

    AddRule(rule) {
        this.ValidationRules[rule.Rule] = rule;
        if (rule.Rule === ValidationRule.Required) {
            this.Element.setAttribute(ValidationRule.Required, true.toString());
        }
    }

    KeydownHandler(e) {
        let code = e.KeyCodeEnum();
        switch (code) {
            case KeyCodeEnum.Enter:
                e.preventDefault();
                if (!this.Parent.IsListViewItem) {
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
                break;
            default:
                break;
        }
    }

    RemoveRule(ruleName) {
        delete this.ValidationRules[ruleName];
        if (!Object.keys(this.ValidationRules).includes(ValidationRule.Required)) {
            this.Element.removeAttribute(ValidationRule.Required);
        }
    }

    GetInvalid() {
        return this.Children.Flattern(x => x.AlwaysValid ? null : x.Children).Where(x => !x.IsValid);
    }

    CascadeField() {
        if (!this.Meta.CascadeField) {
            return;
        }

        const root = this.FindClosest(x => x.IsRow) ?? this.EditForm;
        const cascadeFields = this.Meta.CascadeField.split(",").map(field => field.trim()).filter(x => x !== "");
        if (cascadeFields.length === 0) {
            return;
        }

        cascadeFields.forEach(field => {
            root.FilterChildren(x => x.Name === field).forEach(target => {
                // @ts-ignore
                if (target instanceof SearchEntry && target !== null) {
                    // @ts-ignore
                    target.Value = null;
                    target.Meta.LocalData = null;
                } else {
                    target.UpdateView();
                }
            });
        });
    }

    PopulateFields(entity = null) {
        if (this.Entity == null || this.Meta.PopulateField == null) {
            return;
        }
        var isGrid = this.Parent.IsListViewItem;
        var root = this.EditForm;
        if (isGrid) {
            root = this.Parent;
        }
        Utils.IsFunction(this.Meta.PopulateField, false, this);
    }

    AddIdToPatch(details) {
        const idFieldIndex = details.findIndex(x => x.Field === Utils.IdField);
        if (idFieldIndex !== -1) details.splice(idFieldIndex, 1);
        if (this.EntityId === null) {
            details.push({ Field: Utils.IdField, Value: Uuid7.Id25() });
        } else {
            details.push({ Field: Utils.IdField, Value: this.EntityId, OldVal: this.EntityId });
        }
    }

    _events = {};
    addEventListener(name, handler) {
        if (handler === null) throw new Error("Handler cannot be null");
        const handlers = this._events[name] || null;
        if (handlers == null) {
            this._events[name] = [handler];
        } else {
            handlers.push(handler);
        }
    }

    removeEventListener(name, handler) {
        if (handler === null) throw new Error("Handler cannot be null");
        const handlers = this._events[name] || null;
        if (handlers !== null) {
            delete this._events[name];
        }
    }

    FindComponentByName(name, type) {
        return this.FirstOrDefault(x => x.Name === name && (type == null || x.Classes.includes(type)));
    }

    /**
     * Find closeset component
     * @param {(value: EditableComponent) => boolean} filter - Filter component
     * @returns {EditableComponent} Returns the closeset EditableComponent of the specified type
     */
    FindClosest(filter = null) {
        /** @type {EditableComponent} */
        let found = this;
        while (found != null) {
            if (filter == null || filter(found)) return found;
            found = found.Parent;
        }
        return null;
    }
    /** @type {boolean} */
    _show;
    get Show() {
        return this._show;
    }
    set Show(val) {
        this.Toggle(val);
    }
    /** @param {boolean} value */
    Toggle(value) {
        if (!this.Element) {
            return;
        }
        this._show = value;
        if (!this._show) {
            this.Element.style.display = "none";
            if (this.Meta && this.Meta.ShowLabel && !this.Parent && this.Meta.FieldName) {
                this.Element.parentElement.style.display = "none";
                this.Element.parentElement.previousElementSibling.style.display = "none";
            }
        }
        else {
            this.Element.style.display = "";
            if (this.Meta && this.Meta.ShowLabel && !this.Parent && this.Meta.FieldName) {
                {
                    this.Element.parentElement.style.display = "";
                    this.Element.parentElement.previousElementSibling.style.display = "";
                }
            }
            this.OnToggle.Invoke(this._show);
        }
    }


    /**
     * Show / hide the component
     * @param {string|boolean} showExp 
     */
    ToggleShow(showExp) {
        if (showExp instanceof Boolean) {
            this.Show = showExp;
            return;
        }
        var shown = Utils.IsFunction(showExp, false, this);
        this.Show = shown;
    }

    /**
     * 
     * @param {Boolean | String | Function} disabled 
     */
    ToggleDisabled(disabled) {
        if (disabled instanceof Boolean) {
            this.Disabled = disabled;
            return;
        }
        if (!this.Entity.NoSubmit && !this.Entity.IsLock) {
            var disabledFn = Utils.IsFunction(disabled, false, this);
            this.Disabled = disabledFn || false;
        }
    }
    /**
     * 
     * @param {Eve} e 
     */
    ListViewItemTab(e) {
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.PrepareUpdateView(force, dirty);
        if (!this.Children || this.Children.length === 0) {
            return;
        }
        if (componentNames && componentNames.length > 0) {
            const coms = this.FilterChildren(x => x.IsSection && componentNames.includes(x.Meta.FieldName))
                .flatMap(x => x.FilterChildren(x => !x.IsSection));
            const coms2 = this.FilterChildren(x => componentNames.includes(x.Meta.FieldName) && !x.IsSection);
            const shouldUpdate = [...new Set([...coms, ...coms2].filter(x => !x.IsSection))];
            shouldUpdate.forEach(child => {
                child.PrepareUpdateView(force, dirty);
                child.Entity = this.Entity;
                child.UpdateView(force, dirty, ...componentNames);
            });
        } else {
            const shouldUpdate = this.FilterChildren(x => !x.IsSection && !x.IsListView);
            shouldUpdate.forEach(child => {
                child.PrepareUpdateView(force, dirty);
                child.Entity = this.Entity;
                child.UpdateView(force, dirty, ...componentNames);
            });
        }
    }

    /**
     * @param {boolean} force
     * @param {boolean} dirty
     */
    PrepareUpdateView(force, dirty) {
        if (this.Meta
            && !Utils.isNullOrWhiteSpace(this.Meta.ComponentType)
            && (this.Entity && !Utils.isNullOrWhiteSpace(this.Entity["InsertedBy"]))
            && !this.IsSection
            && !this.IsListViewItem
            && !this.IsTabComponent
            && !this.Meta.CanWriteAll
            && (!this.IsButton)
            && (this.Entity && this.Entity["InsertedBy"] != this.Token.UserId
                && ((this.Entity["AssignId"] && this.Entity["AssignId"] != this.Token.UserId) || !this.Entity["AssignId"])
                && Utils.isNullOrWhiteSpace(this.Meta.DisabledExp))
        ) {
            this.Disabled = true;
        }
        if (force) {
            this.EmptyRow = false;
        }
        if (this.Meta && this.Meta.DefaultVal) {
            this.SetDefaultVal();
        }
        if (this.Meta && this.Meta.ShowExp) {
            this.ToggleShow(this.Meta.ShowExp);
        }
        if (this.Meta && this.Meta.DisabledExp) {
            this.ToggleDisabled(this.Meta.DisabledExp);
        }
        if (this.Meta && this.Meta.AddRowExp) {
            this.ToggleAddRow(this.Meta.AddRowExp);
        }
        if (dirty) {
            this._setDirty = dirty;
        }
    }

    Nothing() {
        return !this.Children || this.Children.length === 0;
    }

    DisposeChildren() {
        if (this.Nothing()) {
            return;
        }
        let leaves = this.Flatten(node => node.Children)
            .filter(node => node.Element !== null && node.Parent !== null && node.Nothing());

        while (leaves.length > 0 && (leaves == 1 && leaves[0] != this)) {
            leaves.forEach(node => {
                if (node === null) {
                    return;
                }
                node.Dispose();
                if (node.Parent && node.Parent.Children) {
                    node.Parent.Children = node.Parent.Children.filter(child => child !== node);
                }
            });

            // Recalculate leaves after disposing the current leaves
            leaves = this.Flatten(node => node.Children)
                .filter(node => node.Element !== null && node.Parent !== null && node.Nothing());
        }
    }

    Flatten(fn) {
        const result = [];
        const stack = [this];
        while (stack.length > 0) {
            const node = stack.pop();
            result.push(node);
            const children = fn(node);
            if (children) {
                stack.push(...children);
            }
        }
        return result;
    }

    Dispose() {
        this.SendQueueAction("Unsubscribe");
        this.DisposeChildren();
        this.RemoveDOM();
        this.Children = null;
        this.DOMContentLoaded = null;
        this.OnToggle = null;
        if (this.Parent != null && this.Parent.Children != null
            && this.Parent.Children.ToArray().HasElement()
            && this.Parent.Children.ToArray().Contains(this)) {
            this.Parent.Children.ToArray().Remove(this);
        }
        this.Disposed?.Invoke();
    }

    RemoveDOM() {
        if (this.Element != null) {
            this.Element.remove();
            this.Element = null;
        }
    }

    SendQueueAction(action) {
        var queueName = this.QueueName;
        if (!queueName) return;
        const param = { QueueName: queueName, Action: action };
        // @ts-ignore
        this.EditForm?.NotificationClient?.Send(JSON.stringify(param));
        if (action == "Subscribe")
            // @ts-ignore
            window.addEventListener(queueName, this.QueueHandler);
        else
            // @ts-ignore
            window.removeEventListener(queueName, this.QueueHandler);
    }

    GetValueText() {
        if (this.Element === null) {
            return "";
        }
        if (this.Element instanceof HTMLInputElement) {
            return this.Element.value;
        }
        if (this.Element instanceof HTMLTextAreaElement) {
            return this.Element.value;
        }
        return this.Element.textContent;
    }

    GetValue() {
        return this.Entity[this.Name];
    }

    ValidateAsync() {
        return Promise.resolve(true);
    }

    static IsEmpty(array) {
        return array && array.length === 0;
    }

    /**
     * 
     * @param {(item: EditableComponent) => boolean} filter 
     * @param {(item: EditableComponent) => boolean} ignore 
     * @returns {EditableComponent[] | null}
     */
    FilterChildren(predicate, ignoree, stopWhere = null) {
        return this.FilterChildrenTyped(predicate, ignoree, stopWhere);
    }
    /**
     * @returns {EditableComponent[] | null}
     */
    FilterChildrenTyped(predicate = null, ignorePredicate = null, visited = new Set()) {
        visited = visited == null ? new Set() : visited;
        if (EditableComponent.IsEmpty(this.Children) || !this.Children) {
            return [];
        }
        /**
         * @type {EditableComponent[]}
         */
        let result = [];
        for (const child of this.Children) {
            let t = child instanceof EditableComponent ? child : null;

            if (t === null && EditableComponent.IsEmpty(child.Children)) {
                continue;
            }

            if (ignorePredicate && ignorePredicate(t)) {
                continue;
            }

            if (t !== null && (!predicate || predicate(t)) && !visited.has(t)) {
                visited.add(t);
                result.push(t);
            }

            result = result.concat(child.FilterChildrenTyped(predicate, ignorePredicate, visited));
        }
        return result;
    }
    /**
     * 
     * @param {(ele: HTMLElement) => boolean} predicate 
     * @returns {EditableComponent[]}
     */
    FindActiveComponent(predicate) {
        const showPredicate = (/** @type {HTMLElement} */ e) => {
            return !e.hidden() && predicate(e);
        }
        // @ts-ignore
        return this.Children.Where(showPredicate).Flattern(x => showPredicate(x) ? x.Children : null);
    }
    /**
     * Returns the first element of the collection that satisfies the specified condition, or null if no such element is found.
     * @param {(item: EditableComponent) => boolean} filter - The condition to check for each element.
     * @returns {EditableComponent|null} The first element that satisfies the condition, or null if no such element is found.
     */
    FirstOrDefault(filter) {
        return this.Children.Flattern(x => x.Children).FirstOrDefault(filter);
    }
    /**
     * 
     * @param {EditableComponent} child 
     * @param {Number} index 
     * @param {(e: EditableComponent) => boolean | string} showExp 
     * @param {(e: EditableComponent) => boolean | string} disabledExp 
     * @returns 
     */
    AddChild(child, index = null, showExp = null, disabledExp = null) {
        if (child.IsSingleton) {
            child.Render();
            return;
        }
        if (!child.ParentElement) {
            if (child.ComponentType == null && this.TabEditor) {
                if (child.Popup) {
                    child.ParentElement = Element || this.TabEditor.TabContainer;
                } else {
                    child.ParentElement = this.TabEditor.TabContainer;
                }
            } else {
                child.ParentElement = Html.Context;
            }
        }

        if (!child.EditForm && !child.Popup) {
            child.EditForm = this.EditForm;
        }
        if (child.Meta && child.Meta.EntityName) {
            if (!child.Entity || this.DeepEqual(child.Entity, this.DefaultObject)) {
                child.Entity = child.EditForm[child.Meta.EntityName] ?? {
                    Id: Uuid7.NewGuid()
                };
            }
        }
        else {
            if (!child.Entity || this.DeepEqual(child.Entity, this.DefaultObject)) {
                child.Entity = this.Entity ?? {
                    Id: Uuid7.NewGuid()
                };
            }
        }

        if (index === null || index >= this.Children.length || index < 0) {
            this.Children.push(child);
        } else {
            this.Children.splice(index, 0, child);
        }

        if (!child.Parent) {
            child.Parent = this;
        }
        Html.Take(child.ParentElement);
        // @ts-ignore
        child.Render();
        if (child.Meta
            && !Utils.isNullOrWhiteSpace(child.Meta.ComponentType)
            && !Utils.isNullOrWhiteSpace(child.Entity["InsertedBy"])
            && !child.IsSection
            && !child.IsListViewItem
            && !child.IsTabComponent
            && !child.Meta.CanWriteAll
            && !child.IsButton
            && ((child.Entity["InsertedBy"] != this.Token.UserId && child.Entity["AssignId"] != this.Token.UserId)
                || child.Entity["NoSubmit"] || child.Entity["IsLock"])) {
            child.Disabled = true;
        }
        // @ts-ignore
        if (showExp || (child.Meta && child.Meta.ShowExp)) {
            child.ToggleShow(showExp || child.Meta.ShowExp);
        }
        if (disabledExp || (child.Meta && child.Meta.DisabledExp && child.Entity)) {
            child.ToggleDisabled(disabledExp || child.Meta.DisabledExp);
        }
    }

    DeepEqual(obj1, obj2) {
        if (obj1 === obj2) {
            return true;
        }

        if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
            return false;
        }

        let keys1 = Object.keys(obj1);
        let keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let key of keys1) {
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true;
    }

    RemoveChild(child) {
        const index = this.Children.indexOf(child);
        if (index > -1) {
            this.Children.splice(index, 1);
        }
    }

    Focus() {
        // @ts-ignore
        this.Element?.focus();
    }

    /**
     * @param {boolean} disabled
     * @param {string[]} name
     */
    SetDisabled(disabled, ...name) {
        if (name == null || name.length == 0) this.Disabled = disabled;
        else {
            this.FilterChildren(x => name.includes(x.Name)).forEach(x => x.Disabled = disabled);
        }
    }

    getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    }

    async RunQuery() {
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: submitEntity ? JSON.stringify(submitEntity) : null,
            ComId: this.Meta.Id,
        };
        return await Client.Instance.SubmitAsync({
            Url: "/api/feature/report",
            IsRawString: true,
            JsonData: JSON.stringify(entity),
            Method: "POST"
        });
    }

    async RunQuerys() {
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: submitEntity ? JSON.stringify(submitEntity) : null,
            ComId: this.Meta.Id,
        };
        return await Client.Instance.SubmitAsync({
            Url: "/api/feature/sql",
            IsRawString: true,
            JsonData: JSON.stringify(entity),
            Method: "POST"
        });
    }

    async SubmitObject(component, tablename) {
        let componentPatch = [];
        Object.getOwnPropertyNames(component).forEach(cell => {
            if (component[cell] instanceof Array || (component[cell] instanceof Object && !(component[cell] instanceof Decimal))) {
                return;
            }
            let val;
            if (typeof component[cell] === "boolean") {
                val = component[cell] ? "1" : "0";
            } else {
                val = component[cell];
            }
            let prop = {
                Label: cell,
                Field: cell,
                Value: val,
            };
            componentPatch.push(prop);
        });
        let componentModel = {
            Changes: componentPatch,
            Table: tablename
        };
        await Client.Instance.PatchAsync(componentModel);
    }
}