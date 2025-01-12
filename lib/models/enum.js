import { Component } from "./component.js";

/**
 * Represents system roles.
 * @enum {number}
 */
export const RoleEnum = {
    /** @type {string} System role. */
    System: "8",
};

/**
 * Enum for task states.
 * @enum {number}
 */
export const TaskStateEnum = {
    /** @type {number} Unread status. */
    UnreadStatus: 339,
    /** @type {number} Read status. */
    Read: 340,
    /** @type {number} Processing status. */
    Processing: 341,
    /** @type {number} Proceeded status. */
    Proceeded: 342,
};

export const PositionEnum = {
    absolute: "absolute",
    fixed: "fixed", // '@' không được sử dụng trong tên biến JavaScript
    inherit: "inherit",
    initial: "initial",
    relative: "relative",
    static: "static", // 'static' là từ khóa trong JavaScript, cần trích dẫn nó nếu dùng như tên thuộc tính không bị trích dẫn
    sticky: "sticky",
    unset: "unset"
};

export const KeyCodeEnum = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    PauseBreak: 19,
    CapsLock: 20,
    Escape: 27,
    PageUp: 33,
    Space: 32,
    PageDown: 34,
    End: 35,
    Home: 36,
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,
    Insert: 45,
    Delete: 46,
    Zero: 48,
    One: 49,
    Two: 50,
    Three: 51,
    Four: 52,
    Five: 53,
    Six: 54,
    Seven: 55,
    Eight: 56,
    Nine: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    LeftWindowKey: 91,
    RightWindowKey: 92,
    SelectKey: 93,
    Numpad0: 96,
    Numpad1: 97,
    Numpad2: 98,
    Numpad3: 99,
    Numpad4: 100,
    Numpad5: 101,
    Numpad6: 102,
    Numpad7: 103,
    Numpad8: 104,
    Numpad9: 105,
    Multiply: 106,
    Add: 107,
    Subtract: 109,
    DecimalPoint: 110,
    Divide: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NumLock: 144,
    ScrollLock: 145,
    SemiColon: 186,
    EqualSign: 187,
    Comma: 188,
    Dash: 189,
    Period: 190,
    ForwardSlash: 191,
    GraveAccent: 192,
    OpenBracket: 219,
    BackSlash: 220,
    CloseBraket: 221,
    SingleQuote: 222
};

export const OperatorEnum = {
    In: 1,
    NotIn: 2,
    Gt: 3,
    Ge: 4,
    Lt: 5,
    Le: 6,
    Lr: 7,
    Rl: 8
};

export const SearchMethodEnum = {
    Empty: 1,
    Filled: 2,
    Equal: 3,
    NotEqual: 4,
    Contain: 5,
    NotContain: 6,
    StartWith: 7,
    EndWith: 8,
    Smaller: 9,
    SmallerEqual: 10,
    Greater: 11,
    GreaterEqual: 12,
    Range: 13
};

/**
 * Types of UI components.
 * @enum {number}
 */
export const ComponentTypeTypeEnum = {
    /** @type {number} Dropdown component. */
    Dropdown: 1,
    /** @type {number} Search entry component. */
    SearchEntry: 1,
    /** @type {number} Multiple search entry component. */
    MultipleSearchEntry: 1,
    /** @type {number} Datepicker component. */
    Datepicker: 2,
    /** @type {number} Number input component. */
    Number: 3,
    /** @type {number} Textbox component. */
    Textbox: 4,
    /** @type {number} Checkbox component. */
    Checkbox: 5,
};

/**
 * Enum for active states.
 * @enum {number}
 */
export const ActiveStateEnum = {
    /** @type {number} Represents all statuses. */
    All: 2,
    /** @type {number} Active status. */
    Yes: 1,
    /** @type {number} Inactive status. */
    No: 0,
};

/**
 * Enum for advanced search operations.
 * @enum {number}
 */
export const AdvSearchOperation = {
    /** @type {number} Equals. */
    Equal: 1,
    /** @type {number} Not equal. */
    NotEqual: 2,
    /** @type {number} Greater than. */
    GreaterThan: 3,
    /** @type {number} Greater than or equal. */
    GreaterThanOrEqual: 4,
    /** @type {number} Less than. */
    LessThan: 5,
    /** @type {number} Less than or equal. */
    LessThanOrEqual: 6,
    /** @type {number} Contains. */
    Contains: 7,
    /** @type {number} Does not contain. */
    NotContains: 8,
    /** @type {number} Starts with. */
    StartWith: 9,
    /** @type {number} Does not start with. */
    NotStartWith: 10,
    /** @type {number} Ends with. */
    EndWidth: 11,
    /** @type {number} Does not end with. */
    NotEndWidth: 12,
    /** @type {number} In a set. */
    In: 13,
    /** @type {number} Not in a set. */
    NotIn: 14,
    /** @type {number} Equals date. */
    EqualDatime: 15,
    /** @type {number} Greater than date. */
    GreaterThanDatime: 21,
    /** @type {number} Less than date. */
    LessThanDatime: 22,
    /** @type {number} Not equal date. */
    NotEqualDatime: 16,
    /** @type {number} Equals null. */
    EqualNull: 17,
    /** @type {number} Not equal null. */
    NotEqualNull: 18,
    /** @type {number} Like. */
    Like: 19,
    /** @type {number} Not like. */
    NotLike: 20,
    /** @type {number} Greater than or equal date. */
    GreaterEqualDatime: 23,
    /** @type {number} Less than or equal date. */
    LessEqualDatime: 24,
};

export const OperationToSql = {
    [AdvSearchOperation.Equal]: "{0} = N'{1}'",
    [AdvSearchOperation.NotEqual]: "{0} != N'{1}'",
    [AdvSearchOperation.GreaterThan]: "{0} > N'{1}'",
    [AdvSearchOperation.GreaterThanOrEqual]: "{0} >= N'{1}'",
    [AdvSearchOperation.LessThan]: "{0} < N'{1}'",
    [AdvSearchOperation.LessThanOrEqual]: "{0} <= N'{1}'",
    [AdvSearchOperation.Contains]: "charindex(N'{1}', {0}) >= 1",
    [AdvSearchOperation.NotContains]: "contains({0}, N'{1}') eq false",
    [AdvSearchOperation.StartWith]: "charindex(N'{1}', {0}) = 1",
    [AdvSearchOperation.NotStartWith]: "charindex(N'{1}', {0}) > 1",
    [AdvSearchOperation.EndWidth]: "{0} like N'%{1}')",
    [AdvSearchOperation.NotEndWidth]: "{0} not like N'%{1}'",
    [AdvSearchOperation.In]: "{0} in ({1})",
    [AdvSearchOperation.Like]: "{0} like N'%{1}%'",
    [AdvSearchOperation.NotLike]: "{0} not like N'{1}'",
    [AdvSearchOperation.NotIn]: "{0} not in ({1})",
    [AdvSearchOperation.EqualDatime]: "cast(date, {0}) = N'{1}'",
    [AdvSearchOperation.NotEqualDatime]: "cast(date, {0}) != N'{1}'",
    [AdvSearchOperation.EqualNull]: "{0} is null",
    [AdvSearchOperation.NotEqualNull]: "{0} is not null",
    [AdvSearchOperation.GreaterThanDatime]: "cast(date, {0}) > N'{1}'",
    [AdvSearchOperation.GreaterEqualDatime]: "cast(date, {0}) >= N'{1}'",
    [AdvSearchOperation.LessThanDatime]: "cast(date, {0}) < N'{1}'",
    [AdvSearchOperation.LessEqualDatime]: "cast(date, {0}) <= N'{1}'",
};

/**
 * Logical operations for combining conditions.
 * @enum {number}
 */
export const LogicOperation = {
    /** @type {number} Logical AND. */
    And: 0,
    /** @type {number} Logical OR. */
    Or: 1,
};

/**
 * Directions for sorting.
 * @enum {number}
 */
export const OrderbyDirection = {
    /** @type {number} Ascending order. */
    ASC: 1,
    /** @type {number} Descending order. */
    DESC: 2,
};

/**
 * Role selection options.
 * @enum {number}
 */
export const RoleSelection = {
    /** @type {number} Top first selection. */
    TopFirst: 1,
    /** @type {number} Bottom first selection. */
    BottomFirst: 2,
};

/**
 * Represents advanced search configurations.
 */
export class AdvSearchVM {
    /**
     * Constructs an instance of AdvSearchVM.
     */
    constructor() {
        this.ActiveState = null;
        /** @type {FieldCondition[]} */
        this.Conditions = [];
        this.AdvSearchConditions = [];
        /** @type {OrderBy[]} */
        this.OrderBy = [];
    }
}

/**
 * Represents a selected cell in the UI.
 */
export class CellSelected {
    /**
     * Constructs an instance of CellSelected.
     */
    constructor() {
        this.FieldName = '';
        this.FieldText = '';
        this.ComponentType = '';
        this.Value = '';
        this.ValueText = '';
        this.Operator = null;
        this.OperatorText = '';
        this.Logic = null;
        this.IsSearch = false;
        this.Group = false;
        this.Shift = false;
    }
}

/**
 * Represents a conditional expression in a query.
 */
export class Where {
    /**
     * Constructs an instance of Where.
     */
    constructor() {
        this.Condition = '';
        this.Group = false;
    }
}

/**
 * Represents a condition in a field used for advanced searches.
 */
export class FieldCondition {
    /**
     * Constructs an instance of FieldCondition.
     */
    constructor() {
        this.Id = '';
        this.OriginFieldName = '';
        this.FieldId = '';
        /** @type {Component} */
        this.Field = null;
        /** @type {AdvSearchOperation} */
        this.CompareOperatorId = null;
        this.Value = '';
        this.Display = {};
        /** @type {LogicOperation} */
        this.LogicOperatorId = null;
        this.LogicOperator = null;
        this.Level = '';
        this.Group = false;
    }
}

/**
 * Represents the ordering of a field in a query.
 */
export class OrderBy {
    /** @type {String | null | undefined} */
    Id = '';
    ComId = '';
    FieldName = '';
    /** @type {OrderbyDirection | null | undefined} */
    OrderbyDirectionId = null;
}

/**
 * Represents an event message in a queue.
 */
export class MQEvent {
    /**
     * Constructs an instance of MQEvent.
     */
    constructor() {
        this.DeviceKey = '';
        this.QueueName = '';
        this.Action = '';
        this.Id = '';
        this.PrevId = '';
        this.Time = null; // JavaScript does not have a direct equivalent to DateTimeOffset, using Date instead
        this.Message = null;
    }
}

/**
 * @class Entity
 * @property {string} Name
 * @property {string} Description
 * @property {boolean} Active
 */
export class Entity {
    /** @type {number} Id */
    Id;
    /** @type {string} */
    Name;
    /** @type {any} */
    Value;
    /** @type {any} */
    Display;
    /** @type {boolean} */
    Active;
}

/**
 * HTTP methods used in web requests.
 * @enum {string}
 */
export const HttpMethod = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE'
};

/**
 * HTTP status codes as per the HTTP specification.
 * @enum {number}
 */
export const HttpStatusCode = {
    // Informational 1xx
    Continue: 100,
    SwitchingProtocols: 101,

    // Successful 2xx
    OK: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,

    // Redirection 3xx
    MultipleChoices: 300,
    Ambiguous: 300,
    MovedPermanently: 301,
    Moved: 301,
    Found: 302,
    Redirect: 302,
    SeeOther: 303,
    RedirectMethod: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    RedirectKeepVerb: 307,

    // Client Error 4xx
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    RequestEntityTooLarge: 413,
    RequestUriTooLong: 414,
    UnsupportedMediaType: 415,
    RequestedRangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    UpgradeRequired: 426,

    // Server Error 5xx
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505
};
