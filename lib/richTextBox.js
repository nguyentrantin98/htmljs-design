import { EditableComponent } from "./editableComponent";
import { Html } from "./utils/html.js";
import ObservableArgs from './models/observable.js';
import { Uuid7 } from "./structs/uuidv7.js";
import { Component } from "./models/component.js";
import { Utils } from "./utils/utils";
import { Client } from "./clients/client";
import Quill from "quill";
import 'quill/dist/quill.snow.css';

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
                toolbar: toolbarOptions
            },
            placeholder: this.Meta.PlainText,
        });
        this.SetDefaultVal();
        this.quill.clipboard.dangerouslyPasteHTML(this.Entity[this.Meta.FieldName] || "");
        this.quill.on('text-change', function (delta, oldDelta, source) {
            seft.FieldVal = seft.quill.root.innerHTML;
            seft.Dirty = true;
        });
    }
    UpdateView(force = false, dirty = null, ...componentNames) {
    }
}

class MyUploadAdapter {
    /**
     * @param {any} loader
     * @param {any} editor
     */
    constructor(loader, editor) {
        this.loader = loader;
        this.editor = editor;
    }

    upload() {
        return this.loader.file
            .then((/** @type {File} */ file) => new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    this._sendRequest(reader.result, file, resolve, reject);
                };

                reader.readAsDataURL(file);
            }));
    };

    /**
     * @param {string | ArrayBuffer} base64
     * @param {File} file
     * @param {{ (value: any): void; (arg0: { default: any; }): void; }} resolve
     * @param {{ (reason?: any): void; (arg0: any): void; }} reject
     */
    async _sendRequest(base64, file, resolve, reject) {
        try {
            let path = await Utils.UploadBase64Image(base64.toString(), file.name);
            resolve({ default: path });
        } catch (error) {
            reject(error);
        }
    }
}