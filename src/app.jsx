import { Page, EditForm, ButtonPdf, Feature } from "../lib";
import { MenuComponent } from "./components/menu";
import React from "react";
import { Profile } from "./components/profile";
import { Lang } from "./components/lang";
import { UserActive } from "./components/userActive";
import { LoginBL } from "./forms/login.jsx";
import { ComponentExt } from "../lib/utils/componentExt";
import { Client } from "../lib/clients";
import { Utils } from "../lib/utils/utils";
import ChromeTabs from "../lib/chrometab.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export class App {
  /** @type {Page} */
  static MyApp;
  /** @type {App} */
  static _instance;
  /** @type {App} */
  static get Instance() {
    if (!this._instance) {
      this._instance = new App();
    }
    return this._instance;
  }
  /** @type {Feature} */
  Meta;
  constructor() {
    this.Meta = new Feature;
    this.Meta.ParentElement = document.getElementById("app");
    this.Meta.Layout = () => (
      <>
        <div className="wrapper">
          <nav className="main-header navbar navbar-expand navbar-light">
            <div className="chrome-tabs">
              <div className="chrome-tabs-content"></div>
              <div className="chrome-tabs-bottom-bar"></div>
            </div>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item dropdown" id="lang-active" data-name="Lang"></li>
              <li className="nav-item dropdown" id="user-active" data-name="UserActive"></li>
              <li className="nav-item dropdown" id="notification-list"></li>
              <li className="nav-item dropdown profile-info1" id="profile-info1" data-name="Profile"></li>
            </ul>
          </nav>
          <aside className="main-sidebar main-sidebar-custom sidebar-light-info elevation-1">
            <a href="/" className="brand-link">
              <img
                src="https://fastweb.softek.com.vn/image/softek.png"
                alt="F.A.S.T PRO"
                className="brand-image"
              />
              <span className="brand-text font-weight-light">F.A.S.T PRO</span>
            </a>
            <div className="sidebar">
              <div className="form-inline" style={{ marginTop: "6px" }}>
                <div className="input-group">
                  <input
                    className="form-control form-control-sidebar"
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                  />
                </div>
              </div>
              <nav className="mt-2" id="menu" data-name="Menu"></nav>
            </div>
          </aside>
          <div
            className="content-wrapper"
            id="tab-content">
          </div>
          <aside className="control-sidebar control-sidebar-light"></aside>
        </div>
        <ToastContainer />
      </>
    );
    this.Meta.Components = [
      {
        ComponentType: () => {
          return new Profile();
        },
        FieldName: "Profile",
      },
      {
        ComponentType: () => {
          return new MenuComponent();
        },
        FieldName: "Menu",
      },
      {
        ComponentType: () => {
          return new Lang();
        },
        FieldName: "Lang",
      },
      {
        ComponentType: () => {
          return new UserActive();
        },
        FieldName: "UserActive",
      }
    ];
    this.MyApp = new Page();
    this.MyApp.EditForm = new EditForm("MyApp");
    this.MyApp.EditForm.Policies = [
      {
        CanRead: true,
      },
    ];
    this.MyApp.Meta = this.Meta;
    this.MyApp.EditForm.Meta = this.Meta;
  }

  Init() {
    LoginBL.Instance.Render();
  }

  async RenderLayout() {
    await this.MyApp.Render();
    var el = document.querySelector('.chrome-tabs')
    if (el != null) {
      ChromeTabs.init(el);
    }
    this.LoadByFromUrl();
  }

  LoadByFromUrl() {
    const fName = this.GetFeatureNameFromUrl() || "";
    if (!fName) {
      return;
    }
    ComponentExt.InitFeatureByName(fName, true).Done();
    return fName;
  }

  /**
  * @returns {string|null}
  */
  GetFeatureNameFromUrl() {
    let feature = window.location.pathname.toLowerCase().replace(Client.BaseUri.toLowerCase(), "");
    if (feature.startsWith(Utils.Slash)) {
      feature = feature.substring(1);
    }
    if (!feature.trim() || feature == undefined) {
      return null;
    }
    return feature;
  }
}
App.Instance.Init()