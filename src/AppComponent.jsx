import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { ChromeTabs, Client } from "../lib";
import UserDropdown from "./components/userDropdown.jsx";
import NotificationDropdown from "./components/NotificationDropdown.jsx";
import LangComponent from "./components/LangComponent.jsx";
import store from "./redux/store.js";
import { Provider } from "react-redux";
import UserActive from "./components/UserActive.jsx";
import ChatBot from "./components/ChatBot.jsx";
const AppComponent = ({ editForm }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  useEffect(() => {
    const checkIsMobile = () => {
      const matches = window.matchMedia(
        "only screen and (max-width: 1024px)"
      ).matches;
      setIsMobile(matches);
      const body = document.querySelector("body");
      if (matches) {
        body.classList.add("collapse-sidebar");
      } else {
        body.classList.remove("collapse-sidebar");
      }
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const actionToggle = (e) => {
    e.preventDefault();
    var t = document.querySelector("body");
    var main = document.querySelector(".main-sidebar");
    if (t.classList.contains("collapse-sidebar")) {
      t.classList.add("expand-sidebar");
      t.classList.remove("collapse-sidebar");
      if (isMobile) {
        main.focus();
      }
    } else {
      t.classList.remove("expand-sidebar");
      t.classList.add("collapse-sidebar");
    }
  };

  const actionBlur = (e) => {
    e.preventDefault();
    var t = document.querySelector("body");
    if (!t.classList.contains("expand-sidebar")) {
      return;
    }
    actionToggle(e);
  };

  const updateView = () => {
    editForm.OpenTab("chat-editor", {});
    window.setTimeout(() => {
      var tab = ChromeTabs.tabs.find((x) => x.content.Show);
      var chat = tab.content.ChildCom.find((x) => x.ComponentType == "Chat");
      if (chat) {
        chat.UpdateView();
      }
    }, 500);
  };

  return (
    <Provider store={store}>
      <div className="shadow-header"></div>
      <header className="header-navbar fixed">
        <div className="header-wrapper">
          <div className="header-left">
            <div
              className="sidebar-toggle action-toggle"
              onClick={actionToggle}
            >
              <i className="fal fa-bars"></i>
            </div>
          </div>
          <div className="chrome-tabs">
            <div className="chrome-tabs-content"></div>
          </div>
          <div className="header-content">
            <LangComponent />
            <UserActive />
            <div className="notification dropdown">
              <a
                data-bs-toggle="dropdown"
                aria-expanded="false"
                onClick={async () => {
                  var tab = ChromeTabs.tabs.find((x) => x.content.Show);
                  if (tab) {
                    var popupDetail = tab.content.Children.find((x) => x.Popup);
                    if (popupDetail) {
                      var popup2Detail = popupDetail.Children.find(
                        (x) => x.Popup
                      );
                      if (popup2Detail) {
                        var form = {
                          Id: editForm.Uuid7.NewGuid(),
                          RecordId: popup2Detail.Entity.Id,
                          FormatChat: popup2Detail.Entity.FormatChat,
                          Icon: popup2Detail.Entity.Icon,
                          EntityId: popup2Detail.Meta.EntityId,
                        };
                        var createConvert = await Client.Instance.PostAsync(
                          form,
                          "/api/Conversation"
                        );
                        var tab1 = ChromeTabs.tabs.find(
                          (x) => x.content.Meta.Name == "chat-editor"
                        );
                        if (tab1) {
                          tab1.content.Dispose();
                          editForm.OpenTab("chat-editor", createConvert);
                        } else {
                          editForm.OpenTab("chat-editor", createConvert);
                        }
                      } else {
                        var form = {
                          Id: editForm.Uuid7.NewGuid(),
                          RecordId: popupDetail.Entity.Id,
                          FormatChat: popupDetail.Entity.FormatChat,
                          Icon: popupDetail.Entity.Icon,
                          EntityId: popupDetail.Meta.EntityId,
                        };
                        var createConvert = await Client.Instance.PostAsync(
                          form,
                          "/api/Conversation"
                        );
                        var tab1 = ChromeTabs.tabs.find(
                          (x) => x.content.Meta.Name == "chat-editor"
                        );
                        if (tab1) {
                          tab1.content.Dispose();
                          editForm.OpenTab("chat-editor", createConvert);
                        } else {
                          editForm.OpenTab("chat-editor", createConvert);
                        }
                      }
                    } else {
                      updateView();
                    }
                  } else {
                    updateView();
                  }
                }}
              >
                <i className="far fa-envelope"></i>
              </a>
            </div>
            <NotificationDropdown />
            <UserDropdown editForm={editForm} />
          </div>
        </div>
      </header>
      <nav className="main-sidebar ps-menu" onBlur={actionBlur} tabIndex="-1">
        <div className="sidebar-header">
          <a className="text">
            <img src={Client.Token.Vendor.Logo} />
          </a>
        </div>
        <div className="search-content p-2"></div>
        <div className="sidebar-content"></div>
      </nav>
      <div className="main-content" id="tab-content"></div>
      <div className="settings">
        <div className="settings-content">
          <ul>
            <li className="fix-header">
              <div className="fix-header-wrapper">
                <div className="form-check form-switch lg">
                  <a
                    href="https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx"
                    target="_blank"
                  >
                    Vietcombank Exchange
                  </a>
                </div>
              </div>
            </li>
          </ul>
          <ul className="exchange-rate"></ul>
        </div>
      </div>
      <ToastContainer />
      <ChatBot />
    </Provider>
  );
};
export default AppComponent;
