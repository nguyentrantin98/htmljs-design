import { SqlViewModel } from "../models/sqlViewModel.js";
import { BadGatewayQueue } from "../models/badGatewayQueue.js";
import { Token } from "../models/token.js";
import { Utils } from "../utils/utils.js";
import { PatchVM } from "../models/patch.js";
import { EmailVM } from "../models/emailVM.js";
import { Toast } from "../toast.js";
import { Path } from "../utils/path.js";
import { Entity } from "../models/enum.js";
import { Action } from "../models/action.js";

export class Client {
    /** @type {Entity[]} */
    static Entities = [];
    static EpsilonNow = new Date(Date.now() + (1 * 60 * 1000));
    static ErrorMessage = "Hệ thống đang cập nhật vui lòng chờ trong 30s!";
    static ModelNamespace;
    static entities;
    static token;
    static GuidLength = 36;
    // @ts-ignore
    static Host = (document.head.host?.content || window.location.host).toLowerCase();
    // @ts-ignore
    static BaseUri = (document.head.baseUri?.content || window.location.origin).toLowerCase();
    // @ts-ignore
    static IsPortal = document.head.startup?.content !== "admin";
    // @ts-ignore
    static MetaConn = document.head.metaKey?.content || "default";
    // @ts-ignore
    static DataConn = document.head.dataConn?.content || "bl";
    // @ts-ignore
    static Tenant = document.head.tenant?.content || "System";
    // @ts-ignore
    static Env = document.head.env?.content || "test";
    // @ts-ignore
    static FileFTP = document.head.file?.content || "/user";
    // @ts-ignore
    /** @type {string} */
    static api = (() => {
        const metaTag = Array.from(document.head.childNodes).find(x => x.name === "api");
        return metaTag ? metaTag.content : "http://localhost:8005";
    })();
    // @ts-ignore
    static Config = document.head.config?.content || "";
    static BadGatewayRequest = new BadGatewayQueue();
    static UnAuthorizedEventHandler = new Action();
    static SignOutEventHandler = new Action();
    // @ts-ignore
    static get Origin() { return document.head.origin?.content || window.location.origin; }
    _nameSpace;
    _config;
    CustomPrefix = (() => {
        const prefixElement = Array.from(document.head.children).find(x => x instanceof HTMLMetaElement && x.name === "prefix");
        // @ts-ignore
        return prefixElement?.content;
    })();

    constructor(entityName, ns = "", config = false) {
        this._nameSpace = ns;
        this._config = config;
        if (this._nameSpace && this._nameSpace.charAt(this._nameSpace.length - 1) !== '.') {
            this._nameSpace += '.';
        }
        this.EntityName = entityName;
    }

    /** @type {Client} */
    static _instance;
    /** @type {Client} */
    static get Instance() {
        if (!Client._instance) {
            Client._instance = new Client();
        }
        return Client._instance;
    }
    /** @type {Token} */
    static get Token() {
        return JSON.parse(localStorage.getItem('UserInfo'));
    }

    static set Token(value) {
        localStorage.setItem('UserInfo', JSON.stringify(value));
    }
    static get SystemRole() {
        if (typeof Token.parse(Client.Token.AccessToken).Role === 'string') {
            return Token.parse(Client.Token.AccessToken).Role.toLowerCase() == "admin";
        }
        else {
            return Token.parse(Client.Token.AccessToken).Role.some(x => x.toLowerCase() == "admin");
        }
    }

    /**
     * @param {SqlViewModel} vm
     */
    async UserSvc(vm, annonymous = false) {
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            Value: JSON.stringify(vm),
            Url: Utils.UserSvc,
            IsRawString: true,
            Method: "POST",
            AllowAnonymous: annonymous
        };
        return this.SubmitAsync(data);
    }

    async ComQuery(vm) {
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            Value: JSON.stringify(vm),
            Url: Utils.ComQuery,
            IsRawString: true,
            Method: "POST"
        };
        return this.SubmitAsync(data);
    }

    /**
     * Get Id list that satisfied the condition query
     * @param {SqlViewModel} sqlVm 
     * @returns {Promise<string[]>} - Id list
     */
    GetIds(sqlVm) {
        let ok, no;
        const promise = new Promise((resolve, reject) => {
            ok = resolve;
            no = reject;
        });
        sqlVm.Select = "ds.Id";
        sqlVm.Count = false;
        sqlVm.SkipXQuery = true;
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            Url: Utils.ComQuery,
            Value: JSON.stringify(sqlVm),
            IsRawString: true,
            Method: "POST"
        };
        this.SubmitAsync(data).then(ds => {
            /** @type {string[]} */
            const res = (ds.length === 0 || ds[0].length === 0)
                ? []
                : ds[0]?.map((/** @type {{ Id: string; }} */ x) => x.Id);
            ok(res);
        }).catch(no);
        return promise;
    }

    /**
     * 
     * @param {XHRWrapper} options 
     * @returns 
     */
    async SubmitAsyncWithToken(options) {
        const isNotFormData = !options.FormData;
        const tcs = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            if (!options.Headers && !options.FormData) {
                options.Headers = {
                    "Content-Type": "application/json"
                };
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== XMLHttpRequest.DONE) return;
                if (xhr.status >= 200 && xhr.status < 300) {
                    ProcessSuccessRequest(options, resolve, xhr);
                } else {
                    ErrorHandler(options, reject, xhr);
                }
            };
            if (options.ProgressHandler !== undefined) {
                xhr.addEventListener("progress", options.ProgressHandler);
            }
            xhr.open(options.Method, Client.api + (options.FinalUrl ?? options.Url), true);
            if (!options.AllowAnonymous) {
                xhr.setRequestHeader("Authorization", "Bearer " + Client.Token?.AccessToken);
            }
            if (options.Headers) {
                for (const [key, value] of Object.entries(options.Headers)) {
                    xhr.setRequestHeader(key, value);
                }
            }
            if (isNotFormData) {
                xhr.send(options.JsonData);
            } else {
                xhr.send(options.FormData);
            }
        });
        return tcs;
    }

    /**
     * 
     * @param {XHRWrapper} options 
     * @returns 
     */
    async SubmitAsync(options) {
        if (!options.AllowAnonymous) {
            await Client.RefreshToken();
        }
        return await this.SubmitAsyncWithToken(options);
    }

    async FirstOrDefaultAsync(filter = null, clearCache = false, addTenant = false) {
        const headers = ClearCacheHeader(clearCache);
        // @ts-ignore
        const res = await this.SubmitAsync({
            Value: null,
            AddTenant: addTenant,
            Url: filter,
            Headers: headers,
            Method: "GET"
        });
        return res?.Value?.[0];
    }

    /**
     * @param {string} table
     * @param {string} connKey
     * @param {string[]} ids
     */
    async GetByIdAsync(table, ids) {
        const data = {
            JsonData: JSON.stringify({ Table: table, Id: ids }),
            Url: Utils.ComQuery,
            IsRawString: true,
            Method: "POST"
        };
        return this.SubmitAsync(data);
    }
    async NotificationUser(entity, ...user) {
        const data = {
            JsonData: JSON.stringify({ Entity: entity, Rule: user }),
            Url: "/api/feature/notificationuser",
            IsRawString: true,
            Method: "POST"
        };
        return this.SubmitAsync(data);
    }
    async NotificationRole(entity, ...role) {
        const data = {
            JsonData: JSON.stringify({ Entity: entity, Rule: role }),
            Url: "/api/feature/notificationrole",
            IsRawString: true,
            Method: "POST"
        };
        return this.SubmitAsync(data);
    }
    /**
     * @param {string} name
     */
    async GetService(name) {
        const data = {
            JsonData: JSON.stringify({ Name: name }),
            Url: "/api/feature/getService",
            Method: "POST"
        };
        return this.SubmitAsync(data);
    }

    async PostAsync(value, subUrl = "", annonymous = false) {
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            JsonData: JSON.stringify(value),
            Url: subUrl,
            Method: "POST",
            AllowAnonymous: annonymous,
        };
        return this.SubmitAsync(data);
    }

    /**
     * 
     * @param {PatchVM | PatchVM[]} value 
     * @param {function} errHandler 
     * @param {boolean} annonymous 
     * @returns {Promise<number>} Effected rows in the database
     */
    async PatchAsync(value, errHandler = null, annonymous = false) {
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            JsonData: JSON.stringify(value),
            IsRawString: true,
            Url: Utils.PatchSvc,
            Headers: { "Content-type": "application/json" },
            Method: "PATCH",
            AllowAnonymous: annonymous,
            ErrorHandler: errHandler
        };
        return this.SubmitAsync(data);
    }

    async PostFilesAsync(file, url = "", progressHandler = null) {
        const formData = new FormData();
        formData.append("file", file);
        /** @type {XHRWrapper} */
        // @ts-ignore
        const data = {
            FormData: formData,
            File: file,
            ProgressHandler: progressHandler,
            Method: "POST",
            Url: url
        };
        return this.SubmitAsync(data);
    }

    /**
     * @param {EmailVM} email
     */
    async SendMail(email) {
        // @ts-ignore
        return this.SubmitAsync({
            Value: email,
            Method: "POST",
            Url: "Email"
        });
    }

    /**
     * @param {string[]} ids
     * @param {string} table
     * @param {string} connKey
     */
    async DeactivateAsync(ids, table, connKey) {
        const vm = {
            Ids: ids,
            Params: table,
            MetaConn: Client.MetaConn,
            DataConn: connKey || Client.DataConn
        };
        // @ts-ignore
        return this.SubmitAsync({
            Url: Utils.DeactivateSvc,
            Value: JSON.stringify(vm),
            Method: "DELETE",
            IsRawString: true,
            Headers: {
                "Content-type": "application/json"
            }
        });
    }

    async HardDeleteAsync(ids, table, dataConn, connKey = null) {
        const vm = {
            Table: table,
            Delete: [
                {
                    Table: table,
                    Ids: ids
                }
            ],
        };
        // @ts-ignore
        return this.SubmitAsync({
            Url: Utils.DeleteSvc,
            JsonData: JSON.stringify(vm),
            Method: "DELETE",
            IsRawString: true,
            Headers: {
                "Content-type": "application/json"
            }
        });
    }

    static async LoadScript(src) {
        const scriptExists = Array.from(document.body.children).some(x => x instanceof HTMLScriptElement && x.src.split("/").pop() === src.split("/").pop());
        if (scriptExists) return true;
        const tcs = new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = src;
            script.addEventListener("load", () => {
                resolve(true);
            });
            script.onerror = () => {
                resolve(true);
                return false;
            };
            document.body.appendChild(script);
        });
        return tcs;
    }

    static async LoadLink(src) {
        const linkExists = Array.from(document.head.children).some(x => x instanceof HTMLLinkElement && x.href.replace(document.location.origin, '') === src);
        if (linkExists) return true;
        const tcs = new Promise((resolve) => {
            const link = document.createElement("link");
            link.href = src;
            link.addEventListener("load", () => {
                resolve(true);
            });
            link.onerror = () => {
                resolve(true);
                return false;
            };
            document.head.appendChild(link);
        });
        return tcs;
    }

    static async RefreshToken(success = null) {
        const oldToken = Client.Token;
        if (!oldToken || new Date(oldToken.RefreshTokenExp) <= Client.EpsilonNow) return null;
        if (new Date(oldToken.AccessTokenExp) > Client.EpsilonNow) return oldToken;
        if (new Date(oldToken.AccessTokenExp) <= Client.EpsilonNow && new Date(oldToken.RefreshTokenExp) > Client.EpsilonNow) {
            const newToken = await Client.GetToken(oldToken);
            if (newToken) {
                Client.Token = newToken;
                success?.(newToken);
            }
            return newToken;
        }
    }

    /**
     * @param {Token} oldToken
     */
    static async GetToken(oldToken) {
        // @ts-ignore
        const newToken = await Client.Instance.SubmitAsync({
            NoQueue: true,
            Url: `/api/auth/refreshToken?t=${Client.Token.TenantCode || Client.Tenant}`,
            Method: "POST",
            JsonData: JSON.stringify({ RefreshToken: oldToken.RefreshToken, AccessToken: oldToken.AccessToken }),
            AllowAnonymous: true,
            ErrorHandler: (xhr) => {
                if (xhr.status === 400) {
                    Client.Token = null;
                    Toast.Warning("Phiên truy cập đã hết hạn! Vui lòng chờ trong giây lát, hệ thống đang tải lại trang");
                    //window.location.reload();
                }
            },
        });
        return newToken;
    }

    /**
     * @param {string} path
     */
    static RemoveGuid(path) {
        const GuidLength = 36;
        let thumbText = path;
        if (path.length > GuidLength) {
            const fileName = Utils.GetFileNameWithoutExtension(path);
            thumbText = fileName.substring(0, fileName.length - GuidLength) + '.' + path.split('.').pop();
        }
        return thumbText;
    }

    /**
     * @param {string} path
     */
    static Download(path) {
        const removePath = this.RemoveGuid(path);
        const a = document.createElement("a");
        a.href = path.includes("http") ? path : Path.Combine(Client.Origin, path);
        a.target = "_blank";
        a.setAttribute("download", removePath);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

/**
 * @param {XHRWrapper} options
 * @param {{ (value: any): void; (arg0: number | boolean): void; }} resolve
 * @param {XMLHttpRequest} xhr
 */
function ProcessSuccessRequest(options, resolve, xhr) {
    if (options.Retry) {
        resolve(true);
        return;
    }
    if (!xhr.responseText) {
        resolve(null);
        return;
    }
    if (options.CustomParser) {
        resolve(options.CustomParser(xhr.response));
        return;
    }
    const type = typeof options.Value;
    if (type === "number") {
        resolve(Number(xhr.responseText));
    } else if (type === "string") {
        resolve(xhr.responseText);
    } else if (type === "object") {
        const parsed = JSON.parse(xhr.responseText);
        resolve(parsed);
    } else {
        try {
            const parsed = JSON.parse(xhr.responseText);
            resolve(parsed);
        } catch {
            resolve(xhr.responseText);
        }
    }
}

function ErrorHandler(options, reject, xhr) {
    if (options.Retry) {
        reject(false);
        return;
    }
    let exp;
    try {
        exp = JSON.parse(xhr.responseText);
        exp.StatusCode = xhr.status;
    } catch {
        exp = { Message: "Đã có lỗi xảy ra trong quá trình xử lý", StackTrace: xhr.responseText };
    }
    if (options.ErrorHandler) {
        options.ErrorHandler(xhr);
        reject(new Error(exp.Message));
        return;
    }
    if (xhr.status >= 400 && xhr.status < 500) {
        if (exp && exp.Message && options.ShowError) {
            console.warn(exp.Message);
        }
    } else if (xhr.status === 500 || xhr.status === 404) {
        console.warn(exp);
    } else if (xhr.status === 401) {
        Client.UnAuthorizedEventHandler?.(options);
    } else if (xhr.status >= 502 || xhr.status === 504 || xhr.status === 503) {
        if (options.ShowError) {
            console.warn("Lỗi kết nối tới máy chủ, vui lòng chờ trong giây lát...");
        }
        if (!options.Retry) {
            Client.BadGatewayRequest.Enqueue(options);
        }
    } else {
        if (xhr.responseText) {
            console.warn(xhr.responseText);
        }
    }
    reject(new Error(exp.Message));
}

/**
 * 
 * @param {boolean} clearCache 
 * @returns {any}
 */
function ClearCacheHeader(clearCache) {
    const headers = {};
    if (clearCache) {
        headers["Pragma"] = "no-cache";
        headers["Expires"] = "0";
        headers["Last-Modified"] = new Date().toString();
        headers["If-Modified-Since"] = new Date().toString();
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, post-check=0, pre-check=0";
    }
    return headers;
}
