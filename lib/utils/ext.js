import { KeyCodeEnum, Entity } from "../models/enum.js";
import { Utils } from "./utils.js";
import { OutOfViewPort } from "./outOfViewPort.js";

export function HasNonSpaceChar() { return this.trim() !== ''; }

export class Str {
    static Empty = '';
    static Comma = ',';
    static Type = 'string';
    /**
     * @param {string} template
     * @param {(string | any[])[]} args
     */
    static Format(template, ...args) {
        return template.replace(/{(\d+)}/g, (/** @type {any} */ match, /** @type {string | number} */ index) => {
            return typeof args[index] != 'undefined' ? args[index] : match;
        });
    }
    /**
     * @param {string} separator
     * @param {any[]} str
     */
    static Join(separator, ...str) {
        str.join(separator)
    }
}

/**
 * @returns true if array contains at least one element
 */
function HasElement() {
    return this != null && this.length > 0;
}

Array.prototype.Nothing = function () {
    return this.length === 0;
};

/**
 * @template T, K
 * @param {(value: T) => K[]} getChildren
 * @returns {K[]}
 */
Array.prototype.Flattern = function (getChildren) {
    if (this.Nothing()) return this;
    var firstLevel = this.Select(x => getChildren(x)).Where(x => x != null).SelectMany((/** @type {any} */ x) => x);
    if (firstLevel.Nothing()) {
        return this;
    }
    return this.concat(firstLevel.Flattern(getChildren));
};
Array.prototype.Any = function (/** @type {(arg0: any) => any} */ predicate) {
    if (!predicate) {
        return this.length > 0;
    }
    for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return true;
        }
    }
};
Array.prototype.Where = Array.prototype.filter;
Array.prototype.SelectMany = Array.prototype.flatMap;
Array.prototype.SelectForEach = Array.prototype.map;
Array.prototype.Select = Array.prototype.map;
Array.prototype.HasElement = HasElement;
Array.prototype.ToArray = function () { return this; }
Array.prototype.Contains = function (/** @type {any} */ item) {
    return this.indexOf(item) !== -1;
};
Array.prototype.Remove = function (/** @type {any} */ item) {
    var index = this.indexOf(item);
    if (index !== -1) {
        this.splice(index, 1);
    }
};
Array.prototype.ToDictionary = function (/** @type {(arg0: any) => string | number} */ keySelector, /** @type {(x: any) => any} */ valueSelector) {
    if (valueSelector == null) valueSelector = (/** @type {any} */ x) => x;
    return this.reduce((acc, curr) => {
        acc[keySelector(curr)] = valueSelector(curr);
        return acc;
    }, {});
};
Array.prototype.FirstOrDefault = function (predicate = null) {
    if (!predicate) return this.length > 0 ? this[0] : null;
    for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) return this[i];
    }
}
Array.prototype.GroupBy = function (/** @type {(arg0: any) => any} */ keyFunction) {
    const map = this.reduce((accumulator, item) => {
        const keyObj = keyFunction(item);
        const key = JSON.stringify(keyObj);

        if (!accumulator[key]) {
            accumulator[key] = [];
            accumulator[key].keyObj = keyObj;
        }
        accumulator[key].push(item);
        return accumulator;
    }, {});
    return Object.keys(map).map(key => {
        const items = map[key];
        items.Key = map[key].keyObj;
        return items;
    });
};
Array.prototype.ForEach = Array.prototype.forEach;
/**
 * @template T, K
 * @param {(item: T) => K} keySelector 
 * @returns 
 */
Array.prototype.DistinctBy = function (/** @type {(item: T) => K} */ keySelector) {
    return this.GroupBy(keySelector).FirstOrDefault();
};
/**
 * @template T, K
 * @returns 
 */
Array.prototype.Distinct = function () {
    return this.GroupBy(x => x).FirstOrDefault();
};
Array.prototype.ForEachAsync = async function (/** @type {(value: any, index: number, array: any[]) => any} */ map2Promise) {
    var promises = this.map(map2Promise);
    await Promise.all(promises);
    return this;
};
Array.prototype.Clear = function () {
    while (this.length) this.pop();
};
Array.prototype.AddRange = Array.prototype.push;
Array.prototype.Combine = function (/** @type {(value: any, index: number, array: any[]) => any} */ mapper = null, /** @type {string} */ separator = ',') {
    if (mapper) {
        return this.map(mapper).join(separator);
    } else {
        return this.join(separator);
    }
};
/**
 * @template T
 * @param {(item: T) => any} keySelector 
 * @param {(item: T) => any} keySelector2 
 * @param {boolean} asc1 
 * @param {boolean} asc2 
 * @returns {T[]}
 */
Array.prototype.OrderBy = function (keySelector, keySelector2, asc1 = true, asc2 = true) {
    return this.slice().sort((a, b) => {
        const ra = keySelector(a);
        const rb = keySelector(b);
        if (ra != rb) return ra > rb ? (asc1 ? 1 : -1) : (asc1 ? -1 : 1);
        const ra2 = keySelector2(a);
        const rb2 = keySelector2(b);
        return ra2 > rb2 ? (asc2 ? 1 : -1) : (asc2 ? -1 : 1);
    });
};
Array.prototype.All = Array.prototype.every;
Array.prototype.IndexOf = Array.prototype.findIndex;
Array.prototype.LastOrDefault = function (predicate = null) {
    if (predicate) return this.findLast(predicate);
    return this.length > 0 ? this[this.length - 1] : null;
};

String.prototype.DecodeSpecialChar = function () {
    return Utils.DecodeSpecialChar(this);
};

Object.prototype.GetFieldNameByVal = function (/** @type {any} */ value) {
    for (const [key, val] of Object.entries(this)) {
        if (val === value) {
            return key;
        }
    }
}
Object.prototype.ToEntity = function () {
    return Object.keys(this).map((key, index) => {
        /** @type {Entity} */
        // @ts-ignore
        const entity = { Id: index + 1, Name: key, Value: this[key] };
        return entity;
    });
};
Object.prototype.GetComplexProp = function (/** @type {string} */ path) {
    if (path == null) return null;
    return path.split(".").reduce((/** @type {{ [x: string]: any; }} */ obj, /** @type {string | number} */ key) => obj && obj[key], this);
};
Object.prototype.SetComplexPropValue = function (/** @type {string} */ path, /** @type {any} */ value) {
    if (path == null) return;
    const keys = path.split('.');
    let obj = this;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!obj[key]) {
            obj[key] = {};
        }
        obj = obj[key];
    }
    obj[keys[keys.length - 1]] = value;
};
Object.prototype.SetPropValue = Object.prototype.SetComplexPropValue;
Object.prototype.Nothing = function () {
    return Object.keys(this).length === 0;
};
Object.prototype.CopyPropFrom = function (/** @type {{ [x: string]: any; hasOwnProperty: (arg0: string) => any; }} */ source) {
    if (source && typeof source === 'object') {
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                this[key] = source[key];
            }
        }
    }
};
Object.prototype.Clear = function () {
    for (let key in this) {
        if (this.hasOwnProperty(key)) {
            delete this[key];
        }
    }
};
Promise.prototype.Done = Promise.prototype.then;
Promise.prototype.done = Promise.prototype.then;
Date.prototype.addSeconds = function (/** @type {number} */ seconds) {
    var date = new Date(this.valueOf());
    date.setSeconds(date.getSeconds() + seconds);
    return date;
};
Date.prototype.addMinutes = function (/** @type {number} */ minutes) {
    var date = new Date(this.valueOf());
    date.setMinutes(date.getMinutes() + minutes);
    return date;
};
Date.prototype.addHours = function (/** @type {number} */ hours) {
    var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
};
Date.prototype.addDays = function (/** @type {number} */ days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};
Date.prototype.addMonths = function (/** @type {number} */ months) {
    var date = new Date(this.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
};
Date.prototype.addYears = function (/** @type {number} */ years) {
    var date = new Date(this.valueOf());
    date.setFullYear(date.getFullYear() + years);
    return date;
};
HTMLElement.prototype.HasClass = function (/** @type {string} */ str) {
    return this.classList.contains(str);
};
HTMLElement.prototype.ReplaceClass = function (/** @type {string} */ cls, /** @type {string} */ byCls) {
    this.classList.remove(cls);
    this.classList.add(byCls);
};
Number.prototype.leadingDigit = function () {
    // @ts-ignore
    return this < 10 ? '0' + this : '' + this;
}
/**
 * Extends the Event prototype with custom methods for handling event properties and behaviors.
 */

/**
 * Gets the top position (Y-coordinate) of the event.
 * @returns {number} The Y-coordinate.
 */
Event.prototype.Top = function () {
    // @ts-ignore
    return this.clientY;
};

/**
 * Gets the left position (X-coordinate) of the event.
 * @returns {number} The X-coordinate.
 */
Event.prototype.Left = function () {
    // @ts-ignore
    return parseFloat(this.clientX);
};

/**
 * Gets the keyCode from the event.
 * @returns {number} The keyCode or -1 if undefined.
 */
Event.prototype.KeyCode = function () {
    // @ts-ignore
    return this.keyCode ?? -1;
};

/**
 * Attempts to parse keyCode to an enum value.
 * @returns {KeyCodeEnum|null} Parsed KeyCodeEnum or null if unable to parse.
 */
Event.prototype.KeyCodeEnum = function () {
    // @ts-ignore
    return this.keyCode ?? -1;
};

/**
 * Checks if the Shift key was pressed during the event.
 * @returns {boolean} True if Shift key was pressed.
 */
Event.prototype.ShiftKey = function () {
    // @ts-ignore
    return this.shiftKey;
};

/**
 * Detects if the user pressed Ctrl or Command key while the event occurs.
 * @returns {boolean} True if Ctrl or Meta key was pressed.
 */
Event.prototype.CtrlOrMetaKey = function () {
    // @ts-ignore
    return this.ctrlKey || this.metaKey;
};

/**
 * Checks if the Alt key was pressed during the event.
 * @returns {boolean} True if Alt key was pressed.
 */
Event.prototype.AltKey = function () {
    // @ts-ignore
    return this.altKey;
};

/**
 * Gets the checked status from the target element of the event, assuming the target is an input element.
 * @returns {boolean} Checked status.
 */
Event.prototype.GetChecked = function () {
    // @ts-ignore
    if (this.target && this.target.type === "checkbox") {
        // @ts-ignore
        return this.target.checked;
    }
    return false;
};

/**
 * Gets the input text from the target element of the event, assuming the target is an input element.
 * @returns {string} Input text value.
 */
Event.prototype.GetInputText = function () {
    // @ts-ignore
    if (this.target && typeof this.target.value === "string") {
        // @ts-ignore
        return this.target.value;
    }
    return "";
};

/**
 * Calculates the full height of an element, including margins.
 * @returns {number} The total height in pixels.
 */
HTMLElement.prototype.GetFullHeight = function () {
    if (!this) {
        return 0;
    }
    const style = window.getComputedStyle(this);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return this.scrollHeight + marginTop + marginBottom;
};

/**
 * Add a class to the element.
 * @param {string} className - The class name to add.
 */
HTMLElement.prototype.AddClass = function (className) {
    if (!this || !className) {
        return;
    }
    this.classList.add(className);
};

/**
 * Removes a class from the element.
 * @param {string} className - The class name to remove.
 */
HTMLElement.prototype.RemoveClass = function (className) {
    if (!this || !className) {
        return;
    }
    this.classList.remove(className);
};

/**
 * Toggles a class on the element based on its presence.
 * @param {string} className - The class to toggle.
 */
HTMLElement.prototype.ToggleClass = function (className) {
    if (!this || !className) {
        return;
    }
    this.classList.toggle(className);
};

/**
 * Sets the display style to empty, effectively showing the element.
 */
HTMLElement.prototype.Show = function () {
    if (!this) {
        return;
    }
    this.style.display = '';
};

/**
 * Gets the computed style of the element.
 * @returns {CSSStyleDeclaration} The computed style of the element.
 */
HTMLElement.prototype.GetComputedStyle = function () {
    return window.getComputedStyle(this);
};

/**
 * Sets the display style to 'none', hiding the element.
 */
HTMLElement.prototype.Hide = function () {
    if (!this) {
        return;
    }
    this.style.display = 'none';
};

/**
 * Checks if the element is hidden.
 * @returns {boolean} True if the element is hidden; otherwise, false.
 */
HTMLElement.prototype.Hidden = function () {
    if (!this) {
        return true;
    }
    const rect = this.getBoundingClientRect();
    const style = window.getComputedStyle(this);
    return style.display === "none" || (rect.bottom === 0 && rect.top === 0 && rect.width === 0 && rect.height === 0);
};

/**
 * Determines if the element is outside the viewport.
 * @returns {OutOfViewPort} An object indicating which sides are out of the viewport.
 */
HTMLElement.prototype.OutOfViewport = function () {
    const bounding = this.getBoundingClientRect();
    const outOfViewPort = new OutOfViewPort();
    outOfViewPort.Top = bounding.top < 0;
    outOfViewPort.Left = bounding.left < 0;
    outOfViewPort.Bottom = bounding.bottom > window.innerHeight;
    outOfViewPort.Right = bounding.right > window.innerWidth;
    outOfViewPort.Any = outOfViewPort.Top || outOfViewPort.Left || outOfViewPort.Bottom || outOfViewPort.Right;
    outOfViewPort.All = outOfViewPort.Top && outOfViewPort.Left && outOfViewPort.Bottom && outOfViewPort.Right;
    return outOfViewPort;
};

/** 
* @param {(value: Element, index: number, array: Element[]) => void} callback 
*/
HTMLCollection.prototype.forEach = function (callback) {
    Array.from(this).forEach(callback);
};