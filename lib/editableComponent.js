import './utils/ext.js';
import { Str } from "./utils/ext.js";
import { Utils } from "./utils/utils.js";
import { ValidationRule } from "./models/validationRule.js";
import EventType from "./models/eventType.js";
import { ComponentType } from "./models/componentType.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { Html } from "./utils/html.js";
import { Action } from "./models/action.js";
import { LangSelect } from "./utils/langSelect.js";
import { Component } from "./models/component.js";

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
    /**
     * @type {number}
     */
    static SmallScreen = 768;
    DefaultObject = {};
    TabGroup = false;
    /**
     * @type {boolean}
     */
    IsListViewItem = false;
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
    /**
     * @param {Component} meta 
     * @param {HTMLElement} ele 
     */
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
    /** @type {any} */
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
    AlwaysValid;
    IdField = 'Id';
    AfterSaved = new Action();
    BeforeSaved = new Action();
    PopulateDirty = true;
    LocalData = [];
    IsListViewItem = false;
    IsButton = false;
    IsRow = false;
    IsListView = false;
    IsSearchEntry = false;
    IsEditForm = false;
    /** @type {TabEditor} Handle toggle event. */
    get TabEditor() {
        if (this.#rootTab != null) return this.#rootTab;
        // @ts-ignore
        this.#rootTab = this.FindClosest(x => x.IsTab);
    }
    set TabEditor(editor) {
        this.#rootTab = editor;
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
        this.Children.Flattern(x => x.Children).forEach(x => {
            x.#disabled = value;
            x.SetDisableUI(value);
        });
    }
    get Dirty() {
        var check = this._dirty && !this.AlwaysValid || this.FilterChildren(x => x._dirty, x => !x.PopulateDirty || x.AlwaysValid).Any();
        return check;
    }
    set Dirty(value) {
        this._dirty = value;
        if (!value) {
            this.FilterChildren(x => x._dirty, x => !x.PopulateDirty || x.AlwaysValid).forEach(x => x._dirty = false);
        }
    }
    get IsValid() {
        return Object.keys(this.ValidationResult).length === 0;
    }
    get CacheName() {
        var exp = this.Meta?.CacheName;
        if (!exp) return null;
        var fn = Utils.IsFunction(exp);
        return fn ? fn.call(null, this) : exp;
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
    get Id() {
        return this.Meta?.Id;
    }
    set Id(val) {
        if (this.Meta == null)
            this.Meta = new Component();
        this.Meta.Id = val;
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
        this.ParentElement = this.Meta?.ParentElement;
        this.Element = element;
        this.AlwaysLogHistory = false;
        this.Entity = {}
        if (this.Meta?.Validation != null) {
            /** @type {Validation[]} */
            var rules = typeof meta.Validation === Str.Type ? JSON.parse(meta.Validation.toString()) : meta.Validation;
            if (rules.length > 0) {
                this.ValidationRules = rules.ToDictionary(x => x.Rule, x => x);
            }
        }
        this.DOMContentLoaded.add(() => {
            this.SetRequired();
            this.SendQueueAction("Subscribe");
            if (meta != null && meta.Events) {
                this.DispatchEvent(meta.Events, EventType.DOMContentLoaded, this.Entity).Done();
            }
        });
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
        return this.InvokeEvent(events, eventType, ...parameters);
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
        const func = Utils.IsFunction(eventName);
        if (func) {
            func.call(null, this, this.EditForm);
            return Promise.resolve(true);
        }

        let form = this.EditForm;
        if (!form) {
            return Promise.resolve(false);
        }
        const method = form[eventName];
        if (!method) {
            return Promise.resolve(false);
        }

        const tcs = new Promise((resolve, reject) => {
            let task = method.apply(form, parameters);
            if (!task || task.isCompleted == null) {
                resolve(false);
            } else {
                task.then(() => resolve(true)).catch(e => reject(e));
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
        return this.InvokeEvent(events, eventTypeName, ...parameters);
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
        let label = ruleValue;
        let [hasField, fieldVal] = this.Entity.GetComplexProp(field);
        if (hasField) {
            label = this.Parent.FirstOrDefault(x => x.Name === field)?.Meta?.Label;
            ruleValue = fieldVal;
        }
        if (!validPredicate(value, ruleValue)) {
            this.ValidationResult[ruleType] = Str.Format(rule.Message, this.Meta.Label, label);
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
            ele.setAttribute("enable", "true");
        }
    }

    SetDefaultVal() {
        if (Utils.isNullOrWhiteSpace(this.Meta.DefaultVal)) {
            return;
        }
        if (this.Entity == null || this.EntityId == null) return;
        var fn = Utils.IsFunction(this.Meta.DefaultVal);
        if (fn) {
            fn.call(this, this);
        }
        else if (this.Entity[this.Name] == null) {
            this.Entity[this.Name] = this.DefaultValue;
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

        // @ts-ignore
        const gridRow = this.FindClosest(ListViewItem.prototype) ?? this.FindClosest(ComponentType.EditForm);
        const root = gridRow !== null ? gridRow : this.EditForm;

        const fn = Utils.IsFunction(this.Meta.PopulateField);
        if (fn) {
            try {
                fn.call(null, this, entity);
            } catch (error) {
                console.error(error);
            }
            root.UpdateView(true);
            return;
        }

        const populatedFields = this.Meta.PopulateField.split(",").map(field => field.trim()).filter(x => x !== "");
        if (entity === null || populatedFields.length === 0) {
            return;
        }

        populatedFields.forEach(field => {
            root.FilterChildren(x => x.Name === field).forEach(target => {
                const value = Utils.GetPropValue(entity, field);
                const oldVal = Utils.GetPropValue(this.Entity, field);
                const targetType = this.Entity[field];
                if (value === oldVal || targetType === null || new targetType() !== oldVal) {
                    return;
                }
                this.Entity[field] = value;
                target.UpdateView(true, false);
            });
        });
    }

    GetValueTextAct() {
        return this.Element.textContent;
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
    #show;
    get Show() {
        return this.#show;
    }
    set Show(val) {
        this.Toggle(val);
    }
    /** @param {boolean} value */
    Toggle(value) {
        if (!this.Element) {
            return;
        }
        this.#show = value;
        if (!this.#show) {
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
            this.OnToggle.invoke(this.#show);
        }
    }


    /**
     * Show / hide the component
     * @param {string} showExp 
     */
    ToggleShow(showExp) {
        var fn = Utils.IsFunction(showExp);
        if (fn) {
            var shown = fn.call(null, this);
            this.Show = shown ?? false;
        }
    }

    /**
     * 
     * @param {Boolean | String | Function} disabled 
     */
    ToggleDisabled(disabled) {
        // @ts-ignore
        if (disabled instanceof Boolean) {
            // @ts-ignore
            this.Disabled = disabled;
            return;
        }
        // @ts-ignore
        var disabledFn = Utils.IsFunction(disabled);
        if (disabledFn) {
            let shouldDisabled = disabledFn(null, this) || false;
            this.Disabled = shouldDisabled;
        }
    }

    ListViewItemTab(e) {
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.PrepareUpdateView(force, dirty);
        if (!this.Children || this.Children.length === 0) {
            return;
        }

        if (componentNames.length > 0) {
            // @ts-ignore
            const coms = this.FilterChildren(x => x instanceof Section && componentNames.includes(x.Name))
                // @ts-ignore
                .flatMap(x => x.FilterChildren(com => !(com instanceof Section)));
            // @ts-ignore
            const coms2 = this.FilterChildren(x => componentNames.includes(x.Name) && !(x instanceof Section));
            // @ts-ignore
            const shouldUpdate = [...new Set([...coms, ...coms2].filter(x => !(x instanceof Section)))];

            shouldUpdate.forEach(child => {
                child.PrepareUpdateView(force, dirty);
                child.UpdateView(force, dirty, ...componentNames);
            });
        } else {
            // @ts-ignore
            const shouldUpdate = this.FilterChildren(x => x.ComponentType != "Section");
            shouldUpdate.forEach(child => {
                child.PrepareUpdateView(force, dirty);
                child.UpdateView(force, dirty, ...componentNames);
            });
        }
    }

    /**
     * @param {boolean} force
     * @param {boolean} dirty
     */
    PrepareUpdateView(force, dirty) {
        if (force) {
            this.EmptyRow = false;
        }
        this.ToggleShow(this.Meta?.ShowExp);
        this.ToggleDisabled(this.Meta?.DisabledExp);
        if (dirty !== undefined) {
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
        return "";
    }

    ValidateAsync() {
        return Promise.resolve(true);
    }

    static IsEmpty(array) {
        return array.length === 0;
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

    FilterChildrenTyped(predicate = null, ignorePredicate = null, visited = new Set()) {
        visited = visited == null ? new Set() : visited;
        if (EditableComponent.IsEmpty(this.Children)) {
            return [];
        }

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
        // @ts-ignore
        if (child.IsSingleton) {
            // @ts-ignore
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

        if (!child.Entity || this.DeepEqual(child.Entity, this.DefaultObject)) {
            child.Entity = this.Entity ?? {};
        }

        if (!child.EditForm && !child.Popup) {
            child.EditForm = this.EditForm;
        }

        if (index === null || index >= this.Children.length || index < 0) {
            this.Children.push(child);
        } else {
            this.Children.splice(index, 1, child);
        }

        if (!child.Parent) {
            child.Parent = this;
        }

        Html.Take(child.ParentElement);
        // @ts-ignore
        child.Render();
        // @ts-ignore
        child.ToggleShow(showExp || (child.Meta ? child.Meta.ShowExp : ""));
        child.ToggleDisabled(disabledExp || (child.Meta ? child.Meta.DisabledExp : ""));
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
}