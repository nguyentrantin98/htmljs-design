import { Client } from "../clients/client.js";

/**
 * Represents an authentication token with user details and permissions.
 */
export class Token {
    /** @type {string|null} User's unique identifier */
    UserId = null;

    /** @type {string|null} Identifier for the user's cost center */
    TenantCode = null;

    /** @type {string|null} User's username */
    UserName = null;

    /** @type {string|null} User's email address */
    Email = null;

    /** @type {string|null} User's first name */
    FirstName = null;

    /** @type {string|null} User's last name */
    LastName = null;

    /** @type {string|null} User's full name */
    FullName = null;

    /** @type {string|null} User's address */
    Address = null;

    /** @type {string|null} URL to the user's avatar image */
    Avatar = null;

    /** @type {string|null} Access token for user authentication */
    AccessToken = null;

    /** @type {string|null} Refresh token for renewing the access token */
    RefreshToken = null;

    /**
     * Expiration time of the access token.
     * @type {Date|null}
     */
    AccessTokenExp = null;

    /**
     * Expiration time of the refresh token.
     * @type {Date|null}
     */
    RefreshTokenExp = null;

    /** @type {string|null} Hashed password for the user */
    HashPassword = null;

    /** @type {string|null} Recovery token for password reset */
    Recovery = null;

    /**
     * Vendor information associated with the user.
     * @type {any}
     */
    Vendor = null;

    /** @type {Array<string>|null} List of role identifiers for the user */
    RoleIds = [];

    /** @type {Array<string>|null} List of role names for the user */
    RoleNames = [];

    /** @type {Array<string>|null} List of center identifiers for the user */
    CenterIds = [];

    /** @type {string|null} User's social security number */
    Ssn = null;

    /** @type {string|null} User's phone number */
    PhoneNumber = null;

    /** @type {string|null} Identifier for the user's team */
    TeamId = null;

    /** @type {string|null} Identifier for the user's partner entity */
    PartnerId = null;

    /** @type {string|null} Identifier for the user's regional entity */
    RegionId = null;

    /** @type {object|null} Additional arbitrary data associated with the user */
    Additional = null;

    /**
     * Date and time the user signed in.
     * @type {Date|null}
     */
    SigninDate = new Date();

    /** @type {string|null} Tenant code for the user's tenant */
    TenantCode = null;

    /** @type {string|null} Environment context for the user session */
    Env = null;

    /** @type {string|null} Connection key used for database connections */
    ConnKey = null;
    
    SystemRole = false;

    constructor() {
        // Default values can be initialized here if different from null or empty.
        this.TenantCode = Client.Tenant; // Assuming Client.Tenant is accessible
        this.Env = Client.Env;          // Assuming Client.Env is accessible
        this.ConnKey = Client.MetaConn; // Assuming Client.MetaConn is accessible
    }

    /**
     * @param {string} token
     */
    static parse(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const data = JSON.parse(jsonPayload);
        return data;
    }
}
