import { Component } from "./component";
import { UserSetting } from "./userSeting";

/**
 * Represents a feature.
 * @class
 */
export class Feature {
    /** @type {string} */
    Id = '';
    /** @type {string} */
    Name = '';
    /** @type {string} */
    Label = '';
    /** @type {string} */
    ParentId = '';
    /** @type {number} */
    Order = 0;
    /** @type {string} */
    ClassName = '';
    /** @type {string} */
    Style = '';
    /** @type {string} */
    StyleSheet = '';
    /** @type {string} */
    Script = '';
    /** @type {string} */
    Events = '';
    /** @type {string} */
    Icon = '';
    /** @type {boolean} */
    IsDivider = false;
    /** @type {boolean} */
    IsGroup = false;
    /** @type {boolean} */
    IsMenu = false;
    /** @type {boolean} */
    IsPublic = false;
    /** @type {boolean} */
    StartUp = false;
    /** @type {string} */
    ViewClass = '';
    /** @type {string} */
    EntityId = '';
    /** @type {string} */
    Description = '';
    /** @type {boolean} */
    Active = false;
    /** @type {Date} */
    InsertedDate = new Date();
    /** @type {string} */
    InsertedBy = '';
    /** @type {Date} */
    UpdatedDate = new Date();
    /** @type {string} */
    UpdatedBy = '';
    /** @type {boolean} */
    IsSystem = false;
    /** @type {boolean} */
    IgnoreEncode = false;
    /** @type {boolean} */
    InheritParentFeature = false;
    /** @type {boolean} */
    DeleteTemp = false;
    /** @type {boolean} */
    CustomNextCell = false;
    /** @type {boolean} */
    IsFullScreen = false;
    /** @type {boolean} */
    IsSmallScreen = false;
    /** @type {boolean} */
    LoadEntity = false;
    /** @type {boolean} */
    IsLock = false;
    /** @type {string} */
    Html = '';
    /** @type {Component[]} */
    Components = [];
    /** @type {any} */
    Layout;
    /** @type {HTMLElement} */
    ParentElement;
    /** @type {Feature[]} */
    InverseParent = [];
    /** @type {UserSetting[]} */
    UserSettings = [];
}