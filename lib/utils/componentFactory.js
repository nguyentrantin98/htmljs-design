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
import { Str } from "./ext.js";
import { RichTextBox } from "../richTextBox.js";
import { Chart } from "../chart.js";
import { HtmlCode } from "../htmlCode.js";
import { GroupGridView } from "../groupGridView.js";
import { Label } from "../label.js";
import { MultipleSearchEntry } from "../multipleSearchEntry.js";
import { Chat } from "../chat.js";
import { Select } from "../select.js";
import { ButtonPdf } from "../buttonPdf.js";
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

        if (typeof ui.ComponentType === Str.Type) {
            ui.ComponentType = ui.ComponentType.trim();
        }
        /** @type {EditableComponent} */
        let child;
        const fullName = ui.ComponentType;
        switch (fullName) {
            case "Input":
            case "Textarea":
                child = new Textbox(ui, ele)
                break;
            case "Number":
                child = new Numbox(ui, ele)
                break;
            case "Label":
                child = new Label(ui, ele)
                break;
            case "Select":
                child = new Select(ui, ele)
                break;
            case "Datepicker":
                child = new Datepicker(ui, ele)
                break;
            case "Checkbox":
                child = new Checkbox(ui, ele)
                break;
            case "FileUpload":
                child = new Image(ui, ele)
                break;
            case "Button":
                child = new Button(ui, ele)
                break;
            case "GridView":
                if (Utils.isNullOrWhiteSpace(ui.GroupBy)) {
                    child = new GridView(ui, ele)
                }
                else {
                    child = new GroupGridView(ui, ele)
                }
                break;
            case "Dropdown":
                if (ui.IsMultiple) {
                    child = new MultipleSearchEntry(ui, ele)
                }
                else {
                    child = new SearchEntry(ui, ele)
                }
                break;
            case "CodeEditor":
                child = new CodeEditor(ui, ele)
                break;
            case "Word":
                child = new RichTextBox(ui, ele)
                break;
            case "Chart":
                child = new Chart(ui, ele)
                break;
            case "HtmlCode":
                child = new HtmlCode(ui, ele)
                break;
            case "Chat":
                child = new Chat(ui, ele)
                break;
            case "Pdf":
                child = new ButtonPdf(ui, ele)
                break;
            default:
                if (ui.ComponentType instanceof Function) {
                    child = ui.ComponentType.call(ui);
                }
                else {
                    child = new Textbox(ui, ele)
                }
                break;
        }
        child.Id = Utils.isNullOrWhiteSpace(ui.Id) ? ui.FieldName : (ui.Id + ui.FieldName);
        child.Name = ui.FieldName;
        child.ComponentType = ui.ComponentType;
        child.EditForm = form;
        return child;
    }
}
