import { Component } from '../models/component';
import { Checkbox } from '../checkbox'; // Adjust the import according to your project structure
import { ComponentType } from '../models/componentType';
import { ElementType } from '../models/elementType.js';

describe('Checkbox', () => {
    /** @type {Checkbox} */
    let checkbox;
    /** @type {HTMLInputElement} */
    let mockElement;
    /** @type {Component} */
    let mockMeta;

    beforeEach(() => {
        mockElement = document.createElement(ElementType.input);
        mockElement.type = 'checkbox'
        mockMeta = { Editable: true, Events: [], FieldName: 'testField' };
        checkbox = new Checkbox(mockMeta, mockElement);
    });

    test('constructor should initialize properties correctly', () => {
        expect(checkbox.Meta).toBe(mockMeta);
        expect(checkbox.DefaultValue).toBe(false);
        expect(checkbox._value).toBeNull();
        expect(checkbox._input).toBe(mockElement);
    });

    test('Render should create input element and bind events', () => {
    checkbox.Render();
    expect(checkbox._input).toBeDefined();
    expect(checkbox.Element === checkbox._input || checkbox.Element === checkbox._input.parentElement).toBe(true);
    expect(checkbox._input.type).toBe('checkbox');
});

    test('UserChange should prevent default if disabled', () => {
        const mockEvent = { preventDefault: jest.fn() };
        checkbox.Disabled = true;
        checkbox.UserChange(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('UserChange should update value and trigger DataChanged', () => {
        checkbox.Render();
        const spyDataChanged = jest.spyOn(checkbox, 'DataChanged');
        checkbox._input.checked = true;
        const mockEvent = new Event('input');
        checkbox.UserChange(mockEvent);
        expect(spyDataChanged).toHaveBeenCalledWith(true);
        expect(checkbox._value).toBe(true);
    });

    test('DataChanged should set new value and mark as dirty', () => {
        checkbox.Render();
        checkbox.DataChanged(true);
        expect(checkbox._value).toBe(true);
        expect(checkbox.Dirty).toBe(true);
    });

    test('SetDisableUI should disable or enable the input element based on argument', () => {
        checkbox.Render();
        checkbox.SetDisableUI(true);
        expect(checkbox._input.disabled).toBe(true);
        checkbox.SetDisableUI(false);
        expect(checkbox._input.disabled).toBe(false);
    });

    test('UpdateView should refresh the value from the entity', () => {
        checkbox.Entity[checkbox.Name] = true;
        //checkbox.Render();
        checkbox.UpdateView();
        expect(checkbox._input.checked).toBe(true);
    });
});

