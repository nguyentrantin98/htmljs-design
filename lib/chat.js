import { EditableComponent } from "./editableComponent.js";
import EventType from "./models/eventType.js";
import { PatchVM } from "./models/patch.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { Html } from "./utils/html";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import { KeyCodeEnum } from "./models/index.js";
import { EditForm } from "./editForm.js";
import { Picker, Data } from 'emoji-mart';
import { ComponentExt } from "./utils/componentExt.js";
import { Spinner } from "./spinner.js";

export class Chat extends EditableComponent {
    constructor(ui, ele = null) {
        super(ui);
        /** @type {Component} */
        this.Meta = ui;
    }

    /**
     * @type {HTMLElement}
     */
    HtmlContentChat;
    /**
     * @type {HTMLElement}
     */
    HtmlEmoji;
    /**
     * @type {HTMLInputElement}
     */
    UserParentElement;
    /**
     * @type {HTMLInputElement}
     */
    HtmlIputChat;
    /**
     * @type {HTMLElement}
     */
    HtmlHeaderChat;
    /**
     * @type {[]}
     */
    ChatData;
    /**
    * @type {[]}
    */
    Conversation;

    Render() {
        this.Title = Utils.FormatEntity(this.Meta.FormatData, this.Entity);
        Html.Take(this.ParentElement).Div.ClassName("chat-container");
        this.Element = Html.Context;
        this.LoadData();
        if (this.Entity.Id) {
            window.setTimeout(() => {
                var evt = "UpdateViewEntity" + this.Entity.Id.replaceAll("-", "");
                EditForm.NotificationClient.AddListener(evt, this.HandleMessage.bind(this));
            }, 1000);
        }
    }

    HandleMessage(data) {
        var evt = "UpdateViewEntity" + this.Entity.Id.replaceAll("-", "");
        if (data.QueueName != evt) {
            this.UpdateData().then(() => {
                this.RenderBodyDiscussions();
            });
            return;
        }
        const message = data.Message;
        const existingMessage = this.ChatData.find(msg => msg.Id === message.Id);
        if (existingMessage) {
            existingMessage.Message = message.Message;
            const existingElement = document.querySelector(`[data-id="${message.Id}"] p`);
            if (existingElement) {
                existingElement.innerHTML = message.Message;
            }
        } else {
            this.ChatData.push(message);
            this.AddMessageToDOM(message);
        }
        this.HtmlIputChat.value = "";
        this.LastUserId = message.FromId;
        this.CalcPosition();
        this.UpdateData().then(() => {
            this.RenderBodyDiscussions();
        });
    }

    AddMessageToDOM(item) {
        Html.Take(this.HtmlContentChat);
        if (this.Token.UserId == item.FromId) {
            Html.Instance.Div.DataAttr("id", item.Id).ClassName("message text-only").Div.ClassName("response")
                .P.ClassName("text2").InnerHTML(item.Message).End.Render();
            if (item.Message != "Tin nhắn đã được thu hồi") {
                Html.Instance.I.ClassName("icon fa fa-trash clickable").Event(EventType.Click, async () => await this.DeleteMessage(item)).End.Render();
            }
            Html.Instance.End.End.Render();
        }
        else {
            Html.Instance.Div.DataAttr("id", item.Id).ClassName("message")
                .Div.ClassName("photo").Style(`background-image: url(${item.Avatar});`)
                .Div.ClassName("online").End.End.P.ClassName("text").InnerHTML(item.Message).End.End.Render();
        }
        if (this.Token.UserId == item.FromId) {
            Html.Instance.P.ClassName("response-time time").Text(item.Time).End.Render();
        }
        else {
            Html.Instance.P.ClassName("time").Text(item.Time).End.Render();
        }
    }

    LoadData() {
        this.RunQuerys().then(data => {
            this.ChatData = data[0];
            this.Conversation = data[1];
            this.RenderDiscussions();
            this.RenderChat();
        })
    }

    async UpdateData() {
        var data = await this.RunQuerys();
        this.ChatData = data[0];
        this.Conversation = data[1];
    }

    RenderMenu() {
        Html.Take(this.Element).Nav.ClassName("chat-menu").Ul.ClassName("chat-items")
            .Li.ClassName("chat-item").I.ClassName("fal fa-home").End.End
            .Li.ClassName("chat-item").I.ClassName("fal fa-user").End.End
            .Li.ClassName("chat-item").I.ClassName("fal fa-pencil").End.End
            .Li.ClassName("chat-item").I.ClassName("fal fa-comment").End.End
            .Li.ClassName("chat-item").I.ClassName("fal fa-file").End.End
            .Li.ClassName("chat-item").I.ClassName("fal fa-cog").End.EndOf(".chat-menu");
    }

    /**
     * @type {HTMLElement}
     */
    BodyDiscussions;

    RenderDiscussions() {
        Html.Take(this.Element).Section.ClassName("discussions")
        Html.Instance.Div.Render();
        this.BodyDiscussions = Html.Context;
        this.RenderBodyDiscussions();
        Html.Instance.EndOf(".discussions");
    }

    LastFromId;
    LastUserId;
    /**
     * @type {String}
     */
    Title = null;

    RenderBodyChat() {
        Html.Take(this.HtmlContentChat).Clear();
        this.LastFromId = this.ChatData.find(x => x.FromId != this.Token.UserId);
        this.LastUserId = this.ChatData.find(x => x.FromId != this.Token.UserId);
        this.ChatData.forEach(item => {
            this.AddMessageToDOM(item);
        });
        window.setTimeout(() => {
            this.HtmlContentChat.parentElement.scrollTop = this.HtmlContentChat.clientHeight;
        }, 100);
    }

    /**
     * @type {HTMLElement}
     */
    TitleText;
    /**
     * @type {HTMLElement}
     */
    ContainerPicker;
    /**
    * @type {Picker}
    */
    Picker;

    RenderChat() {
        Html.Take(this.Element).Section.ClassName("chat")
            .Div.ClassName("header-chat");
        this.HtmlHeaderChat = Html.Context;
        Html.Instance.I.ClassName("fal fa-user-o").End
            .P.ClassName("name2").Text(this.Title == "{0}" ? "" : this.Title)
        this.TitleText = Html.Context;
        Html.Instance.End.End
            .Div.ClassName("messages-chat").Div.Render();
        this.HtmlContentChat = Html.Context;
        this.RenderBodyChat();
        Html.Instance.End.End.Div.ClassName("footer-chat")
            .Input.Type("file").ClassName("attach-file").Style("display: none;").Event(EventType.Change, this.AttachFile.bind(this)).End
            .I.ClassName("icon fa fa-paperclip clickable").Event(EventType.Click, () => this.Element.querySelector(".attach-file").click()).End
            .I.ClassName("icon fa fa-smile clickable").Event(EventType.Click, this.ShowEmojiPicker.bind(this)).End
            .Input.ClassName("write-message").PlaceHolder("Type your message here");
        this.HtmlIputChat = Html.Context;
        this.HtmlIputChat.addEventListener("keydown", (e) => {
            if (e.KeyCodeEnum() == KeyCodeEnum.Enter) {
                e.preventDefault();
                this.SendChat();
            }
        });
        Html.Instance.End.I.ClassName("icon send fal fa-paper-plane clickable").Event(EventType.Click, this.SendChat.bind(this)).End.Render();
    }

    ShowEmojiPicker() {
        const pickerContainer = document.createElement('div');
        pickerContainer.style.position = 'absolute';
        pickerContainer.style.bottom = '50px';
        pickerContainer.style.left = '10px';
        pickerContainer.style.zIndex = '1000';

        this.Picker = new Picker({
            data: Data,
            onEmojiSelect: emoji => {
                this.HtmlIputChat.value += emoji.native;
            },
        });

        pickerContainer.appendChild(this.Picker);
        document.body.appendChild(pickerContainer);
        this.ContainerPicker = pickerContainer;
        this.CalcPosition();
        document.addEventListener('click', this.HideEmojiPicker.bind(this), true);
    }

    HideEmojiPicker(event) {
        if (this.ContainerPicker && !this.ContainerPicker.contains(event.target) && !this.HtmlIputChat.contains(event.target)) {
            this.ContainerPicker.remove();
            document.removeEventListener('click', this.HideEmojiPicker.bind(this), true);
        }
    }

    CalcPosition() {
        ComponentExt.AlterPosition(this.ContainerPicker, this.HtmlIputChat);
    }

    AttachFile(event) {
        const files = event.target.files;
        this.UploadAllFiles(files).then(() => {

        }).catch(error => {
            console.error("Failed to upload files:", error);
        });
    }

    async UploadAllFiles(filesSelected) {
        Spinner.AppendTo();
        const files = Array.from(filesSelected).map(this.UploadFile.bind(this));
        let allPath = await Promise.all(files);
        var thumbText = allPath[0];
        const isImage = Utils.IsImage(thumbText);
        var format = `<a href="${thumbText}"></a>`;
        if (isImage) {
            format = `<img src="${thumbText}">`;
        }
        var patch = new PatchVM();
        patch.Table = "ConversationDetail";
        patch.Changes = [{
            Field: "Id",
            Value: Uuid7.NewGuid(),
        },
        {
            Field: "FromId",
            Value: this.Token.UserId,
        },
        {
            Field: "FromName",
            Value: this.Token.NickName,
        },
        {
            Field: "Message",
            Value: format,
        },
        {
            Field: "RecordId",
            Value: this.Entity.RecordId,
        },
        {
            Field: "FormatChat",
            Value: this.Title,
        },
        {
            Field: "Icon",
            Value: this.Entity.Icon,
        },
        {
            Field: "Avatar",
            Value: this.Token.Avatar || "/assets/images/avatar1.png",
        },
        {
            Field: "ConversationId",
            Value: this.Entity.Id,
        },
        {
            Field: "EntityId",
            Value: this.Entity.EntityId,
        }];
        await Client.Instance.PatchAsync(patch);
        Spinner.Hide();
    }

    /**
     * @param {File} file
     */
    async UploadFile(file) {
        try {
            const path = await Client.Instance.PostFilesAsync(file, Utils.FileSvc);
            return path;
        } catch (error) {
            console.error("Error posting file:", error);
            throw error;
        }
    }

    async DeleteMessage(item) {
        Spinner.AppendTo();
        var patch = new PatchVM();
        patch.Table = "ConversationDetail";
        patch.Changes = [{
            Field: "Id",
            Value: item.Id,
        },
        {
            Field: "Message",
            Value: "Tin nhắn đã được thu hồi",
        }];
        await Client.Instance.PatchAsync(patch);
        Spinner.Hide();
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.UpdateData().then(() => {
            this.Title = Utils.FormatEntity(this.Meta.FormatData, this.Entity);
            this.RenderBodyDiscussions();
            if (force) {
                this.RenderBodyChat();
                this.TitleText.textContent = this.Title;
            }
        });
    }

    RenderBodyDiscussions() {
        Html.Take(this.BodyDiscussions).Clear();
        this.Conversation.forEach(item => {
            Html.Instance.Div.TabIndex(-1).Event(EventType.Click, (evt) => this.HandlerClick(evt, item)).ClassName("discussion " + ((item.Id == this.Entity.Id) ? "message-active" : ""))
                .Div.ClassName("photo").Style("background-image: url(" + item.Icon + ");").End
                .Div.ClassName("desc-contact")
                .P.ClassName("name").InnerHTML(item.FormatChat).End
                .P.ClassName("message").InnerHTML(item.Message).End.End
                .Div.ClassName("timer").InnerHTML(item.Time).End
                .End.Render();
        });
    }

    /**
    * @param {Event} e 
    * @param {{}} item
    */
    HandlerClick(e, item) {
        this.Element.querySelectorAll(".discussion").forEach(x => x.classList.remove("message-active"));
        e.target.closest(".discussion").classList.add("message-active");
        this.Entity = item;
        this.UpdateView(true);
        var evt = "UpdateViewEntity" + this.Entity.Id.replaceAll("-", "");
        EditForm.NotificationClient.AddListener(evt, this.HandleMessage.bind(this));
    }

    SendChat() {
        this.Title = Utils.FormatEntity(this.Meta.FormatData, this.Entity);
        var text = this.HtmlIputChat.value;
        if (Utils.isNullOrWhiteSpace(text)) {
            return;
        }
        var patch = new PatchVM();
        patch.Table = "ConversationDetail";
        patch.Changes = [{
            Field: "Id",
            Value: Uuid7.NewGuid(),
        },
        {
            Field: "FromId",
            Value: this.Token.UserId,
        },
        {
            Field: "FromName",
            Value: this.Token.NickName,
        },
        {
            Field: "Message",
            Value: text,
        },
        {
            Field: "RecordId",
            Value: this.Entity.RecordId,
        },
        {
            Field: "FormatChat",
            Value: this.Title,
        },
        {
            Field: "Icon",
            Value: this.Entity.Icon,
        },
        {
            Field: "Avatar",
            Value: this.Token.Avatar || "/assets/images/avatar1.png",
        },
        {
            Field: "ConversationId",
            Value: this.Entity.Id,
        },
        {
            Field: "EntityId",
            Value: this.Entity.EntityId,
        }];
        Client.Instance.PatchAsync(patch).then();
    }
}