import { Button } from '../button';
import { Component } from '../models/component';
import { Spinner } from '../spinner';

jest.mock('../spinner', () => ({
    __esModule: true,
    Spinner: {
        AppendTo: jest.fn(),
        Hide: jest.fn(),
    },
}));

describe('Button', () => {
    /** @type {Component} */
    let ui;
    /** @type {HTMLDivElement} */
    let element;

    beforeEach(() => {
        ui = { Id: '123', FieldName: 'btnSave', ClassName: 'btn-class', Style: 'color: red;', Icon: 'icon-path', Label: 'Click me', Events: {} };
        element = document.createElement('div');
        document.body.appendChild(element);
    });

    afterEach(() => {
        document.body.removeChild(element);
        jest.clearAllMocks();
    });

    test('should throw error if ui is not provided', () => {
        expect(() => new Button(null)).toThrow("ui is required");
    });

    test('DispatchClick should handle disabled state and call events', async () => {
        const button = new Button(ui, element);
        button.Render();
        button.Disabled = false;

        const mockDispatchEvent = jest.fn().mockResolvedValue();
        button.DispatchEvent = mockDispatchEvent;

        await button.DispatchClick();

        expect(Spinner.AppendTo).toHaveBeenCalledWith(element);
        expect(mockDispatchEvent).toHaveBeenCalledWith(ui.Events, "click", button.Entity, button);
        expect(Spinner.Hide).toHaveBeenCalled();
    });

    test('GetValueText should return textContent of _textEle if Entity or Meta is null', () => {
        const button = new Button(ui, element);
        button.Entity = { btnSave: "Some text" };

        expect(button.GetValueText()).toEqual("Some text");
    });

    test('should render the button with correct properties', () => {
        const button = new Button(ui, element);
        button.Render();
    
        expect(button.Element).toBe(element);
        expect(button.Element.className).toContain('btn-class');
        expect(button.Element.style.color).toBe('red');
        expect(button.Element.querySelector('.caption').textContent).toBe('Click me');
    });

    test('DispatchClick should not proceed if button is disabled', async () => {
        const button = new Button(ui, element);
        button.Render();
        button.Disabled = true;
    
        const mockDispatchEvent = jest.fn().mockResolvedValue();
        button.DispatchEvent = mockDispatchEvent;
    
        await button.DispatchClick();
    
        expect(Spinner.AppendTo).not.toHaveBeenCalled();
        expect(mockDispatchEvent).not.toHaveBeenCalled();
        expect(Spinner.Hide).not.toHaveBeenCalled();
    });
});
