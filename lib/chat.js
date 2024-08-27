import { EditableComponent } from "./editableComponent.js";
import EventType from "./models/eventType.js";
import { PatchVM } from "./models/patch.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { Html } from "./utils/html";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import { KeyCodeEnum } from "./models/index.js";
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
    ChatData
    Render() {
        Html.Take(this.ParentElement).Div.ClassName("chat-container");
        this.Element = Html.Context;
        this.LoadData();
    }

    LoadData() {
        this.RunQuery().then(data => {
            this.ChatData = data;
            this.RenderMenu();
            this.RenderDiscussions();
            this.RenderChat();
        })
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

    RenderDiscussions() {
        Html.Take(this.Element).Section.ClassName("discussions")
            .Div.ClassName("discussion search")
            .Div.ClassName("searchbar").I.ClassName("fal fa-search").End.Input.PlaceHolder("Search...").End.End.End
            .Div.ClassName("discussion message-active").End
            .Div.ClassName("discussion").End
            .Div.ClassName("discussion").End
            .Div.ClassName("discussion").End
            .Div.ClassName("discussion").End
            .Div.ClassName("discussion").End
            .Div.ClassName("discussion").EndOf(".discussions")
    }
    LastFromId;
    RenderChat() {
        let title = Utils.FormatEntity(this.Meta.FormatData, this.EditForm.Entity);
        Html.Take(this.Element).Section.ClassName("chat")
            .Div.ClassName("header-chat");
        this.HtmlHeaderChat = Html.Context;
        Html.Instance.I.ClassName("fal fa-user-o").End
            .P.ClassName("name").Text(title).End
            .I.ClassName("icon clickable fa fa-ellipsis-h right").End.End
            .Div.ClassName("messages-chat");
        this.HtmlContentChat = Html.Context;
        this.LastFromId = this.ChatData.find(x => x.FromId != this.Token.UserId);
        this.ChatData.forEach(item => {
            if (this.Token.UserId == item.FromId) {
                Html.Instance.Div.ClassName("message text-only").Div.ClassName("response").P.ClassName("text").Text(item.TextContent).End.End.End.Render();
            }
            else {
                if (this.LastFromId != item.FromId) {
                    this.LastFromId = item.FromId;
                    Html.Instance.Div.ClassName("message")
                        .Div.ClassName("photo").Style("background-image: url(https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80);")
                        .Div.ClassName("online").End.End.P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
                else {
                    Html.Instance.Div.ClassName("message text-only").P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
            }
        })
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

    SendChat() {
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
            Value: this.EditForm.Entity.Id,
        }];
        Client.Instance.PatchAsync(patch).then(data => {
            this.HtmlIputChat.value = "";
            var item = data.updatedItem[0];
            Html.Take(this.HtmlContentChat);
            if (this.Token.UserId == item.FromId) {
                Html.Instance.Div.ClassName("message text-only").Div.ClassName("response").P.ClassName("text").Text(item.TextContent).End.End.End.Render();
            }
            else {
                if (this.LastFromId != item.FromId) {
                    this.LastFromId = item.FromId;
                    Html.Instance.Div.ClassName("message")
                        .Div.ClassName("photo").Style("background-image: url(https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80);")
                        .Div.ClassName("online").End.End.P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
                else {
                    Html.Instance.Div.ClassName("message text-only").P.ClassName("text").Text(item.TextContent).End.End.Render();
                }
            }
            this.CalcPosition();
        });
    }
}