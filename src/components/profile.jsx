import React, { useState, useEffect, useRef } from "react";
import "./profile.css";
import { Client, TabEditor } from "../../lib";
import { LoginBL } from "../forms/login";
import { unsubscribeToken } from "./firebase";

const Profile = () => {
  const [state, setState] = useState(false);
  const menuRef = useRef(null);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setState(false);
    }
  };

  const handleLogout = (event) => {
    Client.Token = null;
    localStorage.removeItem("UserInfo");
    unsubscribeToken();
    TabEditor.Tabs.forEach((x) => x.Dispose());
    LoginBL.Instance.Render();
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="action" ref={menuRef}>
      <div className="profile avatar" onClick={() => setState(!state)}>
        <img
          src="https://amisplatform.misacdn.net/APIS/PlatformAPI/api/Avatar/8a05ea46-eb2d-4af5-b5da-8863c324c89f/BS27GS4Q.jpg?avatarID=2a14a261-f827-4f35-9861-b922a9001b1f&amp;imageType=jpg&amp;appCode=Accounting&amp;width=64&amp;height=64"
          className="h-full w-full"
        />
      </div>
      <div className={state ? "menu active" : "menu"}>
        <div className="ms-component dropdown-user">
          <div className="con-ms-dropdown--menu ms-dropdown-menu rightx">
            <ul className="ms-component ms-dropdown--menu">
              <div className="list_option list_option_user">
                <div className="header w-full">
                  <div className=" flex user-icon">
                    <div className="mi mi-64 mi-avatar avatar">
                      <img
                        src="https://amisplatform.misacdn.net/APIS/PlatformAPI/api/Avatar/8a05ea46-eb2d-4af5-b5da-8863c324c89f/BS27GS4Q.jpg?avatarID=2a14a261-f827-4f35-9861-b922a9001b1f&amp;imageType=jpg&amp;appCode=Accounting&amp;width=64&amp;height=64"
                        className="h-full w-full"
                      />
                    </div>
                  </div>
                  <div className=" flex user-infor">
                    <div className="header-center">
                      <div className="full-name">
                        {!Client.Token ? "" : Client.Token.FullName}{" "}
                      </div>
                      <div className="infor-account">
                        {!Client.Token ? "" : Client.Token.Email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-lince-payment"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">
                      Giấy phép &amp; Thanh toán
                    </div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-password"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">Đổi mật khẩu</div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-account"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">Thiết lập tài khoản</div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-security"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">Thiết lập bảo mật</div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-introduce-points"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">Giới thiệu nhận thưởng</div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-terms-use"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">Thỏa thuận sử dụng</div>
                  </div>
                </div>
                <div className="loyalty-container flex items-center">
                  <div className="pointer mi mi-24 loyalty-icon mi-privacy"></div>
                  <div className="loyalty-wrap">
                    <div className="loyalty-title">
                      Chính sách quyền riêng tư
                    </div>
                  </div>
                </div>
                <div className="action-button">
                  <div
                    className="loyalty-container logout-action flex items-center"
                    onClick={handleLogout}
                  >
                    <div className="pointer fal fa-sign-out"></div>
                    <div className="loyalty-title">Đăng xuất</div>
                  </div>
                </div>
              </div>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
