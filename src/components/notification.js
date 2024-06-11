import { Client } from "../../lib/clients/client.js";
import EditableComponent from "../../lib/editableComponent.js";
import { Toast } from "../../lib/toast.js";
import { Utils } from "../../lib/utils/utils.js";
import { TaskStateEnum } from "../../lib/models/enum.js"
import { Html } from "../../lib/utils/html.js";
import { ElementType } from "../../lib/models/elementType.js";
import EventType from "../../lib/models/eventType.js";
import { Spinner } from "../../lib/spinner.js";
import { SqlViewModel } from "../../lib/models/sqlViewModel.js";
import { TaskNotification } from "../../lib/models/task.js";
import { ComponentExt } from "../../lib/utils/componentExt.js";

export class NotificationBL extends EditableComponent {
    static NoMoreTask = "No more task";
    static _instance = null;
    static _countNtf = null;
    static _countUser = null;
    /** @type {TaskNotification[]} */
    static Notifications = [];
    static UserActive = [];
    static NotiRoot = document.getElementById("notification-list");
    static ProfileRoot = document.getElementById("profile-info1");

    constructor() {
        super(null);
        /** @type {TaskNotification[]} */
        this.notifications = [];
        this.userActive = [];
        this._countNtf = "";
        this._countUser = "";
        this._task = null;
        this._countBadge = null;
        this.currentUser = null;
        window.addEventListener("task", this.processIncomMessage.bind(this));
    }

    processIncomMessage(event) {
        const obj = event.detail;
        if (!obj) {
            return;
        }

        const task = obj;
        if (!task) {
            return;
        }

        const existTask = this.notifications.find(x => x.Id === task.Id);
        if (!existTask) {
            this.notifications.push(task);
            this.ToggleBadgeCount(this.notifications.length);
        }
        this.SetBadgeNumber();
        const entity = Utils.GetEntityById(task.EntityId);
        task.Entity = { Name: entity.Name };

        if (typeof (Notification) !== 'undefined' && Notification.permission === "granted") {
            this.ShowNativeNtf(task);
        } else if (typeof (Notification) !== 'undefined' && Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission !== 'granted') {
                    this.ShowToast(task);
                } else {
                    this.ShowNativeNtf(task);
                }
            });
        } else {
            this.ShowToast(task);
        }
    }

    SetBadgeNumber() {
        const unreadCount = this.notifications.filter(x => x.StatusId === TaskStateEnum.UnreadStatus.toString()).length;
        this._countNtf = unreadCount > 9 ? "9+" : unreadCount.toString();
        const badge = unreadCount > 9 ? 9 : unreadCount;

        if (typeof (cordova) !== 'undefined' &&
            typeof (cordova.plugins) !== 'undefined' &&
            typeof (cordova.plugins.notification) !== 'undefined') {
            cordova.plugins.notification.badge.requestPermission(function (granted) {
                cordova.plugins.notification.badge.set(unreadCount);
            });
        }
        return badge;
    }

    /**
     * Show native notification
     * @param {TaskNotification} task 
     * @returns 
     */
    ShowNativeNtf(task) {
        if (!task) {
            return;
        }

        const nativeNtf = new Notification(task.Title, {
            body: task.Description,
            icon: task.Attachment,
            // @ts-ignore
            vibrate: [200, 100, 200],
            badge: "./favicon.ico"
        });

        nativeNtf.addEventListener('click', () => this.OpenNotification(task));
        setTimeout(() => {
            nativeNtf.close();
        }, 7000);
    }

    /**
     * Toast to show notification's information
     * @param {TaskNotification} task 
     */
    ShowToast(task) {
        Toast.Success(task.Title + '\n' + task.Description, 400);
    }

    /**
     * Open detail form from task notification
     * @param {TaskNotification} task 
     */
    OpenNotification(task) {
        this.MarkAsRead(task);
    }

    static get Instance() {
        if (!this._instance) {
            this._instance = new NotificationBL();
        }
        return this._instance;
    }

    Render() {
        const notiRoot = document.getElementById("notification-list");
        const profileRoot = document.getElementById("profile-info1");

        if (!notiRoot || !profileRoot) {
            return;
        }

        notiRoot.innerHTML = '';
        document.querySelector("#user-active").innerHTML = '';
        this.SetBadgeNumber();

        this.currentUser = Client.token;
        if (!this.currentUser) return;

        this.currentUser.Avatar = (this.currentUser.Avatar.includes("://") ? "" : Client.Origin) + (this.currentUser.Avatar.trim() === "" ? "./image/chinese.jfif" : this.currentUser.Avatar);
        this.RenderNotification();
        this.RenderProfile(profileRoot);

        /** @type {XHRWrapper} */
        // @ts-ignore
        const xhr = {
            Url: "/GetUserActive",
            Method: "POST",
            ShowError: false
        };

        Client.Instance.SubmitAsync(xhr)
            .then(users => this.userActive = users)
            .catch(console.log);
    }

    RenderProfile(profileRoot) {
        if (!profileRoot) return;

        const isSave = window.localStorage.getItem("isSave");
        profileRoot.innerHTML = '';

        Html.Take(profileRoot);
        Html.ClassName("navbar-nav-link d-flex align-items-center dropdown-toggle")
            .Attr("toggle", "dropdown")
            .Span.ClassName("text-truncate").Text(this.currentUser.TenantCode + ": " + this.currentUser.FullName)
            .EndOf(ElementType.a)
            .Div.ClassName("dropdown-menu dropdown-menu-right notClose mt-0 border-0").Style("border-top-left-radius: 0; border-top-right-radius: 0")
            .A.ClassName("dropdown-item").Event(EventType.Click, this.ViewProfile.bind(this))
            .Text("Account (" + this.currentUser.TenantCode + ": " + this.currentUser.FullName + ")")
            .I.ClassName("far fa-user").End
            .EndOf(ElementType.a)
            .Div.ClassName("dropdown-divider").End;

        // const langSelect = new LangSelect(new Component(), html.getContext());
        // langSelect.render();

        Html.Div.ClassName("dropdown-divider").End
            .A.ClassName("dropdown-item").Event(EventType.Click, this.DarkOrLightModeSwitcher.bind(this))
            .Text("Dark/Light Mode")
            .I.ClassName("far fa-moon-cloud").End
            .EndOf(ElementType.a)
            .A.ClassName("dropdown-item").Event(EventType.Click, this.SignOut.bind(this))
            .Text('Log out')
            .I.ClassName("far fa-power-off")
            .EndOf(ElementType.a);
    }

    SignOut(event) {
        event.preventDefault();
        const task = Client.Instance.PostAsync(Client.token, "/user/signOut");
        task.then(res => {
            Client.SignOutEventHandler?.Invoke();
            Client.token = null;
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    DarkOrLightModeSwitcher(event) {
        event.preventDefault();
        const htmlElement = document.documentElement;
        htmlElement.style.filter = htmlElement.style.filter.includes("(1)") ? "invert(0)" : "invert(1)";
    }

    ViewProfile(event) {
        // open user profile here
    }

    RenderNotification() {
        const notiRoot = NotificationBL.NotiRoot;
        if (!notiRoot) return;

        const html = Html.Take(notiRoot);
        html.ClassName("navbar-nav-link")
            .Attr("toggle", "dropdown")
            .I.ClassName("far fa-bell fa-lg")
            .EndOf(ElementType.i);

        if (this._countNtf !== '') {
            html.Span.ClassName("badge badge-pill bg-warning-400 ml-auto ml-md-0").Text(this._countNtf);
            this._countBadge = html.Context;
        }

        html.EndOf(ElementType.a)
            .Div.ClassName("dropdown-menu dropdown-menu-right dropdown-content wmin-md-300 mt-0")
            .Text("border-top-left-radius: 0; border-top-right-radius: 0")
            .ForEach(this.notifications, (task, index) => {
                this.RenderTask(task);
            })
            .End
            .A.ClassName("dropdown-item dropdown-footer").Event(EventType.Click, this.SeeMore.bind(this), "See more")
            .EndOf(ElementType.a);
    }

    RenderTask(task) {
        if (!task) return;

        const className = task.StatusId.toString() === TaskStateEnum.UnreadStatus.toString() ? 'text-danger' : 'text-muted';

        Html.Instance.A.ClassName('dropdown-item').Div.ClassName('media').Event('click', () => {
            this.OpenNotification(task);
        })
            .Div.ClassName('media-body')
            .H3.ClassName('dropdown-item-title').Text(task.Title)
            .Span.ClassName('float-right text-sm ' + className).I.ClassName('fas fa-star').End
            .End
            .P.ClassName('text-sm').Text(task.Description).End
            .P.ClassName('text-sm text-muted')
            .I.ClassName('far fa-clock mr-1').End.Text(new Date(task.Deadline).toLocaleString('en-GB')).EndOf('a');
    }

    ToggleBadgeCount(count) {
        this._countBadge.style.display = count === 0 ? 'none' : 'inline-block';
    }

    /**
     * Load more notification to show
     * @param {Event} event 
     * @returns 
     */
    SeeMore(event) {
        event.preventDefault();
        const lastSeenTask = this.notifications.sort((a, b) => b.InsertedDate?.getTime() - a.InsertedDate?.getTime()).FirstOrDefault();
        if (!lastSeenTask) {
            Toast.Warning(NotificationBL.NoMoreTask);
            return;
        }
        Spinner.AppendTo(this.Element, false, true, 250);
        const lastSeenDateStr = new Date(lastSeenTask.InsertedDate).toISOString();
        /** @type {SqlViewModel} */
        // @ts-ignore
        const sql = {
            ComId: "Task",
            Action: "SeeMore",
            MetaConn: Client.MetaConn,
            DataConn: Client.DataConn,
            Params: JSON.stringify({ Date: lastSeenDateStr })
        };
        Client.Instance.UserSvc(sql).then(ds => {
            const olderItems = ds.length > 0 ? ds[0] : null;
            if (!olderItems || olderItems.length === 0) {
                Toast.Warning(NotificationBL.NoMoreTask);
                return;
            }
            const taskList = [...this.notifications, ...olderItems];
            this.notifications = taskList;
        }).catch(err => {
            Toast.Warning(err?.message ?? NotificationBL.NoMoreTask);
        });
    }

    /**
     * 
     * @param {Event} event 
     */
    MarkAllAsRead(event) {
        event.preventDefault();
        Client.Instance.PostAsync(null, `/tasks/MarkAllAsRead`).then(res => {
            this.ToggleBadgeCount(this.notifications.filter(x => x.StatusId === TaskStateEnum.UnreadStatus.toString()).length);
            document.querySelectorAll(".task-unread").forEach(task => {
                task.classList.replace("task-unread", "task-read");
            });
        });
    }

    RemoveDOM() {
        document.querySelector("#notification").innerHTML = '';
    }

    /**
     * 
     * @param {TaskNotification} task 
     */
    MarkAsRead(task) {
        task.StatusId = TaskStateEnum.Read.toString();

        const patch = ComponentExt.MapToPatch(task, 'TaskNotification');
        Client.Instance.PatchAsync(patch).then(x => {
            this.SetBadgeNumber();
        });
    }

    Dispose() {
        this._task.classList.add("hide");
    }
}
