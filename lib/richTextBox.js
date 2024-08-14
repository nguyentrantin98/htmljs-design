import { EditableComponent } from "./editableComponent";
import { Html } from "./utils/html.js";
import { Component } from "./models/component.js";
import { Utils } from "./utils/utils";
import { Client } from "./clients/client";
import Quill from "quill";
import 'quill/dist/quill.snow.css';
import { htmlEditButton } from "quill-html-edit-button";
Quill.register("modules/htmlEditButton", htmlEditButton);
export class RichTextBox extends EditableComponent {
    /**
    * @param {Component} ui
    * @param {HTMLElement} [ele=null] 
    */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.defaultValue = "";
        if (this.Meta.Row <= 0) {
            this.Meta.Row = 1;
        }
        if (ele != null) {
            this.ParentElement = ele;
            this.BindingWebComponent();
        }
        else {
            this.ParentElement = this.ParentElement ?? Html.Context;
            this.BindingWebComponent();
        }
        this.ParentElement.appendChild(this.Element);
    }

    BindingWebComponent() {
        this.Element = Html.Take(this.ParentElement).Div.Style(this.Meta.Style).GetContext();
    }

    Render() {
        Client.LoadScript('https://cdn.ckeditor.com/ckeditor5/41.0.0/super-build/ckeditor.js?v=3.5.1')
            .then(() => {
                this.initCkEditor();
            });
    }
    /**
     * @type {Quill}
     */
    quill;
    initCkEditor() {
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            ['link', 'image', 'video', 'formula'],

            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],

            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean']
        ];
        var seft = this;
        this.quill = new Quill(this.Element, {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions,
                htmlEditButton: {
                    msg: "Edit the content in HTML format",
                    okText: "Apply",
                    cancelText: "Cancel",
                    buttonHTML: "<>",
                    buttonTitle: "Show HTML source",
                    syntax: false,
                    prependSelector: "#tab-content",
                    editorModules: {}
                }
            },
            placeholder: this.Meta.PlainText,
        });
        this.SetDefaultVal();
        this.quill.clipboard.dangerouslyPasteHTML(this.Entity[this.Meta.FieldName] || "");
        this.OriginalText = this.quill.getText();
        this.SetDisableUI(this.Disabled);
        this.quill.on('text-change', function (delta, oldDelta, source) {
            if (seft.FieldVal != seft.quill.root.innerHTML) {
                seft.Dirty = true;
            }
            seft.FieldVal = seft.quill.root.innerHTML;
        });
    }

    GetValueText() {
        return this.quill.getText();
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        if (!this.Dirty) {
            this.OriginalText = this.quill.getText();
            this.DOMContentLoaded?.Invoke();
            this.OldValue = this.quill.getText();
        }
    }

    /**
     * @param {boolean} [disabled]
     */
    SetDisableUI(disabled) {
        if (!this.quill) {
            return;
        }
        if (disabled) {
            this.quill.enable(false);
        }
        else {
            this.quill.enable(true);
        }
    }
}