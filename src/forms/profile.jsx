import "./profile.css";
import React from "react";
import { Client, Page } from "../../lib/index.js";
import { ToastContainer } from "react-toastify";
import { Toast } from "../../lib/toast.js";
import { LoginBL } from "./login.jsx";

export class ProfileBL extends Page {
  constructor() {
    super("User");
    this.Entity = {
      AutoSignIn: true,
      TanentCode: "dev",
      UserName: "",
      Password: "",
    };
    this.Name = "Profile";
    this.Meta = {
      Public: true,
      Label: "Profile",
      Name: "Profile",
      Id: "Profile",
    };
    this.Title = "Profile";
    this.IsRender = true;
    this.TabTitle = "Profile";
    this.Meta.Label = "Login";
    this.Meta.Layout = () => {
      const changePass = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get("current-password");
        const newPassword = formData.get("new-password");

        try {
          const response = await Client.Instance.PostAsync(
            { Password: password, NewPassword: newPassword },
            "/api/User/UpdatePassword"
          );

          if (response) {
            Toast.Success("Password updated successfully.");
            Client.Token = null;
            LoginBL.Instance.Render();
          } else {
            Toast.Warning("Failed to update password.");
          }
        } catch (error) {
          Toast.Success("An error occurred while updating the password.");
        }
      };
      return (
        <>
          <div className="profile-container scroll-content">
            <div className="profile-header">
              <img src={Client.Token.Avatar} alt="Profile Picture" />
              <h2>Profile</h2>
            </div>
            <form>
              <div className="form-section">
                <div className="form-group">
                  <label htmlFor="full-name">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    defaultValue={Client.Token.FullName}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    defaultValue={Client.Token.Email}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    defaultValue={Client.Token.PhoneNumber}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    placeholder="Enter address"
                    defaultValue={Client.Token.Address}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <select>
                    <option value="">Select Department</option>
                    <option value="sales">Sales</option>
                    <option value="hr">Human Resources</option>
                    <option value="it">IT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <input type="text" placeholder="Enter role" />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Save Changes</button>
              </div>
            </form>
            <div className="change-password">
              <h3>Change Password</h3>
              <form onSubmit={changePass}>
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="current-password">Current Password</label>
                    <input
                      type="password"
                      name="current-password"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      name="new-password"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit">Update Password</button>
                </div>
              </form>
            </div>
          </div>
          <ToastContainer />
        </>
      );
    };
    this.Meta.Components = [];
  }

  /** @type {ProfileBL} */
  static get Instance() {
    this._instance = new ProfileBL();
    return this._instance;
  }

  Toggle(value) {
    if (!this.Element) {
      return;
    }
    this._show = value;
    if (!this._show) {
      this.Element.parentElement.style.display = "none";
    } else {
      this.Element.parentElement.style.display = "";
    }
  }
}
