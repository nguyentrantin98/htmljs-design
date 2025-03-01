import React from "react";
import { ToastContainer } from "react-toastify";
import { Client, Html, EditForm } from "../../lib";
import { WebSocketClient } from "../../lib/clients/websocketClient.js";
import { KeyCodeEnum, RoleEnum } from "../../lib/models/enum.js";
import { Toast } from "../../lib/toast.js";
import { MenuComponent } from "../components/menu.js";
import "../../lib/css/login.css";
import { App } from "../app.jsx";
import { LoginBL } from "./login.jsx";

export class RegisterBL extends EditForm {
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
      username: "johndoe2",
      password: "secret",
    };
    this.Name = "Register";
    this.Title = "Register";
    window.addEventListener("beforeunload", () =>
      this.NotificationClient?.Close()
    );
    this.Public = true;
    this.Meta.Layout = () => (
      <>
        <div className="container-login" view="login" bg={7}>
          <div className="wrap-login" type="login">
            <div className="login-form validate-form">
              <span className="login-form-logo1" />
              <div className="login-form-inputs login-class" objname="jInputs">
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="CompanyName"
                    placeholder="Company Name"
                  />
                </div>
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="TanentCode"
                    placeholder="Tanent Code"
                  />
                </div>
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="TaxCode"
                    placeholder="Tax code"
                  />
                </div>
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="Email"
                    placeholder="Email"
                  />
                </div>
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="PhoneNumber"
                    placeholder="Phone Number"
                  />
                </div>
                <div className="wrap-input username-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    type="text"
                    name="UserName"
                    placeholder="Số điện thoại/email"
                  />
                </div>
                <div className="wrap-input pass-wrap validate-input">
                  <input
                    className="input ap-lg-input"
                    name="Password"
                    placeholder="Mật khẩu"
                  />
                  <i objname="jBntShowPass" className="btn-show-pass" />
                </div>
              </div>
              <div className="container-login-form-btn login-class">
                <button name="btnRegister" className="login-form-btn">
                  Đăng ký
                </button>
              </div>
              <div className="register-block login-class">
                <span res-key="FormLogin_DontHaveAccount">
                  Chưa đã có công ty?
                </span>
                <a
                  objname="jRegister"
                  className="register-btn"
                  target="_blank"
                  res-key="FormLogin_Register"
                  onClick={() => this.Login()}
                >
                  Đăng nhập
                </a>
              </div>
            </div>
            <div objname="jCopyRight" className="text-center copy-right-text">
              Copyright © 2012 - 2024 TINJS JSC
            </div>
          </div>
        </div>
        <ToastContainer />
      </>
    );
    this.Meta.Components = [
      {
        ComponentType: "Button",
        FieldName: "btnRegister",
        OnClick: async () => {
          await this.Register();
        },
      },
      {
        ComponentType: "Input",
        FieldName: "CompanyName",
        Label: "Company Name",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Input",
        FieldName: "Email",
        Label: "Email",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Input",
        FieldName: "TaxCode",
        Label: "Tax Code",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Input",
        FieldName: "TanentCode",
        Label: "Tanent Code",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Input",
        FieldName: "PhoneNumber",
        Label: "Phone Number",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Input",
        FieldName: "UserName",
        Label: "User Name",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      },
      {
        ComponentType: "Password",
        Label: "Password",
        FieldName: "Password",
        Validation: `[{"Rule": "required", "Message": "{0} is required"}]`
      }
    ];
  }

  /** @type {RegisterBL} */
  static get Instance() {
    this._instance = new RegisterBL();
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
      this.Element = Html.Context;
      super.Render();
      return;
    } else if (
      oldToken &&
      new Date(oldToken.AccessTokenExp) > Client.EpsilonNow
    ) {
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

  async Register() {
    let isValid = await this.IsFormValid();
    if (!isValid) {
      return false;
    }
    return this.SubmitRegister();
  }

  async Login() {
    LoginBL.Instance.Render();
  }

  SubmitRegister() {
    const login = this.LoginEntity;
    const tcs = new Promise((resolve, reject) => {
      // @ts-ignore
      Client.Instance.SubmitAsync({
        Url: `/api/auth/register`,
        JsonData: JSON.stringify(login),
        IsRawString: true,
        Method: "POST",
        AllowAnonymous: true,
      }).then((res) => {
        if (!res) {
          resolve(false);
          return;
        }
        Client.Token = res.token;
        login.UserName = "";
        login.Password = "";
        this.InitFCM();
        if (this.SignedInHandler) {
          this.SignedInHandler(Client.Token);
        }
        resolve(true);
        this.Dispose();
        App.Instance.RenderLayout()
          .then(() => {
            this.InitAppIfEmpty();
          })
          .finally(() => {
            window.setTimeout(() => {
              Toast.Success(`Xin chào ` + Client.Token.FullName);
            }, 200);
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
