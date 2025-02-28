import { Html } from "./utils/html.js";
import { EditableComponent } from './editableComponent.js';
import { Action, KeyCodeEnum, Component } from "./models/";
import { Section } from "./index.js";

export class ConfirmDialog extends EditableComponent {
    constructor() {
        super(null);
        this._yesBtn = null;
        this.PElement = null;
        this.OpenEditForm = null;
        this.Textbox = null;
        this.Number = null;
        this.Datepicker = null;
        this.Precision = null;
        this.SearchEntry = null;
        this.Canceled = null;
        this.IgnoreNoButton = false;
        this.MultipleLine = true;
        this.YesText = "Yes";
        this.NoText = "No";
        this.CancelText = "Close";
        this.NeedAnswer = false;
        this.ComType = "Textbox";
        this.Component = [];
        this.ComponentGroup = null;
        this.IgnoreCancelButton = true;
        this.PopulateDirty = false;
        this.DisposeAfterYes = true;
        this.Title = "Confirm";
    }
    /** @type {HTMLElement} */
    DivElement;
    /** @type {HTMLElement} */
    BodyElement;
    /** @type {Action} */
    YesConfirmed = new Action();;
    /** @type {Action} */
    NoConfirmed = new Action();;
    Render() {
        Html.Take(this.PElement || document.body);
        Html.Div.ClassName((this.ComponentGroup ? "backdrop2" : "backdrop")).Style((this.ComponentGroup ? "" : "align-items: center;"));
        this.Element = Html.Context;
        this.ParentElement = this.Element.parentElement;
        Html.Instance.Div.Escape(() => this.Dispose()).ClassName("popup-content " + (this.ComponentGroup ? "form-dialog" : "confirm-dialog")).Style((this.ComponentGroup ? "" : "top: auto;"))
            .Div.ClassName("popup-title").Div.I.ClassName("fas fa-question-circle mr-1").End.IText("Confirm", this.EditForm.Meta.Label).End
            .Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event("click", () => this.CloseDispose())
            .EndOf(".popup-title")
            .Div.ClassName("popup-body");
        this.BodyElement = Html.Context;
        Html.Instance.Div.ClassName("bold").IText(this.Title, this.EditForm.Meta.Label).End.Div.ClassName("card").Event("keydown", (e) => this.HotKeyHandler(e)).Width(this.ComponentGroup ? "" : "450px").MarginRem("top", 1).TextAlign(this.ComponentGroup ? "" : "center");
        this.DivElement = Html.Context;
        if (this.NeedAnswer) {
            if (this.ComponentGroup && this.ComponentGroup.ComponentType == "Section") {
                var sectionInfo = {
                    Children: this.ComponentGroup.Children,
                    Column: this.ComponentGroup ? this.ComponentGroup.Column : 12,
                    IsSimple: true,
                    ClassName: 'card-body panel group'
                };
                var _basicSearchGroup = Section.RenderSection(this.EditForm, sectionInfo);
                this.DivElement.insertBefore(_basicSearchGroup.Element, this.DivElement.firstChild);
                _basicSearchGroup.Element.style.width = "100%";
                _basicSearchGroup.Element.className = "group card-body";
            }
            else {
                if (this.Component && this.Component.length > 0) {
                    this.Component.forEach(x => {
                        if (!this.ComponentGroup) {
                            x.Column = 12;
                            x.Style = null;
                            x.Visibility = true;
                            x.ShowLabel = true;
                            x.FocusSearch = false;
                            x.Width = null;
                            x.MaxWidth = null;
                            x.MinWidth = null;
                        }
                    });
                }
                else {
                    const com = new Component();
                    com.PlainText = "Nhập câu trả lời";
                    com.ShowLabel = false;
                    com.CanRead = true;
                    com.CanReadAll = true;
                    com.CanWrite = true;
                    com.CanWriteAll = true;
                    com.ShowLabel = false;
                    com.ComponentType = "Textarea";
                    com.FieldName = "ReasonOfChange";
                    com.Row = 3;
                    com.Column = 12;
                    com.XxlCol = 12;
                    com.Visibility = true;
                    com.MultipleLine = this.MultipleLine;
                    this.Component.push(com);
                }
                var sectionInfo = {
                    Components: this.Component,
                    Column: this.ComponentGroup ? this.ComponentGroup.Column : 12,
                    IsSimple: true,
                    ClassName: 'card-body panel group'
                };
                var _basicSearchGroup = Section.RenderSection(this.EditForm, sectionInfo);
                this.DivElement.insertBefore(_basicSearchGroup.Element, this.DivElement.firstChild);
                _basicSearchGroup.Element.style.width = "100%";
                _basicSearchGroup.Element.className = "group card-body";
            }
        }
        Html.Take(this.BodyElement).Div.Style("width: 172px; margin: auto; padding: 1rem; display: flex; justify-content: center; gap: 1rem;").Button2(this.YesText, "btn btn-success mt-2", "fal fa-check").Event("click", () => {
            this.ValidateAsync().then((isValid) => {
                if (!isValid) {
                    return;
                }
                try {
                    if (this.YesConfirmed) {
                        this.YesConfirmed?.invoke();
                    }
                } catch (ex) {
                    console.error(ex.stack);
                }
                if (this.DisposeAfterYes) {
                    this.Dispose();
                }
            })
        }).End.Render();
        this._yesBtn = Html.Context;
        if (!this.IgnoreNoButton) {
            Html.Instance.Button2(this.NoText, "btn btn-danger btn-sm mt-2", "fal fa-window-close")
                .MarginRem("left", 1)
                .Event("click", () => {
                    try {
                        this.NoConfirmed?.invoke();
                    } catch (ex) {
                        console.error(ex.stack);
                    }
                    this.CloseDispose();
                }).End.Render();
        }
        if (!this.IgnoreCancelButton) {
            Html.Instance.Button2(this.CancelText, "btn btn-success btn-sm mt-2", "fal fa-times")
                .MarginRem("left", 1)
                .Event("click", () => this.Dispose())
                .Render();
        }
    }

    Dispose() {
        if (this.ComponentGroup) {
            const componentIds = new Set(this.Component.map(element => element.Id));
            this.EditForm.ChildCom = this.EditForm.ChildCom.filter(child => !componentIds.has(child.Meta.Id));
        }
        super.Dispose();
    }

    CloseDispose() {
        if (this.Canceled) {
            this.Canceled();
        }
        if (this.ComponentGroup) {
            const componentIds = new Set(this.Component.map(element => element.Id));
            this.EditForm.ChildCom = this.EditForm.ChildCom.filter(child => !componentIds.has(child.Meta.Id));
        }
        super.Dispose();
    }

    /**
     * @param {any} content
     * @param {any} yesConfirm
     */
    static RenderConfirm(content, yesConfirm, noConfirm = null) {
        const meta = {
            Content: content,
        };
        const confirm = new ConfirmDialog();
        confirm.Content = content;
        confirm.Render();
        confirm.YesConfirmed = yesConfirm;
        confirm.NoConfirmed = noConfirm;
        return confirm;
    }

    /**
     * 
     * @param {Event} e 
     */
    HotKeyHandler(e) {
        if (e.KeyCode() === KeyCodeEnum.Enter) {
            this._yesBtn.click();
        }
    }
}


