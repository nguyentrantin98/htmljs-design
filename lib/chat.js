import { EditableComponent } from "./editableComponent.js";
import EventType from "./models/eventType.js";
import { PatchVM } from "./models/patch.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { Html } from "./utils/html";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import { KeyCodeEnum } from "./models/index.js";
import { EditForm } from "./editForm.js";
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
        var evt = "UpdateViewEntity" + this.Entity.Id.replaceAll("-", "");
        EditForm.NotificationClient.AddListener(evt, this.HandleMessage.bind(this));
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
        this.ChatData.push(message);
        this.HtmlIputChat.value = "";
        var item = message;
        item.Time = this.dayjs(item.InsertedDate).format('MM-DD HH:mm');
        Html.Take(this.HtmlContentChat);
        if (this.Token.UserId == item.FromId) {
            Html.Instance.Div.ClassName("message text-only").Div.ClassName("response").P.ClassName("text").Text(item.TextContent).End.End.End.Render();
        }
        else {
            if (this.LastFromId != item.FromId) {
                this.LastFromId = item.FromId;
                Html.Instance.Div.ClassName("message")
                    .Div.ClassName("photo").Style(`background-image: url(${item.Avatar});`)
                    .Div.ClassName("online").End.End.P.ClassName("text").Text(item.TextContent).End.End.Render();
            }
            else {
                Html.Instance.Div.ClassName("message text-only").P.ClassName("text").Text(item.TextContent).End.End.Render();
            }
        }
        if (this.Token.UserId == item.FromId) {
            Html.Instance.P.ClassName("response-time time").Text(item.Time).End.Render();
        }
        else {
            Html.Instance.P.ClassName("time").Text(item.Time).End.Render();
        }
        this.LastUserId = item.FromId;
        this.CalcPosition();
        this.UpdateData().then(() => {
            this.RenderBodyDiscussions();
        });
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
            .Div.ClassName("discussion search")
            .Div.ClassName("searchbar").I.ClassName("fal fa-search").End.Input.PlaceHolder("Search...").End.End.End.Div.Render();
        this.BodyDiscussions = Html.Context;
        this.RenderBodyDiscussions();
        Html.Instance.EndOf(".discussions")
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
            if (this.Token.UserId == item.FromId) {
                Html.Instance.Div.ClassName("message text-only").Div.ClassName("response").P.ClassName("text").Text(item.TextContent).End.End.End.Render();
            }
            else {
                if (this.LastFromId != item.FromId) {
                    this.LastFromId = item.FromId;
                    Html.Instance.Div.ClassName("message")
                        .Div.ClassName("photo").Style(`background-image: url(${item.Avatar});`)
                        .Div.ClassName("online").End.End.P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
                else {
                    Html.Instance.Div.ClassName("message text-only").P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
            }
            if (this.Token.UserId == item.FromId) {
                Html.Instance.P.ClassName("response-time time").Text(item.Time).End.Render();
            }
            else {
                Html.Instance.P.ClassName("time").Text(item.Time).End.Render();
            }
            this.LastUserId = item.FromId;
        });
        this.CalcPosition();
    }
    /**
     * @type {HTMLElement}
     */
    TitleText;
    RenderChat() {
        Html.Take(this.Element).Section.ClassName("chat")
            .Div.ClassName("header-chat");
        this.HtmlHeaderChat = Html.Context;
        Html.Instance.I.ClassName("fal fa-user-o").End
            .P.ClassName("name").Text(this.Title);
        this.TitleText = Html.Context;
        Html.Instance.End.I.ClassName("icon clickable fa fa-ellipsis-h right").End.End
            .Div.ClassName("messages-chat");
        this.HtmlContentChat = Html.Context;
        this.RenderBodyChat();
        Html.Instance.End.Div.ClassName("footer-chat")
            .I.ClassName("icon fa fa-smile-o clickable").End
            .Input.ClassName("write-message").PlaceHolder("Type your message here");
        this.HtmlIputChat = Html.Context;
        this.HtmlIputChat.addEventListener("keydown", (e) => {
            if (e.KeyCodeEnum() == KeyCodeEnum.Enter) {
                e.preventDefault();
                this.SendChat();
            }
        })
        Html.Instance.End.I.ClassName("icon send fal fa-paper-plane clickable").Event(EventType.Click, this.SendChat.bind(this)).Render();
        this.CalcPosition();
    }

    CalcPosition() {
        this.HtmlContentChat.scrollTop = 100000;
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.UpdateData().then(() => {
            this.Title = Utils.FormatEntity(this.Meta.FormatData, this.Entity);
            this.RenderBodyDiscussions();
            if (force) {
                this.RenderBodyChat();
                this.TitleText.textContent = this.Title;

            }
        })
    }

    RenderBodyDiscussions() {
        Html.Take(this.BodyDiscussions).Clear();
        this.Conversation.forEach(item => {
            Html.Instance.Div.TabIndex(-1).Event(EventType.Click, (evt) => this.HandlerClick(evt, item)).ClassName("discussion " + ((item.RecordId == this.Entity.Id) ? "message-active" : ""))
                .Div.ClassName("photo").I.ClassName(item.Icon || "fal fa-user").End.End
                .Div.ClassName("desc-contact")
                .P.ClassName("name").Text(item.Name).End
                .P.ClassName("message").Text(item.Text).End.End
                .Div.ClassName("timer").Text(item.Time).End
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
        Client.Instance.GetByIdAsync(item.TableName, [item.RecordId]).then(entitys => {
            this.Entity = entitys.data[0];
            this.Entity.TableName = item.TableName;
            this.Entity.FormatChat = item.Name;
            this.Entity.Icon = item.Icon;
            this.UpdateView(true);
            var evt = "UpdateViewEntity" + this.Entity.Id.replaceAll("-", "");
            EditForm.NotificationClient.AddListener(evt, this.HandleMessage.bind(this));
        });
    }

    SendChat() {
        this.Title = Utils.FormatEntity(this.Meta.FormatData, this.Entity);
        var text = this.HtmlIputChat.value;
        if (Utils.isNullOrWhiteSpace(text)) {
            return;
        }
        var patch = new PatchVM();
        patch.Table = "ChatEntity";
        patch.Changes = [{
            Field: "Id",
            Value: Uuid7.NewGuid(),
        },
        {
            Field: "FromId",
            Value: this.Token.UserId,
        },
        {
            Field: "TextContent",
            Value: text,
        },
        {
            Field: "RecordId",
            Value: this.Entity.Id,
        },
        {
            Field: "Name",
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
            Field: "TableName",
            Value: this.Entity.TableName,
        }];
        Client.Instance.PatchAsync(patch).then();
    }
}