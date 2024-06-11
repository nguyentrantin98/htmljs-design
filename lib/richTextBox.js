import EditableComponent from "./editableComponent";
import { Html } from "./utils/html.js";
import ObservableArgs from './models/observable.js';
import { Uuid7 } from "./structs/uuidv7.js";
import { Component } from "./models/component.js";
import { Utils } from "./utils/utils";
import { Client } from "./clients/client";

export class RichTextBox extends EditableComponent {
     /**
     * @param {Component} ui
     * @param {HTMLElement} [ele=null] 
     */
    constructor(ui, ele = null) {
        super(ui,ele);
        this.defaultValue = "";
        if (this.Meta.Row <= 0) {
                this.Meta.Row = 1;
        }
        if (ele != null)
            {
                this.ParentElement = ele ; 
                this.BindingWebComponent();
            }
            else
            {
                this.ParentElement = this.ParentElement ?? Html.Context;
                this.BindingWebComponent();
            }
        
            this.ParentElement.appendChild(this.Element);
    }

    BindingWebComponent() {
        this.Element = Html.Take(this.ParentElement).Div.Id(Uuid7.Id25()).GetContext();
    }

    Render() {
        Client.LoadScript('https://cdn.ckeditor.com/ckeditor5/41.0.0/super-build/ckeditor.js?v=3.5.1')
        .then(() => {
            this.initCkEditor();
        });
    }

    initCkEditor() {
        // @ts-ignore
        if (typeof (CKEDITOR) === 'undefined') return;
        // @ts-ignore
        CKEDITOR.ClassicEditor.create(this.Element, {
            toolbar: {
                items: [
                    'exportPDF', 'exportWord', '|',
                    'findAndReplace', 'selectAll', '|',
                    'heading', '|',
                    'bold', 'italic', 'strikethrough', 'underline', 'code', 'subscript', 'superscript', 'removeFormat', '|',
                    'bulletedList', 'numberedList', 'todoList', '|',
                    'outdent', 'indent', '|',
                    'undo', 'redo',
                    '-',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', 'highlight', '|',
                    'alignment', '|',
                    'link', 'uploadImage', 'blockQuote', 'insertTable', 'mediaEmbed', 'codeBlock', 'htmlEmbed', '|',
                    'specialCharacters', 'horizontalLine', 'pageBreak', '|',
                    'textPartLanguage', '|',
                    'sourceEditing'
                ],
                shouldNotGroupWhenFull: true
            },
            // Changing the language of the interface requires loading the language file using the <script> tag.
            // language: 'es',
            list: {
                properties: {
                    styles: true,
                    startIndex: true,
                    reversed: true
                }
            },
            // https://ckeditor.com/docs/ckeditor5/latest/features/headings.html#configuration
            heading: {
                options: [
                    { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                    { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                    { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                    { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                    { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                    { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                    { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
                ]
            },
            // https://ckeditor.com/docs/ckeditor5/latest/features/editor-placeholder.html#using-the-editor-configuration
            placeholder: 'Welcome to CKEditor 5!',
            // https://ckeditor.com/docs/ckeditor5/latest/features/font.html#configuring-the-font-family-feature
            fontFamily: {
                options: [
                    'default',
                    'Arial, Helvetica, sans-serif',
                    'Courier New, Courier, monospace',
                    'Georgia, serif',
                    'Lucida Sans Unicode, Lucida Grande, sans-serif',
                    'Tahoma, Geneva, sans-serif',
                    'Times New Roman, Times, serif',
                    'Trebuchet MS, Helvetica, sans-serif',
                    'Verdana, Geneva, sans-serif'
                ],
                supportAllValues: true
            },
            // https://ckeditor.com/docs/ckeditor5/latest/features/font.html#configuring-the-font-size-feature
            fontSize: {
                options: [10, 12, 14, 'default', 18, 20, 22],
                supportAllValues: true
            },
            // Be careful with the setting below. It instructs CKEditor to accept ALL HTML markup.
            // https://ckeditor.com/docs/ckeditor5/latest/features/general-html-support.html#enabling-all-html-features
            htmlSupport: {
                allow: [
                    {
                        name: /.*/,
                        attributes: true,
                        classes: true,
                        styles: true
                    }
                ]
            },
            // Be careful with enabling previews
            // https://ckeditor.com/docs/ckeditor5/latest/features/html-embed.html#content-previews
            htmlEmbed: {
                showPreviews: true
            },
            // https://ckeditor.com/docs/ckeditor5/latest/features/link.html#custom-link-attributes-decorators
            link: {
                decorators: {
                    addTargetToExternalLinks: true,
                    defaultProtocol: 'https://',
                    toggleDownloadable: {
                        mode: 'manual',
                        label: 'Downloadable',
                        attributes: {
                            download: 'file'
                        }
                    }
                }
            },
            // https://ckeditor.com/docs/ckeditor5/latest/features/mentions.html#configuration
            mention: {
                feeds: [
                    {
                        marker: '@',
                        feed: [
                            '@apple', '@bears', '@brownie', '@cake', '@cake', '@candy', '@canes', '@chocolate', '@cookie', '@cotton', '@cream',
                            '@cupcake', '@danish', '@donut', '@dragée', '@fruitcake', '@gingerbread', '@gummi', '@ice', '@jelly-o',
                            '@liquorice', '@macaroon', '@marzipan', '@oat', '@pie', '@plum', '@pudding', '@sesame', '@snaps', '@soufflé',
                            '@sugar', '@sweet', '@topping', '@wafer'
                        ],
                        minimumCharacters: 1
                    }
                ]
            },
            // The "superbuild" contains more premium features that require additional configuration, disable them below.
            // Do not turn them on unless you read the documentation and know how to configure them and setup the editor.
            removePlugins: [
                // These two are commercial, but you can try them out without registering to a trial.
                // 'ExportPdf',
                // 'ExportWord',
                'AIAssistant',
                'CKBox',
                'CKFinder',
                'EasyImage',
                // This sample uses the Base64UploadAdapter to handle image uploads as it requires no configuration.
                // https://ckeditor.com/docs/ckeditor5/latest/features/images/image-upload/base64-upload-adapter.html
                // Storing images as Base64 is usually a very bad idea.
                // Replace it on production website with other solutions:
                // https://ckeditor.com/docs/ckeditor5/latest/features/images/image-upload/image-upload.html
                // 'Base64UploadAdapter',
                'RealTimeCollaborativeComments',
                'RealTimeCollaborativeTrackChanges',
                'RealTimeCollaborativeRevisionHistory',
                'PresenceList',
                'Comments',
                'TrackChanges',
                'TrackChangesData',
                'RevisionHistory',
                'Pagination',
                'WProofreader',
                // Careful, with the Mathtype plugin CKEditor will not load when loading this sample
                // from a local file system (file://) - load this site via HTTP server if you enable MathType.
                'MathType',
                // The following features are part of the Productivity Pack and require additional license.
                'SlashCommand',
                'Template',
                'DocumentOutline',
                'FormatPainter',
                'TableOfContents',
                'PasteFromOfficeEnhanced',
                'CaseChange'
            ]
        }).then(editor => {
            editor.setData(this.FieldVal?.toString() ?? '');
            editor.model.document.on('change:data', () => {
                this.FieldVal = editor.getData();
                this.Dirty = true;
            });
            editor.plugins.get('FileRepository').createUploadAdapter = function (loader) {
                return new MyUploadAdapter(loader, editor);
            };
            this.addEventListener('UpdateView', () => {
                editor.setHtml(this.Entity == null ? null : this.FieldVal);
            });
        });
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        const handler = this._events["UpdateView"];
        if (handler) {
            const args = new ObservableArgs();
            args.Com = this;
            args.EvType = 'Change';
            handler(args);
        }
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