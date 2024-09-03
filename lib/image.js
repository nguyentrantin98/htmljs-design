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
        const galleryElements = this.Element.parentElement.querySelectorAll(".gallery");
        galleryElements.forEach(el => el.remove());
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
            img.addEventListener('click', () => this.Preview(path));
        } else {
            const link = document.createElement('a');
            var i = document.createElement('i');
            i.className = thumbText.includes("pdf") ? "fal fa-file-pdf mr-1" : "fal fa-file mr-1";
            link.appendChild(i);
            var span = document.createElement('span');
            span.textContent = thumbText;
            link.appendChild(span);
            link.addEventListener("click", () => Client.Download(linkF))
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
        const thumbText = this.RemoveGuid(path);
        if (!Utils.IsImage(thumbText)) {
            console.log("Not an image: Downloading file.");
            window.location.href = path;
            return;
        }

        let img = document.createElement('img');
        img.src = path;
        img.style.cssText = "width:100%;";

        if (this._preview) {
            this._preview.remove();
        }

        this._preview = img;
        document.body.appendChild(img);

        img.addEventListener('click', () => {
            img.remove();
            this._preview = null;
        });
        this.zoom(img);
    }

    zoom(image) {
        let scale = 1;
        const SCALE_FACTOR = 0.1;

        image.addEventListener("mousewheel", function (e) {
            e.preventDefault();
            // @ts-ignore
            scale += e.deltaY > 0 ? -SCALE_FACTOR : SCALE_FACTOR;
            scale = Math.min(Math.max(1, scale), 6);
            this.style.transform = `scale(${scale})`;
        });
        image.addEventListener('mousemove', function (e) {
            e.preventDefault();
            const { left, top, width, height } = this.getBoundingClientRect();
            // @ts-ignore
            const x = (e.clientX - left) / width * 100;
            // @ts-ignore
            const y = (e.clientY - top) / height * 100;
            this.style.transformOrigin = `${x}% ${y}%`;
        });

        image.addEventListener('mouseout', function (e) {
            e.preventDefault();
            this.style.transformOrigin = 'unset';
            this.style.transform = 'scale(1)'
        });
    }

    ZoomImage(img) {
        if (this.flagZoomIn < this.zoomMaxLevel) {
            if (this.zoomLevel === 0 || this.zoomLevel < this.zoomMaxLevel) {
                img.style.cursor = "zoom-in";
                img.height += 450;
                img.width += 400;
                this.zoomLevel++;
                this.flagZoomIn++;
            }
        } else if (this.flagZoomIn === this.zoomMaxLevel) {
            if (this.zoomLevel === 1) {
                this.flagZoomIn = 1;
            }
            img.style.cursor = "zoom-out";
            img.height -= 450;
            img.width -= 400;
            this.zoomLevel--;
        }
    }

    MoveAround(event, path) {
        const keyCode = event.keyCode;
        if (![37, 39].includes(keyCode)) {
            return;
        }

        const img = event.target.querySelector('img');
        if (!img) {
            return;
        }

        if (keyCode === 37) {
            this.MoveLeft(path, img);
        } else if (keyCode === 39) {
            this.MoveRight(path, img);
        }
    }

    MoveLeft(path, img) {
        const imageSources = this.Path.split("    ");
        let index = imageSources.indexOf(path);
        if (index === 0) {
            index = imageSources.length - 1;
        } else {
            index--;
        }
        img.Src = (this.Path.includes("http") ? "" : Client.Origin) + imageSources[index];
        return imageSources[index];
    }

    MoveRight(path, img) {
        const imageSources = this.Path.split("    ");
        let index = imageSources.indexOf(path);
        if (index === imageSources.length - 1) {
            index = 0;
        } else {
            index++;
        }

        img.Src = (this.Path.includes("http") ? "" : Client.Origin) + imageSources[index];
        return imageSources[index];
    }

    OpenFileDialog(event) {
        if (this.Disabled) {
            return;
        }

        this.OpenNativeFileDialog(event);

        // if (typeof navigator.camera === 'undefined') {
        //     this._input.click();
        // } else {
        //     this.RenderImageSourceChooser();
        // }
    }

    RenderUploadForm() {
        const handler = this.UploadSelectedImages.bind(this);
        if (!this.Meta.VirtualScroll) {
            Html.Take(this.ParentElement).Div.ClassName("ms-upload")
                .Div.ClassName("ms-title-upload")
                .Div.ClassName("attach-text")
                .Div.ClassName("mi mi-18 mi-attach m-r-8 cursor-default").End
                .Div.IText(this.Meta.Label ?? "Attach").End
                .End
                .Div.ClassName("max-size-upload").IText("Maximum size 5MB").End
                .End
                .Span
                .Div.ClassName("ms-img-upload")
                .Div.ClassName("ms-input-upload")
                .Input.Type("file").Attr("title", "").Attr("accept", "");
            if (this.Meta.IsMultiple) {
                Html.Instance.Attr("multiple", "multiple");
            }
            this.Element = this._input = Html.Context;
            this.Element.addEventListener("drop", (e) => this.UploadDropImages(e));
            this.Element.addEventListener("change", handler);
            if (!this.CanWrite) {
                this._input.readOnly = true;
            }
            Html.Instance.End.Div.ClassName("w-full-100")
                .Div.ClassName("w-full-100").End
                .Div.ClassName("img-upload");
            this._gallerys = Html.Context;
            Html.Instance.End.End.Span.ClassName("text-input").IText("Drag/drop files here or click here").EndOf(".ms-upload").End.Render();
        }
        else {
            Html.Take(this.ParentElement).Div.ClassName("ms-upload")
                .Span
                .Div.ClassName("ms-img-upload")
                .Div.ClassName("ms-input-upload")
                .Input.Type("file").Attr("title", "").Attr("accept", "");
            if (this.Meta.IsMultiple) {
                Html.Instance.Attr("multiple", "multiple");
            }
            this.Element = this._input = Html.Context;
            this.Element.addEventListener("drop", (e) => this.UploadDropImages(e));
            this.Element.addEventListener("change", handler);
            if (!this.CanWrite) {
                this._input.readOnly = true;
            }
            Html.Instance.End.Div.ClassName("w-full-100")
                .Div.ClassName("w-full-100").End
                .Div.ClassName("img-upload");
            this._gallerys = Html.Context;
            Html.Instance.End.End.Span.ClassName("text-input").IText("Drag/drop files here or click here").EndOf(".ms-upload").End.Render();
        }
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
        confirmDialog.PElement = this.EditForm.Element;
        confirmDialog.Render();
        confirmDialog.YesConfirmed.add(() => {
            Client.Instance.PostAsync(removedPath, "/api/fileUpload/deleteFile")
                .then(success => {
                    const oldVal = this._path;
                    const newPath = this._path.replace(removedPath, '')
                        .replace(Image.PathSeparator + Image.PathSeparator, '')
                        .split(Image.PathSeparator).filter(x => x != null && x != "");
                    this.Path = newPath.join(Image.PathSeparator);
                    this.Dirty = true;
                    const observable = { NewData: this._path, OldData: oldVal, FieldName: this.Name, EvType: EventType.Change };
                    this.UserInput?.Invoke(observable);
                    this.DispatchEvent(this.Meta.Events, EventType.Change, this, this.Entity).then();
                });
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
        Spinner.AppendTo(this.EditForm.Element);
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

    OpenNativeFileDialog(e) {
        e?.preventDefault();
        this._input.click();
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
