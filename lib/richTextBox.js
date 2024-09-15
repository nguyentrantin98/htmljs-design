import { EditableComponent } from "./editableComponent";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
import Quill from "quill";
import 'quill/dist/quill.snow.css';
import QuillTableBetter from "quill-table-better";
import 'quill-table-better/dist/quill-table-better.css'
import { htmlEditButton } from "quill-html-edit-button";
import { Utils } from "./utils/utils.js";
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
        Html.Take(this.ParentElement).Div.Style(this.Meta.Style);
        this.Element = Html.Context;
    }

    Render() {
        this.initCkEditor();
    }
    /**
     * @type {Quill}
     */
    quill;
    initCkEditor() {
        Quill.register({
            'modules/table-better': QuillTableBetter
        }, true);
        Quill.register("modules/htmlEditButton", htmlEditButton);
        const Block = Quill.import('blots/block');
        Block.tagName = 'DIV';
        Quill.register(Block, true);
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],
            ['link', 'image', 'video', 'formula'],

            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction

            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'font': [] }],
            [{ 'align': [] }],

            ['clean'],                                        // remove formatting button
            ['table-better']
        ];
        var seft = this;
        this.quill = new Quill(this.Element, {
            theme: 'snow',
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: this.ImageHandler  // Attach your custom handler
                    },
                    table: false,
                },
                'table-better': {
                    toolbarTable: true
                },
                keyboard: {
                    bindings: QuillTableBetter.keyboardBindings
                },
                clipboard: {
                    matchers: [
                        ['P', (node, delta) => {
                            delta.ops.forEach(op => {
                                if (op.insert && typeof op.insert === 'string') {
                                    op.insert = op.insert.replace(/\n$/, '');
                                }
                            });
                            return delta;
                        }]
                    ]
                },
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

    ImageHandler() {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');  // Allow only image files
        input.setAttribute('multiple', 'true');   // Allow multiple file selection
        input.click();

        input.onchange = async () => {
            const files = input.files;
            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    try {
                        const imageUrl = await Client.Instance.PostFilesAsync(file, Utils.FileSvc);
                        const range = this.quill.getSelection();
                        this.quill.insertEmbed(range.index, 'image', imageUrl);
                    } catch (error) {
                        console.error('Error uploading image:', error);
                    }
                }
            }
        };
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