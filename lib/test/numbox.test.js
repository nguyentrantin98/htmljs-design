// Number.test.js

import { ComponentType } from '../models/componentType';
import { NumBox } from '../numbox'; // Adjust the import according to your file structure

describe('Number component', () => {
    /** @type {NumBox} */
    let number;
    /** @type {HTMLInputElement} */
    let mockInput;

    beforeEach(() => {
        mockInput = document.createElement(ComponentType.Input);
        mockInput.addEventListener = function(name, action) {
            mockInput.events = {};
            mockInput.events[name] = mockInput.events[name] || [];
            mockInput.events[name].push(action);
        };
        mockInput.trigger = function(name) {
            const actions = mockInput.events[name];
            actions.forEach(x => x.call(mockInput));
        }
        mockInput.type = 'tel';
        mockInput.addEventListener('input', () => {
            number.Value = mockInput.value;
        });
        number = new NumBox(mockInput, mockInput);
        number.Meta = { Precision: 2 }; // Assume some meta data for precision
        number.Entity = {
            SetComplexPropValue: jest.fn(),
        };
        number.PopulateFields = jest.fn();
        number.Dirty = false;
    });

    test('Setting non-null value updates input correctly', () => {
        number.Value = 123.456;
        expect(number.Value.toString()).toEqual('123.46');
        expect(mockInput.value).toBe('123.46');
    });

    test('Setting null value with nullable true', () => {
        number._nullable = true;
        number.Value = null;
        expect(number.Value).toBeNull();
        expect(mockInput.value).toBe('');
    });

    test('Setting null value with nullable false', () => {
        number._nullable = false;
        number.Value = null;
        expect(number.Value.toString()).toEqual('0');
        expect(mockInput.value).toBe('0.00');
    });

    test('Setting value triggers PopulateFields', () => {
        number.Value = 100;
        expect(number.PopulateFields).toHaveBeenCalled();
    });

    test('Input event sets value correctly', () => {
        mockInput.value = "1234.56";
        mockInput.trigger('input');
        expect(number.Value.toString()).toEqual('1234.56');
    });

    test('Change event sets value correctly', () => {
        mockInput.value = "789.01";
        mockInput.trigger('input');
        expect(number.Value.toString()).toEqual('789.01');
    });

    test('Invalid decimal input resets to old value', () => {
        number.Value = 500;
        number._nullable = false;
        mockInput.value = "invalid text";
        mockInput.trigger('input');
        expect(number.Value.toString()).toEqual('500');
    });

    test('Value rounding respects Meta precision', () => {
        number.Value = 123.4567;
        expect(mockInput.value).toBe('123.46');
    });

    test('Value setter handles decimal separator properly', () => {
        number._decimalSeparator = ',';
        mockInput.value = "1234,";
        number.Value = 1234;
        expect(mockInput.value).toBe('1234.00');
    });

    test('Non-nullable value set to null defaults to zero', () => {
        number._nullable = false;
        number.Value = null;
        expect(number.Value.toString()).toBe('0');
    });

    test('Nullable value set to null stays null', () => {
        number._nullable = true;
        number.Value = null;
        expect(number.Value).toBeNull();
    });

    test('Setting value triggers Entity property update', () => {
        number.Value = 888;
        expect(number.Entity.SetComplexPropValue).toHaveBeenCalledWith(number.Name, '888');
    });

    test('Setting value to same does not mark as dirty', () => {
        number.Value = 100;
        number.Dirty = false; // Reset dirty
        number.Value = 100;
        expect(number.Dirty).toBe(false);
    });

    test('Setting different value marks component as dirty', () => {
        number.Value = 100;
        number.Value = 101;
        expect(number.Dirty).toBe(true);
    });

    test('Triggering input event without change keeps value', () => {
        number.Value = 250;
        mockInput.value = "250";
        mockInput.trigger('input');
        expect(number.Value.toString()).toEqual('250');
    });
});

