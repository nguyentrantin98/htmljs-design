import { Client } from "../../lib/clients/client.js";
import { WebSocketClient } from "../../lib/clients/websocketClient.js";
import { KeyCodeEnum, RoleEnum } from "../../lib/models/enum.js";
import { Toast } from "../../lib/toast.js";
import { Html } from "../../lib/utils/html.js";
import { MenuComponent } from "../components/menu.js";
import { EditForm } from "../../lib/editForm.js";
import "../../lib/css/login.css";
import React from "react";
import { App } from "../app.jsx";

export class LoginBL extends EditForm {
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
        window.addEventListener("beforeunload", () =>
            this.NotificationClient?.Close()
        );
        this.Public = true;
        this.Meta.Layout = () => (
            <>
                <div className="container-login" view="login" bg={7}>
                    <div className="wrap-login" type="login">
                        <div className="login-form validate-form">
                            <span className="login-form-logo1" />{" "}
                            <span
                                objname="jTitle"
                                className="login-form-title"
                                res-key="FormLogin_Title"
                                style={{ display: "none" }}
                            >
                                Đăng nhập FAST WEB
                            </span>{" "}
                            <span
                                objname="jSubTitle"
                                className="login-form-subtitle"
                                style={{ display: "none" }}
                            />
                            <div
                                className="login-form-inputs login-class"
                                objname="jInputs"
                            >
                                <div className="wrap-input username-wrap validate-input">
                                    <input
                                        objname="jUserName"
                                        className="input ap-lg-input"
                                        type="text"
                                        name="username"
                                        placeholder-key="FormLogin_UserPlaceholder"
                                        placeholder="Số điện thoại/email"
                                    />{" "}
                                    <span
                                        className="error-info"
                                        res-key="FormLogin_UserNotEmpty"
                                    >
                                        Tên đăng nhập không được để trống
                                    </span>
                                </div>
                                <div className="wrap-input pass-wrap validate-input">
                                    <input
                                        objname="jPassword"
                                        className="input ap-lg-input"
                                        type="password"
                                        name="pass"
                                        placeholder-key="FormLogin_PasswordPlaceholder"
                                        placeholder="Mật khẩu"
                                    />{" "}
                                    <span
                                        className="error-info"
                                        res-key="FormLogin_PasswordNotEmpty"
                                    >
                                        Mật khẩu không được để trống
                                    </span>{" "}
                                    <i objname="jBntShowPass" className="btn-show-pass" />
                                </div>
                                <div
                                    objname="jCaptcha"
                                    className="captcha-container"
                                    style={{ display: "none" }}
                                >
                                    <div className="wrap-input captcha-wrap validate-input">
                                        <div className="captcha-box">
                                            <input
                                                objname="jCaptchaInput"
                                                className="input ap-lg-input"
                                                type="text"
                                                name="captcha"
                                                placeholder-key="FormLogin_CaptchaPlaceholder"
                                                placeholder="Mã xác nhận"
                                            />{" "}
                                            <img objname="jCaptchaImage" />{" "}
                                            <i
                                                objname="jBntCaptchaReload"
                                                className="btn-captcha-reload"
                                                title-key="FormLogin_CaptchaReloadTitle"
                                                title="Lấy mã khác"
                                            />
                                        </div>
                                        <span
                                            className="error-info"
                                            res-key="FormLogin_CaptchaNotEmpty"
                                        >
                                            Mã xác nhận không được để trống
                                        </span>
                                    </div>
                                </div>
                                <div
                                    objname="jTextLoginFail"
                                    className="text-login-fail"
                                    res-key="FormLogin_LoginFail"
                                >
                                    Tên đăng nhập hoặc mật khẩu không đúng
                                </div>
                                <div className="text-right" style={{ display: "flex" }}>
                                    <a
                                        objname="jForgot"
                                        className="forgot-password"
                                        target="_blank"
                                        res-key="FormLogin_ForgotPassword"
                                    >
                                        Quên mật khẩu?
                                    </a>
                                    <div style={{ flex: 1 }} />
                                </div>
                            </div>
                            <div className="login-form-sso-callback" state="loading">
                                <div className="sso-icon" />
                                <div className="sso-message">
                                    Đang <b>đăng nhập MISA AMIS</b>
                                </div>
                                <div className="sso-buttons">
                                    <a
                                        objname="jSSORegister"
                                        href="https://amis.misa.vn/register"
                                        style={{ display: "none" }}
                                        className="sso-button sso-button-register"
                                        res-key="SSO_Register"
                                    >
                                        Đăng ký công ty
                                    </a>
                                    <div style={{ height: "1px", width: "8px" }} />
                                    <a
                                        objname="jRelogin"
                                        href="/login"
                                        style={{ display: "none" }}
                                        className="sso-button sso-button-relogin"
                                        res-key="SSO_Relogin"
                                    >
                                        Đăng nhập lại
                                    </a>
                                </div>
                            </div>
                            <div className="container-login-form-btn login-class">
                                <button
                                    data-name="btnLogin"
                                    className="login-form-btn">
                                    Đăng nhập
                                </button>
                            </div>
                            <div className="login-method-container login-class">
                                <div className="sso-method-block">
                                    <div className="sso-title">
                                        <div className="sso-title-line" />
                                        <div className="sso-title-text">Hoặc đăng nhập với</div>
                                        <div className="sso-title-line" />
                                    </div>
                                    <div className="sso-method-list">
                                        <div
                                            className="sso-method-item"
                                            method="Google"
                                            title="Google"
                                        />
                                        <div
                                            className="sso-method-item"
                                            method="Apple"
                                            title="Apple"
                                        />
                                        <div
                                            className="sso-method-item"
                                            method="Microsoft"
                                            title="Microsoft"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="register-block login-class">
                                <span res-key="FormLogin_DontHaveAccount">
                                    Chưa có công ty?{" "}
                                </span>
                                <a
                                    objname="jRegister"
                                    className="register-btn"
                                    target="_blank"
                                    res-key="FormLogin_Register"
                                >
                                    Đăng ký{" "}
                                </a>
                            </div>
                        </div>
                        <div
                            className="tenants-loading"
                            style={{ display: "none" }}
                            objname="jLoadingMark"
                        >
                            <div
                                className="tenants-loading-title"
                                res-key="TenantForm_TitleLoading"
                            >
                                Đang đăng nhập vào công ty
                            </div>
                            <div
                                className="tenants-loading-name"
                                objname="jLoadingName"
                            />
                            <div className="tenants-loading-icon apui-waiting-more" />
                        </div>
                        <div
                            objname="jCopyRight"
                            className="text-center copy-right-text"
                        >
                            Copyright © 2012 - 2024 MISA JSC
                        </div>
                    </div>
                </div>
            </>
        );
        this.Meta.Components = [
            {
                ComponentType: "Button",
                FieldName: "btnLogin",
                OnClick: async () => {
                    await this.Login();
                }
            }
        ]
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
            Html.Take("#app");
            Html.Instance.Div.Id("Login");
            this.Element = Html.Context;
            super.Render();
            return;
        }
        else if (oldToken && new Date(oldToken.AccessTokenExp) > Client.EpsilonNow) {
            App.Instance.RenderLayout().then(() => {
                this.InitAppIfEmpty();
            });
        } else if (
            oldToken &&
            new Date(oldToken.RefreshTokenExp) > Client.EpsilonNow
        ) {
            Client.RefreshToken().then((newToken) => {
                App.Instance.RenderLayout().then(() => {
                    this.InitAppIfEmpty();
                });
            });
        }
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
                AllowAnonymous: true,
            }).then((res) => {
                if (!res) {
                    resolve(false);
                    return;
                }
                Toast.Success(`Xin chào!`);
                Client.Token = res.token;
                login.UserName = "";
                login.Password = "";
                this.InitFCM();
                if (this.SignedInHandler) {
                    this.SignedInHandler(Client.Token);
                }
                resolve(true);
                this.Dispose();
                App.Instance.RenderLayout().then(() => {
                    this.InitAppIfEmpty();
                });
            })
                .catch((e) => resolve(false));
        });
        return tcs;
    }

    async ForgotPassword(login) {
        return Client.Instance.PostAsync(login, "/user/ForgotPassword").then(
            (res) => {
                if (res) {
                    Toast.Warning(
                        "An error occurs. Please contact the administrator to get your password!"
                    );
                } else {
                    Toast.Success(
                        "A recovery email has been sent to your email address. Please check and follow the steps in the email!"
                    );
                }
                return res;
            }
        );
    }

    InitAppIfEmpty() {
        const systemRoleId = RoleEnum.System;
        // @ts-ignore
        Client.Instance.SystemRole = Client.Token.RoleIds.includes(
            systemRoleId.toString()
        );
        if (this._initApp) {
            return;
        }
        this._initApp = true;
        this.InitAppHanlder?.(Client.Token);
        if (!this.NotificationClient) {
            this.NotificationClient = new WebSocketClient("task");
        }
    }

    InitFCM(signout = false) {
        console.log("Init fcm");
        let tenantCode = Client.Token.TenantCode;
        let strUserId = `U${Client.Token.UserId.toString().padStart(7, "0")}`;
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
}
