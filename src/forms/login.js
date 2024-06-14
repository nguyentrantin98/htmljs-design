import { Client } from "../../lib/clients/client.js";
import { WebSocketClient } from "../../lib/clients/websocketClient.js";
import { KeyCodeEnum, RoleEnum } from "../../lib/models/enum.js";
import EventType from "../../lib/models/eventType.js";
import { PopupEditor } from "../../lib/popupEditor.js";
import { Toast } from "../../lib/toast.js";
import { Html } from "../../lib/utils/html.js";
import { NotificationBL } from "../components/notification.js";
import { MenuComponent } from "../components/menu.js";

export class LoginBL extends PopupEditor {
    static _instance;
    static _initApp;
    /** @type {MenuComponent} */
    static Menu;
    static TaskList;
    static _backdrop;

    constructor() {
        super("User");
        this.Entity = {
            AutoSignIn: true,
            username: "johndoe",
            password: "secret",
        };
        this.Name = "Login";
        this.Title = "Đăng nhập";
        window.addEventListener("beforeunload", () => this.NotificationClient?.Close());
        this.Public = true;
    }

    static get Instance() {
        if (!this._instance) {
            this._instance = new LoginBL();
        }
        return this._instance;
    }

    get LoginEntity() {
        return this.Entity;
    }

    SignedInHandler = null;
    InitAppHanlder = null;
    TokenRefreshedHandler = null;

    Render() {
        let oldToken = Client.Token;
        if (!oldToken || new Date(oldToken.RefreshTokenExp) <= Client.EpsilonNow) {
            this.RenderLoginForm();
        } else if (new Date(oldToken.AccessTokenExp) > Client.EpsilonNow) {
            this.InitAppIfEmpty();
        } else if (new Date(oldToken.RefreshTokenExp) > Client.EpsilonNow) {
            Client.RefreshToken().then(newToken => {
                this.InitAppIfEmpty();
            });
        }
    }

    RenderLoginForm() {
        window.clearTimeout(this._renderAwaiter);
        this._renderAwaiter = window.setTimeout(() => {
            Html.Take("#tab-content").Div.ClassName("modal is-open").Event(EventType.KeyPress, e => this.KeyCodeEnter(e));
            this._backdrop = Html.Context;
            Html.Instance.Div.ClassName("modal-container")
                .Div.ClassName("modal-left")
                .H1.ClassName("modal-title").Text("XIN CHÀO").End
                .Div.ClassName("input-block")
                .Label.ClassName("input-label").Text("Tên tài khoản").End
                .Input.Event("input", (e) => this.LoginEntity.username = e.GetInputText()).Value(this.LoginEntity.username).Type("text").End.End
                .Div.ClassName("input-block")
                .Label.ClassName("input-label").Text("Mật khẩu").End
                .Input.Event("input", (e) => this.LoginEntity.password = e.GetInputText()).Value(this.LoginEntity.password).Type("password").End.End
                .Div.ClassName("input-block")
                .Label.ClassName("input-label").Text("Ghi nhớ").End
                .Label.ClassName("checkbox input-small transition-on style2")
                .Checkbox(this.LoginEntity.AutoSignIn).Event("input", (e) => this.LoginEntity.AutoSignIn = e.target.checked).Attr("name", "AutoSignIn").Attr("name", "AutoSignIn").End
                .Span.ClassName("check myCheckbox").End.End.End
                .Div.ClassName("modal-buttons")
                .A.Href("").Text("Quên mật khẩu?").End
                .Button.Id("btnLogin").Event("click", () => this.Login().Done()).ClassName("input-button").Text("Đăng nhập").End.End.End
                .Div.ClassName("modal-right").Render();
            this.Element = Html.Context;
        }, 100);
    }

    /**
     * 
     * @param {Event} event 
     * @returns {void}
     */
    KeyCodeEnter(event) {
        if (event.KeyCodeEnum() !== KeyCodeEnum.Enter) {
            return;
        }
        event.preventDefault();
        document.getElementById("btnLogin").click();
    }

    async Login() {
        let isValid = await this.IsFormValid();
        if (!isValid) {
            return false;
        }
        return this.SubmitLogin();
    }

    SubmitLogin() {
        const login = this.LoginEntity;
        const tcs = new Promise((resolve, reject) => {
            // @ts-ignore
            Client.Instance.SubmitAsync({
                Url: `/api/auth/login`,
                JsonData: JSON.stringify(login),
                IsRawString: true,
                Method: "POST",
                AllowAnonymous: true
            }).then(res => {
                if (!res) {
                    resolve(false);
                    return;
                }
                Toast.Success(`Xin chào!`);
                Client.Token = res.token;
                window.location.reload();
                login.UserName = "";
                login.Password = "";
                this.InitAppIfEmpty();
                this.InitFCM();
                if (this.SignedInHandler) {
                    this.SignedInHandler(Client.Token);
                }
                resolve(true);
                this.Dispose();
            }).catch(e => resolve(false));
        });
        return tcs;
    }

    async ForgotPassword(login) {
        return Client.Instance.PostAsync(login, "/user/ForgotPassword").then(res => {
            if (res) {
                Toast.Warning("An error occurs. Please contact the administrator to get your password!");
            } else {
                Toast.Success("A recovery email has been sent to your email address. Please check and follow the steps in the email!");
            }
            return res;
        });
    }

    InitAppIfEmpty() {
        const systemRoleId = RoleEnum.System;
        // @ts-ignore
        Client.Instance.SystemRole = Client.Token.RoleIds.includes(systemRoleId.toString());
        if (this._initApp) {
            return;
        }
        this._initApp = true;
        this.InitAppHanlder?.(Client.Token);
        const userId = Client.Token.UserId;
        if (!this.NotificationClient) {
            this.NotificationClient = new WebSocketClient("task");
        }

        if (!this.Menu) {
            this.Menu = new MenuComponent();
            this.Menu.Render();
        }
        if (!this.TaskList) {
            this.TaskList = NotificationBL.Instance;
            this.TaskList.Render();
            this.TaskList.DOMContentLoaded = () => {
                document.getElementById("name-user").textContent = Client.Token.UserName;
                document.getElementById("Username-text").textContent = Client.Token.FullName;
                document.getElementById("text-address").textContent = Client.Token.Address;
                Html.Take("#user-image").Src("./image/" + Client.Token.Avatar);
                Html.Take("#img-detail").Src("./image/" + Client.Token.Avatar);
            };
        }
    }


    InitFCM(signout = false) {
        console.log("Init fcm");
        let tenantCode = Client.Token.TenantCode;
        let strUserId = `U${Client.Token.UserId.toString().padStart(7, '0')}`;
    }

    static DiposeAll() {
        while (this.Tabs.length > 0) {
            this.Tabs[0]?.Dispose();
        }
        if (this.MenuComponent) {
            this.MenuComponent.Dispose();
        }
        if (this.TaskList) {
            this.TaskList.Dispose();
        }

        this.MenuComponent = null;
        this.TaskList = null;
    }

    Dispose() {
        this._backdrop.Hide();
        Html.Take(".is-open").Clear();
    }
}
