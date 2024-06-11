import { Datepicker } from '../datepicker'; // Adjust the path according to your project structure
import { Component } from '../models/component';
import * as a from '../utils/ext.js';

describe('Datepicker', () => {
    /** @type {Datepicker} */
    let datepicker;
    /** @type {HTMLDivElement} */
    let container;
    /** @type {Component} */
    let meta;

    beforeEach(() => {
        document.body.innerHTML = `<div id="test-container"></div>`;
        container = document.getElementById('test-container');
        meta = { FormatData: '', Precision: 7, FormatEntity: (/** @type {Date} */ val) => { 
            var month = val.getMonth() + 1;
            var day = val.getDate();
            return `${day.leadingDigit()}/${month.leadingDigit()}/${val.getFullYear()}`} 
        };
        datepicker = new Datepicker(meta, container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('should instantiate correctly with default values', () => {
        expect(datepicker).toBeDefined();
        expect(datepicker.Value).toBeNull();
        expect(datepicker.Disabled).toBeFalsy();
    });

    test('should render input element within the container', () => {
        datepicker.Render();
        expect(container.querySelector('input') != null).toBe(true);
    });

    test('should set value correctly', () => {
        const testDate = new Date(2023, 3, 26); // April 26, 2023
        datepicker.Value = testDate;
        expect(datepicker.Value).toEqual(testDate);
        expect(datepicker.Input.value).toBe('26/04/2023');
    });

    test('should handle disabled state correctly', () => {
        datepicker.Render();
        datepicker.Disabled = true;
        expect(datepicker.Element.readonly).toBeTruthy();
    });

    test('should remove DOM elements when RemoveDOM is called', () => {
        datepicker.Render();
        datepicker.Dispose();
        expect(container.children.length).toBe(0);
    });

    // Additional tests can include user interaction simulations, time adjustments, etc.
});
