import { Html } from "./utils/html.js";
import { Textbox } from './textbox.js';
import { SearchEntry } from "./searchEntry.js";
import { Datepicker } from './datepicker.js'
import { EditableComponent } from './editableComponent.js';
import { Action, KeyCodeEnum, Component } from "./models/";
import { Message } from "./utils/message.js";
import { Numbox } from "./numbox.js";
import { Textarea } from "./inputLike.js";

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
        this.Component = null;
        this.IgnoreCancelButton = true;
        this.PopulateDirty = false;
        this.Title = "Confirm";
    }
    /** @type {HTMLElement} */
    DivElement;
    DisposeAfterYes = true;
    /** @type {Action} */
    YesConfirmed = new Action();;
    /** @type {Action} */
    NoConfirmed = new Action();;
    Render() {
        Html.Take(this.PElement || document.body);
        Html.Div.ClassName("backdrop").Style("align-items: center;").Escape(() => this.Dispose());
        this.Element = Html.Context;
        this.ParentElement = this.Element.parentElement;
        let popupContent = Html.Instance.Div.ClassName("popup-content confirm-dialog").Style("top: auto;")
            .Div.ClassName("popup-title").Div.IHtml(this.Title).End
            .Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event("click", () => this.CloseDispose())
            .EndOf(".popup-title")
            .Div.ClassName("popup-body");
        popupContent.Div.ClassName("card-body panel group").Event("keydown", (e) => this.HotKeyHandler(e)).MarginRem("top", 1).TextAlign("center");
        this.DivElement = Html.Context;
        if (this.NeedAnswer) {
            if (this.Component && this.Component.ComponentType == "Dropdown") {
                const textbox = new SearchEntry(this.Component);
                textbox.Entity = this.Entity;
                this.AddChild(textbox);
                textbox.Element.parentElement.style.width = "100%";
                Html.Instance.End.End.Render();
            }
            else {
                const com = new Component();
                com.PlainText = "Nhập câu trả lời";
                com.ShowLabel = false;
                com.FieldName = "ReasonOfChange";
                com.Row = 3;
                com.MultipleLine = this.MultipleLine;
                const textbox = new Textarea(com);
                this.AddChild(textbox);
                Html.Instance.End.Render();
            }
        }
        Html.Instance.Button2(this.YesText, "btn btn-success mt-2", "fal fa-check").Event("click", () => {
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
            Html.Instance.Button2(this.NoText, "btn btn-danger  mt-2", "fal fa-window-close")
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
            Html.Instance.Button2(this.CancelText, "btn btn-success mt-2", "fal fa-times")
                .MarginRem("left", 1)
                .Event("click", () => this.Dispose())
                .Render();
        }
    }

    Dispose() {
        super.Dispose();
    }

    CloseDispose() {
        if (this.Canceled) {
            this.Canceled();
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


