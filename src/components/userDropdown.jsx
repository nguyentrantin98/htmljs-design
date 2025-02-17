import React from "react";
import DropdownComponent from "./DropdownComponent";
import { ChromeTabs, Client, TabEditor } from "../../lib";
import { LoginBL } from "../forms/login";
import { ProfileBL } from "../forms/profile";

const UserDropdown = ({ editForm }) => {
  const handleLogout = (event) => {
    deleteMethod();
  };

  const deleteMethod = () => {
    Client.Token = null;
    localStorage.removeItem("UserInfo");
    ChromeTabs.tabs.forEach((x) => x.content.Dispose());
    LoginBL.Instance.Render();
  };

  const toggleContent = (
    <>
      <div className="label">
        <span></span>
        <div>{Client.Token.FullName}</div>
      </div>
      <img
        className="img-user"
        src={Client.Token.Avatar || "/assets/images/avatar1.png"}
        alt="user"
        srcSet=""
      />
    </>
  );

  const dropdownContent = (
    <>
      <a
        className="dropdown-item"
        onClick={() => {
          var check = ChromeTabs.tabs.find(
            (x) => x.content instanceof ProfileBL
          );
          if (check) {
            check.content.Focus();
            return;
          }
          ProfileBL.Instance.Render();
        }}
      >
        <i className="fal fa-user mr-1"></i> Profile
      </a>
      <a className="dropdown-item">
        <i className="fal fa-cog mr-1"></i> Setting
      </a>
      <a onClick={handleLogout} className="dropdown-item">
        <i className="fal fa-sign-out mr-1"></i> Logout
      </a>
    </>
  );

  return (
    <DropdownComponent
      toggleContent={toggleContent}
      dropdownContent={dropdownContent}
      className="user-dropdown dropdown-menu-end"
    />
  );
};

export default UserDropdown;
