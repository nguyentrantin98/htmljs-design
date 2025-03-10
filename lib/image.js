import { EditableComponent } from './editableComponent.js';
import { Utils } from "./utils/utils.js";
import EventType from './models/eventType.js';
import { Action } from "./models/action.js";
import { Component } from './models/component.js';
import { ConfirmDialog } from './confirmDialog.js';
import { Uuid7 } from './structs/uuidv7.js';
import { Spinner } from './spinner.js';
import { Client } from './clients/client.js';
import { Html } from './utils/html.js';

export class Image extends EditableComponent {
    static PathSeparator = "    ";
    static PNGUrlPrefix = "data:image/png;base64,";
    static JpegUrlPrefix = "data:image/jpeg;base64,";
    static GuidLength = 36;
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement } ele 
     */
    constructor(ui, el) {
        super(ui, el);
        this._path = '';
        /** @type {HTMLInputElement} */
        this._input = document.createElement('input');
        this._preview = null;
        this._disabledDelete = false;
        /** @type {HTMLDivElement} */
        this._gallerys = document.createElement('div');
        this.DataSource = this.Meta.Template || "image/*";
        this.DefaultValue = '';
        this.FileUploaded = new Action();
        this.zoomLevel = 0;
        this.flagZoomIn = 1;
        this.zoomMaxLevel = 3;
    }

    get Path() {
        return this._path;
    }

    set Path(value) {
        this._gallerys.innerHTML = '';
        this._path = value;
        if (this.Entity) {
            this.Entity[this.Name] = this._path;
        }

        if (!this._path || this._path.trim() === '') {
            return;
        }

        const updatedImages = this._path.split(Image.PathSeparator);
        if (!updatedImages || updatedImages.length === 0) {
            return;
        }

        updatedImages.forEach(x => {
            this.RenderFileThumb(x);
        });
    }

    get ImageSources() {
        return this.Path ? this.Path.split(Image.PathSeparator) : null;
    }

    Render() {
        this._path = this.Entity[this.Name] || null;
        this.RenderUploadForm();
        this.Path = this._path;
        this.DOMContentLoaded?.invoke();
        this.Element.closest("td")?.addEventListener("keydown", this.ListViewItemTab);
    }

    RenderFileThumb(path) {
        const gallery = document.createElement('div');
        gallery.className = "gallery";
        this._gallerys.appendChild(gallery);
        const thumbText = this.RemoveGuid(path);
        const isImage = Utils.IsImage(thumbText);
        var linkF = (path.includes("http") ? path : Client.api + "/" + Utils.DecodeSpecialChar(path));
        if (isImage) {
            const img = document.createElement('img');
            img.className = "image";
            Object.assign(img.style, this.Meta.ChildStyle);
            img.src = linkF;
            gallery.appendChild(img);
            img.addEventListener('click', () => this.PreviewImage(path));
        } else {
            const link = document.createElement('a');
            var icon = document.createElement('i');
            if (thumbText.includes(".pdf")) {
                icon.className = "fal fa-file-pdf mr-1";
                link.addEventListener("click", () => this.PreviewPDF(linkF));
            } else if (thumbText.includes(".xls") || thumbText.includes(".xlsx")) {
                icon.className = "fal fa-file-excel mr-1";
                link.addEventListener("click", () => this.DowloadPdf(linkF));
            }
            else if (thumbText.includes(".doc") || thumbText.includes(".docx")) {
                icon.className = "fal fa-file-word mr-1";
                link.addEventListener("click", () => this.PreviewOfficeFile(linkF));
            }
            else if (thumbText.includes(".txt")) {
                icon.className = "fal fa-file-alt mr-1";
                link.addEventListener("click", () => this.PreviewTextFile(linkF));
            } else {
                icon.className = "fal fa-file mr-1";
            }
            link.appendChild(icon);
            var span = document.createElement('span');
            span.textContent = thumbText;
            link.appendChild(span);
            gallery.appendChild(link);
        }

        if (!this.Disabled) {
            const deleteBtn = document.createElement('i');
            deleteBtn.className = "fas fa-trash-alt";
            deleteBtn.addEventListener('click', () => this.RemoveFile(path, thumbText));
            gallery.appendChild(deleteBtn);
        }

        return this._gallerys;
    }

    /**
    @type {HTMLIFrameElement}
    */
    IFrameElement
    /**
     */
    /**
    @type {HTMLElement}
    */
    DarkOverlay
    /**
     */
    openPopupIFrame(url, img) {
        var rotate = 0;
        var img2 = null;
        Html.Take(document.body).Div.ClassName("dark-overlay zoom");
        this.DarkOverlay = Html.Context;
        if (img) {
            Html.Instance.Img.Src(url);
            img2 = Html.Context;
            Html.Instance.End.Render();
            Html.Instance.Span.ClassName("close").Event(EventType.Click, () => {
                this.DarkOverlay.remove();
            }).I.ClassName("fa fa-times").End.End
                .Div.ClassName("toolbar")
                .Span.ClassName("icon fa fa-undo ro-left").Event(EventType.Click, () => {
                    rotate -= 90;
                    img2.style.transform = `rotate(${rotate}deg)`;
                }).End
                .Span.ClassName("icon fa fa-cloud-download-alt").Event(EventType.Click, () => this.DownloadFile()).End
                .Span.ClassName("icon fa fa-redo ro-right").Event(EventType.Click, () => {
                    rotate += 90;
                    img2.style.transform = `rotate(${rotate}deg)`;
                }).End.End.Render();
        }
        else {
            Html.Instance.Span.ClassName("close").Event(EventType.Click, () => {
                this.DarkOverlay.remove();
            }).I.ClassName("fa fa-times").End.End.Render();
            Html.Instance.Iframe.ClassName("container-rpt").Style("margin-top: 4rem; background: rgb(255, 255, 255); overflow: auto; min-height: calc(-4rem + 100vh); width: 100%;").Width("100%");
            this.IFrameElement = Html.Context;
            this.IFrameElement.src = url;
        }
    }

    DownloadFile() {
        var file = document.querySelector(".dark-overlay img");
        Client.Download(file.getAttribute("src"));
    }

    ClosePreview() {
        this.Preview.remove();
    }

    DowloadPdf(url) {
        Client.Download(url);
    }

    PreviewPDF(link) {
        this.openPopupIFrame(link);
    }

    PreviewImage(link) {
        this.openPopupIFrame(link, true);
    }

    PreviewOfficeFile(link) {
        this.openPopupIFrame(`https://docs.google.com/viewer?url=${encodeURIComponent(link)}&embedded=true`);
    }

    PreviewTextFile(link) {
        this.openPopupIFrame(link);
    }

    RemoveGuid(path) {
        let fileName = path.replace(/^.*[\\\/]/, '');
        const parts = fileName.split('-');
        let descriptivePart = '';
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].length === 8 && /^[0-9a-fA-F]{8}$/.test(parts[i])) {
                descriptivePart = parts.slice(0, i).join('-');
                break;
            }
        }
        const extension = fileName.split('.').pop();
        return `${descriptivePart}.${extension}`;
    }

    SetCanDeleteImage(canDelete) {
        this._disabledDelete = !canDelete;
        if (canDelete) {
            this.UpdateView();
        }
    }

    Preview(path) {
        this.openPopupIFrame(path);
    }

    RenderUploadForm() {
        const handler = this.UploadSelectedImages.bind(this);
        Html.Take(this.ParentElement).Div.ClassName("ms-upload")
            .Span
            .Div.ClassName("ms-img-upload")
            .Div.ClassName("ms-input-upload")
        Html.Instance.Div.ClassName("w-full-100").Span.ClassName("text-input far fa-cloud-upload").Input.Type("file").Attr("title", "").Attr("accept", "");
        if (this.Meta.IsMultiple) {
            Html.Instance.Attr("multiple", "multiple");
        }
        this.Element = this._input = Html.Context;
        this._input.accept = ".txt, .jpg, .jpeg, .png, .doc, .docx, .xls, .xlsx, .pdf";
        this.Element.addEventListener("drop", (e) => this.UploadDropImages(e));
        this.Element.addEventListener("change", handler);
        if (!this.CanWrite) {
            this._input.readOnly = true;
        }
        Html.Instance.End.End.Div.ClassName("img-upload");
        this._gallerys = Html.Context;
    }

    RemoveFile(removedPath, thumbText) {
        if (this.Disabled) {
            return;
        }
        if (!removedPath || removedPath.trim() === '') {
            return;
        }
        const message = `Do you want delete ${thumbText}`;
        const confirmDialog = new ConfirmDialog();
        confirmDialog.Title = message;
        confirmDialog.EditForm = this.EditForm;
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.Render();
        confirmDialog.YesConfirmed.add(() => {
            const oldVal = this._path;
            const newPath = this._path.replace(removedPath, Image.PathSeparator)
                .replace(Image.PathSeparator + Image.PathSeparator, Image.PathSeparator)
                .split(Image.PathSeparator).filter(x => x != null && x != "");
            this.Path = newPath.join(Image.PathSeparator);
            this.Dirty = true;
            const observable = { NewData: this._path, OldData: oldVal, FieldName: this.Name, EvType: EventType.Change };
            this.UserInput?.Invoke(observable);
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then();
        });
    }

    UploadSelectedImages(event) {
        event.preventDefault();
        if (this.EditForm.IsLock) {
            console.log("Edit form is locked.");
            return;
        }

        const files = event.target.files;
        if (!files.length) {
            console.log("No files selected.");
            return;
        }
        const oldVal = this._path;
        this.UploadAllFiles(files).then(() => {
            this.Dirty = true;
            this._input.value = '';
            const observable = { NewData: this._path, OldData: oldVal, FieldName: this.Name, EvType: EventType.Change };
            this.UserInput?.Invoke(observable);
            this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then();
        }).catch(error => {
            console.error("Failed to upload files:", error);
        });
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Path = this.Entity[this.Meta.FieldName];
        super.UpdateView(force, dirty, ...componentNames);
    }

    /**
     * @param {File} file
     */
    async UploadFile(file) {
        try {
            const path = await Client.Instance.PostFilesAsync(file, Utils.FileSvc);
            await Client.Instance.PatchAsync({
                Table: "FileUpload",
                Changes: [
                    { Field: "Id", Value: Uuid7.NewGuid() },
                    { Field: "EntityName", Value: this.Meta.RefName },
                    { Field: "RecordId", Value: this.EntityId },
                    { Field: "SectionId", Value: this.Meta.ComponentGroupId },
                    { Field: "FieldName", Value: this.Name },
                    { Field: "FileName", Value: file.name },
                    { Field: "FilePath", Value: path }
                ],
            });
            return path;
        } catch (error) {
            console.error("Error posting file:", error);
            throw error;
        }
    }

    /**
     * @param {Iterable<any> | ArrayLike<any>} filesSelected
     */
    async UploadAllFiles(filesSelected) {
        Spinner.AppendTo();
        const files = Array.from(filesSelected).map(this.UploadFile.bind(this));
        let allPath = await Promise.all(files);
        if (!allPath.length) {
            return;
        }
        if (this.Meta.IsMultiple) {
            if (Utils.isNullOrWhiteSpace(this.Path)) {
                allPath = [...new Set(allPath.join(Image.PathSeparator).trim().split(Image.PathSeparator))];
            }
            else {
                allPath = [...new Set((this.Path + Image.PathSeparator + allPath.join(Image.PathSeparator)).trim().split(Image.PathSeparator))];
            }
        }
        this.Path = allPath.join(Image.PathSeparator);
        Spinner.Hide();
        this.FileUploaded?.Invoke();
    }

    GetValueText() {
        if (!this.ImageSources || this.ImageSources.length === 0) {
            return null;
        }
        return this.ImageSources.map(path => {
            const label = this.RemoveGuid(path);
            return `<a target="_blank" href="${path}">${label}</a>`;
        }).join(",");
    }
}
