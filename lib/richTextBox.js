import { EditableComponent } from "./editableComponent";
import { Html } from "./utils/html.js";
import { Component } from "./models/component.js";
import tinymce, { Editor } from "tinymce";
import { Uuid7 } from "./structs/uuidv7.js";
import { Image } from "./image.js";
import EventType from "./models/eventType.js";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
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
        Html.Take(this.ParentElement).TextArea.Id("RE_" + Uuid7.Guid());
        this.Element = Html.Context;
    }

    Render() {
        this.initCkEditor().then();
    }
    /**
     * @type {Editor}
     */
    quill;
    async initCkEditor() {
        this.OldValue = this.Entity[this.Name];
        var self = this;
        this.SetDefaultVal();
        this.quill = (await tinymce.init({
            selector: '#' + this.Element.id,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'wordcount'
            ],
            content_css: ['https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap', '/custom.css?v=dhjsjdsjhdjshjdhsjdhjshjhj'],
            toolbar: 'undo redo | blocks | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
            font_size_formats: '8pt 9pt 10pt 11pt 12pt 13pt 14pt 15pt 16pt 17pt 18pt 24pt 36pt 48pt',
            contextmenu: "link image inserttable | table add-background-img gen-table-excel | tablename groupby classProp stylesProp | Viewpdf Viewhistory",
            images_upload_handler: self.ImageHandler.bind(self),
            height: this.Meta.Precision || 250,
            setup: function (editor) {
                self.quill = editor;
                editor.on('init', function () {
                    editor.getDoc().body.style.fontFamily = 'Montserrat';
                    editor.getDoc().body.style.fontSize = '10pt';
                    editor.setContent(self.Entity[self.Meta.FieldName] || '');
                });
                editor.on('Change', function (e) {
                    self.Entity[self.Meta.FieldName] = editor.getContent();
                    self.Dirty = true;
                });
                editor.ui.registry.addMenuItem('tablename', {
                    text: 'Table Name',
                    onAction: function () {
                        var selectedTr = editor.dom.getParent(editor.selection.getStart(), 'tbody');
                        if (selectedTr) {
                            var currentCustomData = editor.dom.getAttrib(selectedTr, 'data-table') || '';
                            editor.windowManager.open({
                                title: 'Table Name',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'input',
                                            name: 'customData',
                                            label: 'Table Name',
                                        }
                                    ]
                                },
                                initialData: {
                                    customData: currentCustomData // Thiết lập giá trị ban đầu cho input
                                },
                                buttons: [
                                    {
                                        type: 'submit',
                                        text: 'Save'
                                    },
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    }
                                ],
                                onSubmit: function (dialog) {
                                    var data = dialog.getData();
                                    editor.dom.setAttrib(selectedTr, 'data-table', data.customData);
                                    dialog.close();
                                }
                            });
                        } else {
                            editor.windowManager.alert('Please select a table row to set properties.');
                        }
                    }
                });
                editor.ui.registry.addMenuItem('groupby', {
                    text: 'Group by',
                    onAction: function () {
                        var selectedTr = editor.dom.getParent(editor.selection.getStart(), 'tbody');
                        if (selectedTr) {
                            var currentCustomData = editor.dom.getAttrib(selectedTr, 'data-group') || '';
                            editor.windowManager.open({
                                title: 'Group by',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'input',
                                            name: 'customData',
                                            label: 'Group by',
                                        }
                                    ]
                                },
                                initialData: {
                                    customData: currentCustomData // Thiết lập giá trị ban đầu cho input
                                },
                                buttons: [
                                    {
                                        type: 'submit',
                                        text: 'Save'
                                    },
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    }
                                ],
                                onSubmit: function (dialog) {
                                    var data = dialog.getData();
                                    editor.dom.setAttrib(selectedTr, 'data-group', data.customData);
                                    dialog.close();
                                }
                            });
                        } else {
                            editor.windowManager.alert('Please select a table row to set properties.');
                        }
                    }
                });
                editor.ui.registry.addMenuItem('classProp', {
                    text: 'Class Name',
                    onAction: function () {
                        var selectedTr = editor.dom.getParent(editor.selection.getStart(), 'table');
                        if (selectedTr) {
                            var currentCustomData = editor.dom.getAttrib(selectedTr, 'class') || '';
                            editor.windowManager.open({
                                title: 'Class Name',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'input',
                                            name: 'customData',
                                            label: 'Class Name',
                                        }
                                    ]
                                },
                                initialData: {
                                    customData: currentCustomData // Thiết lập giá trị ban đầu cho input
                                },
                                buttons: [
                                    {
                                        type: 'submit',
                                        text: 'Save'
                                    },
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    }
                                ],
                                onSubmit: function (dialog) {
                                    var data = dialog.getData();
                                    editor.dom.addClass(selectedTr, data.customData);
                                    dialog.close();
                                }
                            });
                        } else {
                            editor.windowManager.alert('Please select a table to set properties.');
                        }
                    }
                });
                editor.ui.registry.addMenuItem('stylesProp', {
                    text: 'Styles',
                    onAction: function () {
                        var selectedTr = editor.selection.getNode();
                        if (selectedTr) {
                            var currentCustomData = editor.dom.getAttrib(selectedTr, 'style') || '';
                            editor.windowManager.open({
                                title: 'Styles',
                                body: {
                                    type: 'panel',
                                    items: [
                                        {
                                            type: 'textarea',
                                            name: 'customData',
                                            label: 'CSS Styles',
                                            placeholder: 'e.g., color: red; background-color: yellow;'
                                        }
                                    ]
                                },
                                initialData: {
                                    customData: currentCustomData // Thiết lập giá trị ban đầu cho input
                                },
                                buttons: [
                                    {
                                        type: 'submit',
                                        text: 'Save'
                                    },
                                    {
                                        type: 'cancel',
                                        text: 'Close'
                                    }
                                ],
                                onSubmit: function (dialog) {
                                    var data = dialog.getData();
                                    editor.dom.setAttrib(selectedTr, 'style', data.customData);
                                    dialog.close();
                                }
                            });
                        } else {
                            editor.windowManager.alert('Please select a table to set properties.');
                        }
                    }
                });
                editor.ui.registry.addMenuItem('add-background-img', {
                    text: 'Background Image',
                    onAction: function () {
                        editor.windowManager.open({
                            title: 'Upload and Set Background Image',
                            body: {
                                type: 'panel',
                                items: [
                                    {
                                        type: 'htmlpanel',
                                        html: `
                                            <input type="file" id="background-img-upload" accept="image/*" style="margin-top: 10px;" />
                                        `
                                    }
                                ]
                            },
                            buttons: [
                                {
                                    type: 'submit',
                                    text: 'Apply'
                                },
                                {
                                    type: 'cancel',
                                    text: 'Cancel'
                                }
                            ],
                            onSubmit: function (dialog) {
                                const fileInput = document.getElementById('background-img-upload');
                                const file = fileInput.files[0];
                                if (file) {
                                    const blobInfo = {
                                        blob: () => file
                                    };

                                    self.ImageHandler(
                                        blobInfo,
                                        function success(path) {
                                            const tableNode = editor.dom.getParent(editor.selection.getStart(), 'table');
                                            let wrapperDiv = tableNode.parentNode;
                                            if (wrapperDiv.tagName.toLowerCase() !== 'div') {
                                                wrapperDiv = document.createElement('div');
                                                tableNode.parentNode.insertBefore(wrapperDiv, tableNode);
                                                wrapperDiv.appendChild(tableNode);
                                            }
                                            wrapperDiv.classList.add('a4');
                                            wrapperDiv.style.height = '1122px';
                                            wrapperDiv.style.backgroundImage = `url(${path})`;
                                            wrapperDiv.style.backgroundSize = 'cover';
                                            wrapperDiv.style.backgroundRepeat = 'no-repeat';
                                            wrapperDiv.style.backgroundPosition = 'center';
                                            wrapperDiv.style.display = "flex";
                                            dialog.close();
                                        },
                                        function failure(error) {
                                            console.error('Upload failed:', error);
                                            editor.windowManager.alert('Failed to upload image. Please try again.');
                                        }
                                    );
                                } else {
                                    editor.windowManager.alert('No file selected. Please choose an image to upload.');
                                }
                            }
                        });
                    }
                });
                editor.ui.registry.addMenuItem('gen-table-excel', {
                    text: 'Gen table excel',
                    onAction: function () {
                        const a4WidthPx = 793.7;
                        const a4HeightPx = 1088;
                        const columnWidthPx = 80;
                        const rowHeightPx = 17;
                        const columns = Math.floor(a4WidthPx / columnWidthPx);
                        const rows = Math.floor(a4HeightPx / rowHeightPx);
                        let tableHtml = `<table border="0" style="width:100%; border-collapse:collapse;height:${a4HeightPx}px;max-height:${a4HeightPx}px">`;
                        for (let r = 0; r < rows; r++) {
                            tableHtml += '<tr>';
                            for (let c = 0; c < columns; c++) {
                                tableHtml += '<td style="width:' + columnWidthPx + 'px; height:' + rowHeightPx + 'px;"><span>&nbsp;</span></td>';
                            }
                            tableHtml += '</tr>';
                        }
                        tableHtml += '</table>';
                        editor.insertContent(tableHtml);
                    }
                });
                editor.ui.registry.addMenuItem('Viewpdf', {
                    text: 'View PDF',
                    onAction: function () {
                        var btn = self.EditForm.OpenFrom.ChildCom.find(x => x.Meta.Id == self.Entity.Id);
                        btn.Element.click();
                    }
                });
                editor.ui.registry.addMenuItem('Viewhistory', {
                    text: 'View History',
                    onAction: function () {
                        self.RenderPopup();
                    }
                });
            }
        }))[0];
    }

    /**@type {HTMLElement} */
    _backdrop;
    /**@type {HTMLElement} */
    BodyElement;
    RenderPopup() {
        Html.Take(this.TabEditor.Element).Div.ClassName("backdrop").TabIndex(-1).Trigger(EventType.Focus);
        this._backdrop = Html.Context;
        Html.Instance.Div.ClassName("popup-content").Div.ClassName("popup-title").Span.IText("History change");
        this.TitleElement = Html.Context;
        Html.Instance.End.Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event(EventType.Click, () => {
                this._backdrop.remove();
            }).End.End.End.Div.ClassName("popup-body").Div.ClassName("wrapper scroll-content");
        this.BodyElement = Html.Context;
        Html.Instance.End.Div.ClassName("popup-footer");
        if (this._backdrop.OutOfViewport().Top) {
            this._backdrop.scrollIntoView(true);
        }
        const res = {
            ComId: this.Meta.Id,
            Params: JSON.stringify(Utils.IsFunction(this.Meta.PreQuery, true, this)),
            OrderBy: (!this.Meta.OrderBy ? "ds.InsertedDate desc" : this.Meta.OrderBy),
            Count: false,
            Skip: 0,
            Top: 10,
        };
        Client.Instance.SubmitAsync({
            NoQueue: true,
            Url: `/api/feature/com`,
            Method: "POST",
            JsonData: JSON.stringify(res),
        }).then(data => {
            /**@type {[]} */
            var dataa = data.value;
            dataa.forEach(item => {
                Html.Take(this.BodyElement);
                Html.Instance.Div.Label.ClassName("header").Text(this.dayjs(item.InsertedDate).format("DD/MM/YYYY HH:mm")).End.Div.ClassName("diff-container").Style("height:250px");
                const modifiedModel = monaco.editor.createModel(
                    item.Value ?? ``,
                    this.Meta.Lang ?? 'javascript'
                );
                const originalModel = monaco.editor.createModel(
                    item.OldValue ?? ``,
                    this.Meta.Lang ?? 'javascript'
                );
                const diffEditor = monaco.editor.createDiffEditor(
                    Html.Context,
                    {
                        originalEditable: true,
                        automaticLayout: true,
                        reareadOnly: true
                    }
                );
                diffEditor.setModel({
                    original: originalModel,
                    modified: modifiedModel,
                });
            });
        });
    }
    /**
     * Handles the image upload process for TinyMCE editor.
     * 
     * This function takes the image selected by the user, uploads it to the server, 
     * and then provides the uploaded image's URL to TinyMCE to be embedded into the editor content.
     *
     * @param {BlobInfo} blobInfo - Object containing information about the image blob.
     * @param {Function} success - Callback function to call on a successful upload. Receives the uploaded image URL.
     * @param {Function} failure - Callback function to call on a failed upload. Receives an error message.
     */
    ImageHandler(blobInfo, success, failure) {
        const file = blobInfo.blob();
        try {
            const uploader = new Image({ Template: "image/*" });
            return uploader.UploadFile(file).then(path => {
                if (path) {
                    if (success) success(path);
                    return path;
                } else {
                    if (failure) failure('No path returned from upload');
                    return null;
                }
            }).catch(error => {
                console.error('Error during image upload:', error);
                if (failure) failure('Upload failed');
                return null;
            });
        } catch (error) {
            console.error('Error during image upload:', error);
            if (failure) failure('Upload failed');
            return null;
        }
    }

    GetValueText() {
        return new DOMParser().parseFromString(this.quill.getContent(), 'text/html').body.textContent;
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Value = this.Entity[this.Meta.FieldName];
        if (!this.Dirty) {
            this.OriginalText = this.Value;
            this.OldValue = this.Value;
        }
    }
    awaitTime;
    /**
     * @param {boolean} [disabled]
     */
    SetDisableUI(disabled) {
        this.awaitTime = window.clearTimeout(this.awaitTime);
        this.awaitTime = window.setTimeout(() => {
            if (!this.quill) {
                return;
            }
            if (disabled) {
                this.quill.readonly = true;
            }
            else {
                this.quill.readonly = false;
            }
        }, 500)
    }
}