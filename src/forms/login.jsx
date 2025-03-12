import React from "react";
import { ToastContainer } from "react-toastify";
import { Client, Html, EditForm } from "../../lib";
import { KeyCodeEnum, RoleEnum } from "../../lib/models/enum.js";
import { Toast } from "../../lib/toast.js";
import { MenuComponent } from "../components/menu.js";
import { RegisterBL } from "./register.jsx";
import "../../lib/css/login.css";
import { App } from "../app.jsx";
import { WebSocketClient } from "../../lib/clients/index.js";

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
      TanentCode: "dev",
      UserName: "",
      Password: "",
    };
    this.Name = "Login";
    this.Title = "Đăng nhập";
    window.addEventListener("beforeunload", () =>
      this.NotificationClient?.Close()
    );
    this.Meta.IsPublic = true;
    this.Meta.Label = "Login";
    this.Title = "Login";
    this.Meta.Layout = () => {
      const logIn = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const tanentCode = formData.get("TanentCode");
        const userName = formData.get("UserName");
        const password = formData.get("Password");
        const login = {
          TanentCode: tanentCode,
          UserName: userName,
          Password: password,
          AutoSignIn: true,
        };
        try {
          var res = await Client.Instance.SubmitAsync({
            Url: `/api/auth/login?t=` + tanentCode,
            JsonData: JSON.stringify(login),
            IsRawString: true,
            Method: "POST",
            AllowAnonymous: true,
          });
          Client.Token = res;
          this.InitFCM();
          if (this.SignedInHandler) {
            this.SignedInHandler(Client.Token);
          }
          this.Dispose();
          window.history.pushState(null, "Home", "");
          App.Instance.RenderLayout()
            .then(() => {
              this.InitAppIfEmpty();
            })
            .finally(() => {
              window.setTimeout(() => {
                Toast.Success(`Hello ` + Client.Token.FullName);
              }, 200);
            });
        } catch (error) {
          Toast.Warning(error.message);
        }
      };
      return (
        <>
          <div className="container-login" view="login" bg={100}>
            <div className="wrap-login" type="login">
              <div className="login-form validate-form">
                <span className="login-form-logo1" />
                <span objname="jTitle" className="login-form-title">
                  LOGISTICS LOGIN
                </span>
                <form
                  className="login-form-inputs login-class"
                  objname="jInputs"
                  onSubmit={logIn}
                >
                  <div className="wrap-input username-wrap validate-input">
                    <label>Company name</label>
                    <input
                      className="input ap-lg-input"
                      type="text"
                      name="TanentCode"
                    />
                  </div>
                  <div className="wrap-input username-wrap validate-input">
                    <label>User name</label>
                    <input
                      className="input ap-lg-input"
                      type="text"
                      name="UserName"
                    />
                  </div>
                  <div className="wrap-input pass-wrap validate-input">
                    <label>Password</label>
                    <input
                      className="input ap-lg-input"
                      name="Password"
                      type="password"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document
                            .querySelector(".login-form-inputs")
                            .dispatchEvent(
                              new Event("submit", { bubbles: true })
                            );
                        }
                      }}
                    />
                  </div>
                  <div className="text-right" style={{ display: "flex" }}>
                    <a
                      objname="jForgot"
                      className="forgot-password"
                      target="_blank"
                      res-key="FormLogin_ForgotPassword"
                    >
                      Forgot password?
                    </a>
                    <div style={{ flex: 1 }} />
                  </div>
                  <div className="container-login-form-btn login-class">
                    <button type="submit" className="login-form-btn">
                      Login
                    </button>
                  </div>
                  <div className="register-block login-class">
                    <span res-key="FormLogin_DontHaveAccount">
                      Dont have account?
                    </span>
                    <a
                      objname="jRegister"
                      className="register-btn"
                      target="_blank"
                      res-key="FormLogin_Register"
                    >
                      Register
                    </a>
                  </div>
                </form>
              </div>
              <div objname="jCopyRight" className="text-center copy-right-text">
                Copyright © 2024
              </div>
            </div>
          </div>
          <ToastContainer />
        </>
      );
    };
  }

  /** @type {LoginBL} */
  static get Instance() {
    this._instance = new LoginBL();
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
    event.stopPropagation();
    document.getElementById("btnLogin").click();
  }

  async Login() {
    debugger;
    let isValid = await this.IsFormValid();
    if (!isValid) {
      return false;
    }
    return this.SubmitLogin();
  }

  async Register() {
    RegisterBL.Instance.Render();
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
      })
        .then((res) => {
          if (!res) {
            resolve(false);
            return;
          }
          Client.Token = res;
          this.InitFCM();
          if (this.SignedInHandler) {
            this.SignedInHandler(Client.Token);
          }
          resolve(true);
          this.Dispose();
          window.history.pushState(null, "Home", "");
          App.Instance.RenderLayout()
            .then(() => {
              this.InitAppIfEmpty();
            })
            .finally(() => {
              window.setTimeout(() => {
                Toast.Success(`Hello ` + Client.Token.FullName);
              }, 200);
            });
        })
        .catch(() => {
          resolve(false);
          Toast.Warning("Invalid username or password");
        });
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
    MenuComponent.Instance.Render();
    EditForm.NotificationClient = new WebSocketClient(
      "api.forwardx.vn/task"
    );
  }

  ToastOki() {
    Toast.Success("OKi");
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
