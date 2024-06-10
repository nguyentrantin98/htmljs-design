import { Datepicker } from "../datepicker.js";
import { Component } from "../models/component.js";
import { Numbox } from "../numbox.js";
import { Textbox } from "../textbox.js";
import { Checkbox } from "../checkbox.js";
import { Image } from "../image.js";
import { Button } from "../button.js";
import { Utils } from "./utils.js";
import { GridView } from "../gridView.js";
import { SearchEntry } from "../searchEntry.js";
import { CodeEditor } from "../codeEditor.js";

/**
 * Factory class for creating UI components based on specific configurations.
 */
export class ComponentFactory {
    /**
     * @typedef {import('../editableComponent.js').default} EditableComponent
     * @typedef {import('../editForm.js').EditForm} EditForm
     * Creates a component based on the UI configuration and edit form context.
     * @param {Component} ui - The UI configuration for the component.
     * @param {EditForm} form - The form in which the component will be used.
     * @param {HTMLElement} [ele=null] - Optional HTML element to associate with the component.
     * @returns {EditableComponent} The created component instance or null if the type is not specified.
     */
    static GetComponent(ui, form, ele = null, canWrite = false) {
        if (ui === null) {
            throw new Error('ui is required');
        }

        if (!ui.ComponentType) {
            return null;
        }

        ui.ComponentType = ui.ComponentType.trim();
        /** @type {EditableComponent} */
        let childComponent;
        const fullName = ui.ComponentType;
        switch (fullName) {
            case "Input":
                childComponent = new Textbox(ui, ele)
                break;
            case "Number":
                childComponent = new Numbox(ui, ele)
                break;
            case "Datepicker":
                childComponent = new Datepicker(ui, ele)
                break;
            case "Checkbox":
                childComponent = new Checkbox(ui, ele)
                break;
            case "FileUpload":
                childComponent = new Image(ui, ele)
                break;
            case "Button":
                childComponent = new Button(ui, ele)
                break;
            case "GridView":
                childComponent = new GridView(ui, ele)
                break;
            case "Dropdown":
                childComponent = new SearchEntry(ui, ele)
                break;
            case "CodeEditor":
                childComponent = new CodeEditor(ui, ele)
                break;
            default:
                childComponent = new Textbox(ui, ele)
                break;
        }
        childComponent.CanWrite = canWrite;
        childComponent[Utils.IdField] = `${ui.Id.toString()}`;
        childComponent.Name = ui.FieldName;
        childComponent.ComponentType = ui.ComponentType;
        childComponent.EditForm = form;
        return childComponent;
    }
}
