import { OutOfViewPort } from "./utils/outOfViewPort.js";
import { Entity } from "models/enum.js";
declare global {
  interface Array<T> {
    Any(predicate?: (item: T) => boolean): boolean;
    Contains(item: T): boolean;
    /**
     * @returns {Array<T>} the array itself
     */
    ToArray(): Array<T>;
    /**
     * @template T, K
     * @param {Function<T, K>} mapper - The map function
     * @returns {Array<K>} return the mappped array
     */
    Select(mapper: (item: T, index: Number) => K): Array<K>;
    /**
     * @param filter The function to filter elements
     * @returns {T[]} Returns filtered array
     */
    Where(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): T[];
    /**
     * @template T, K
     * @param {(item: T) => K[]} mapper The function to get inner collection from each element
     * @returns {Array<K>} Returns flattened array
     */
    SelectMany(mapper: (item: T) => K[]): Array<K>;
    /**
     * @template T, K
     * @param {(item: T) => K} mapper The function to get inner collection from each element
     * @returns {Array<K>} Returns flattened array
     */
    SelectForEach(mapper: Function<T, K[]>): Array<K>;
    HasElement(): boolean;
    Nothing(): boolean;
    Remove(item: T): void;
    /**
     * @param {(value: T) => K[]} getChildren - Mapper method to get inner property
     * @returns {Array<K>} The flatterned array
     */
    Flattern(getChildren: (value: T) => K[], thisArg?: any): T[];
    /**
     * @template T, K, L
     * @param keySelector 
     * @param {(item: T) => L} valueSelector 
     * @return {{ [key: K] : L}}
     */
    ToDictionary(keySelector: (item: T) => K, valueSelector: (item: T) => L): { [key: K]: L };

    /**
   * Returns the first element of the array that satisfies the specified condition, or an empty array if no such element is found.
   * @param filter - A function that tests each element for a condition.
   * @returns The first element of the array that passes the test implemented by the provided function, or an empty array if no element passes the test.
   */
    FirstOrDefault(filter: (item: T, index: number) => boolean = null): T;

    /**
     * Grouping array similar to Linq GroupBy
     * @param keySelector - The key selector
     */
    GroupBy(keySelector: (item: T) => K): [][];
    DistinctBy(keySelector: (item: T) => K): T[];
    Distinct(): T[];
    /**
     * Performs the specified action for each element in an array.
     * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array.
     * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
     */
    ForEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
    ForEachAsync(promise: (item: T) => Promise): Promise<T[]>;
    /**
     * Combine items into string
     * @param mapper 
     * @param joinner 
     */
    Combine(mapper: (item: T) => string, separator: string = ','): string;
    Clear(): void;
    AddRange(...items: T[]): void;
    OrderBy(keySelector: (item: T) => K, keySelector2: (item: T) => K = null, asc1: boolean = true, asc2: boolean = true): T[];
    All(keySelector: (item: T) => boolean): boolean;
    IndexOf(keySelector: (item: T) => K): number;
    LastOrDefault(predicate: (item: T) => boolean = null): K;
  }

  interface String {
    DecodeSpecialChar(): string;
  }

  interface Promise<T> {
    Done(onSuccess: (value: T) => void = null, onError: (error: any) => void = null): Promise<T>;
    done(onSuccess: (value: T) => void = null, onError: (error: any) => void = null): Promise<T>;
  }

  interface Object {
    Clear(): void;
    Nothing(): boolean;
    CopyPropFrom(obj: Object): void;
    GetComplexProp(path: string): any;
    SetComplexPropValue(path: string, val: any): void;
    SetPropValue(path: string, val: any): void;
    ToEntity(): Entity[];
    GetFieldNameByVal(val: any): string;
  }

  interface Date {
    addSeconds(seconds: Number): Date;
    addMinutes(seconds: Number): Date;
    addHours(seconds: Number): Date;
    addDays(days: Number): Date;
    addMonths(months: Number): Date;
    addYears(years: Number): Date;
    format(str: string): string;
  }

  interface HTMLElement {
    ToggleClass(cls: String): void;
    AddClass(cls: String): void;
    RemoveClass(cls: String): void;
    HasClass(cls: string): boolean;
    ReplaceClass(cls: string, byCls: string): void;
    /**
       * Finds the closest parent that matches the given selector.
       * @param selector CSS selector to match parents against.
       * @returns The closest matching element or null if none found.
       */
    Closest(selector: string): HTMLElement | null;

    /**
     * Inserts a node at the beginning of the current element.
     * @param child Element to prepend.
     */
    Prepend(child: HTMLElement): void;

    /**
     * Calculates the full height of an element, including margins.
     * @returns The total height in pixels.
     */
    GetFullHeight(): number;

    /**
     * Sets the display style to empty, effectively showing the element.
     */
    Show(): void;

    /**
     * Gets the computed style of the element.
     * @returns The computed style of the element.
     */
    GetComputedStyle(): CSSStyleDeclaration;

    /**
     * Sets the display style to 'none', hiding the element.
     */
    Hide(): void;

    /**
     * Checks if the element is hidden.
     * @returns True if the element is hidden; otherwise, false.
     */
    Hidden(): boolean;

    /**
     * Determines if the element is outside the viewport.
     * @returns An object indicating which sides are out of the viewport.
     */
    OutOfViewport(): OutOfViewPort;
  }

  interface Number {
    leadingDigit(): string;
  }

  interface Event {
    /**
     * Gets the top position (Y-coordinate) of the event.
     * @returns The Y-coordinate as a number.
     */
    Top(): number;

    /**
     * Gets the left position (X-coordinate) of the event.
     * @returns The X-coordinate as a number.
     */
    Left(): number;

    /**
     * Gets the keyCode from the event, returning -1 if undefined.
     * @returns The keyCode as a number, or -1 if undefined.
     */
    KeyCode(): number;

    /**
     * Attempts to parse keyCode to an enum value.
     * @returns The parsed KeyCodeEnum value or null if parsing fails or keyCode is undefined.
     */
    KeyCodeEnum(): KeyCodeEnum | null;

    /**
     * Checks if the Shift key was pressed during the event.
     * @returns True if the Shift key was pressed, false otherwise.
     */
    ShiftKey(): boolean;

    /**
     * Detects if the user pressed the Ctrl or Command key while the event occurs.
     * @returns True if the Ctrl or Meta key was pressed, false otherwise.
     */
    CtrlOrMetaKey(): boolean;

    /**
     * Checks if the Alt key was pressed during the event.
     * @returns True if the Alt key was pressed, false otherwise.
     */
    AltKey(): boolean;

    /**
     * Gets the checked status from the target element of the event, assuming the target is a checkbox input element.
     * @returns True if the target element is checked, false otherwise.
     */
    GetChecked(): boolean;

    /**
     * Gets the input text from the target element of the event, assuming the target is an input element.
     * @returns The value of the input text if the target is an input element, an empty string otherwise.
     */
    GetInputText(): string;
  }

  interface HTMLCollection {
    /** 
     * @param {(value: Element, index: number, array: Element[]) => void} callback 
     */
    forEach(action: (item: Element, index: number, array: Element[]) => void): void;
  }

  interface Navigator {
    msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean;
}
}
