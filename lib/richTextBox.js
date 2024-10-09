import { EditableComponent } from "./editableComponent";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
import { Utils } from "./utils/utils.js";
import tinymce, { Editor } from "tinymce";
import { Uuid7 } from "./structs/uuidv7.js";
import { Image } from "./image.js";
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
        var self = this;
        this.SetDefaultVal();
        this.quill = (await tinymce.init({
            selector: '#' + this.Element.id,
            plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'wordcount'
            ],
            content_css: '/custom.css',
            invalid_styles: {
                'table': 'width height',
                'tr': 'width height',
                'th': 'width height',
                'td': 'width height'
            },
            toolbar: 'undo redo | blocks | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
            content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }',
            images_upload_handler: self.ImageHandler.bind(self),
            height: this.Meta.Precision || 250,
            setup: function (editor) {
                self.quill = editor;
                editor.on('init', function () {
                    editor.setContent(self.Entity[self.Meta.FieldName] || '');
                });
                editor.on('Change', function (e) {
                    self.Entity[self.Meta.FieldName] = editor.getContent();
                    self.Dirty = true;
                });
            }
        }))[0];
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
        if (!this.Dirty) {
            this.OriginalText = new DOMParser().parseFromString(this.quill.getContent(), 'text/html').body.textContent;;
            this.DOMContentLoaded?.Invoke();
            this.OldValue = new DOMParser().parseFromString(this.quill.getContent(), 'text/html').body.textContent;;
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