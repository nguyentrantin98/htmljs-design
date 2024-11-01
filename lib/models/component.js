import { Action } from './action';

/**
 * @typedef {import('../index').EditableComponent} EditableComponent
 * Represents a component.
 * @class
 */
export class Component {
    /** @type {string} */
    Id = null;
    /** @type {string} */
    FieldName = null;
    /** @type {string} */
    PopulateFieldName = null;
    /** @type {number} */
    Order = 0;
    /** @type {string | (...args) => EditableComponent} */
    ComponentType = null;
    /** @type {string} */
    ComponentGroupId = null;
    /** @type {string} */
    FormatData = null;
    /** @type {string} */
    PlainText = null;
    /** @type {number} */
    Column = 0;
    /** @type {number} */
    Offset = 0;
    /** @type {number} */
    Row = 0;
    /** @type {boolean} */
    CanSearch = false;
    /** @type {boolean} */
    CanCache = false;
    /** @type {number} */
    Precision = 0;
    /** @type {string} */
    GroupBy = null;
    /** @type {string} */
    GroupFormat = null;
    /** @type {string} */
    Label = null;
    /** @type {boolean} */
    ShowLabel = false;
    /** @type {string} */
    Icon = null;
    /** @type {string} */
    ClassName = null;
    /** @type {string} */
    Style = null;
    /** @type {string} */
    ChildStyle = null;
    /** @type {string} */
    HotKey = null;
    /** @type {string} */
    RefClass = null;
    /** @type {string} */
    Events = null;
    /** @type {boolean} */
    Disabled = false;
    /** @type {boolean} */
    Visibility = false;
    /** @type {string} */
    Validation = null;
    /** @type {boolean} */
    Focus = false;
    /** @type {string} */
    Width = null;
    /** @type {string} */
    PopulateField = null;
    /** @type {string} */
    GroupEvent = null;
    /** @type {number} */
    XsCol = 0;
    /** @type {number} */
    SmCol = 0;
    /** @type {number} */
    LgCol = 0;
    /** @type {number} */
    XlCol = 0;
    /** @type {number} */
    XxlCol = 0;
    /** @type {string} */
    DefaultVal = null;
    /** @type {string} */
    DateTimeField = null;
    /** @type {boolean} */
    Active = false;
    /** @type {Date} */
    InsertedDate = new Date();
    /** @type {string} */
    InsertedBy = null;
    /** @type {Date} */
    UpdatedDate = new Date();
    /** @type {string} */
    UpdatedBy = null;
    /** @type {boolean} */
    CanAdd = false;
    /** @type {boolean} */
    IsPrivate = false;
    /** @type {number} */
    MonthCount = 0;
    /** @type {string} */
    Query = null;
    /** @type {boolean} */
    IsRealtime = false;
    /** @type {string} */
    RefName = null;
    /** @type {boolean} */
    TopEmpty = false;
    /** @type {boolean} */
    IsCollapsible = false;
    /** @type {string} */
    Template = null;
    /** @type {string} */
    PreQuery = null;
    /** @type {string} */
    DisabledExp = null;
    /** @type {boolean} */
    FocusSearch = false;
    /** @type {boolean} */
    IsSumary = false;
    /** @type {string} */
    FormatSumaryField = null;
    /** @type {string} */
    OrderBySumary = null;
    /** @type {boolean} */
    ShowHotKey = false;
    /** @type {number} */
    DefaultAddStart = 0;
    /** @type {number} */
    DefaultAddEnd = 0;
    /** @type {boolean} */
    UpperCase = false;
    /** @type {boolean} */
    VirtualScroll = false;
    /** @type {string} */
    Migration = null;
    /** @type {string} */
    ListClass = null;
    /** @type {string} */
    ExcelFieldName = null;
    /** @type {boolean} */
    LiteGrid = false;
    /** @type {boolean} */
    ShowDatetimeField = false;
    /** @type {boolean} */
    ShowNull = false;
    /** @type {boolean} */
    AddDate = false;
    /** @type {boolean} */
    DisplayBadge = false;
    /** @type {boolean} */
    FilterEq = false;
    /** @type {number} */
    HeaderHeight = 0;
    /** @type {number} */
    BodyItemHeight = 0;
    /** @type {number} */
    FooterHeight = 0;
    /** @type {number} */
    ScrollHeight = 0;
    /** @type {string} */
    ScriptValidation = null;
    /** @type {boolean} */
    FilterLocal = false;
    /** @type {boolean} */
    HideGrid = false;
    /** @type {string} */
    GroupReferenceId = null;
    /** @type {string} */
    GroupReferenceName = null;
    /** @type {string} */
    GroupName = null;
    /** @type {string} */
    ShortDesc = null;
    /** @type {string} */
    Description = null;
    /** @type {string} */
    FeatureId = null;
    /** @type {string} */
    ComponentId = null;
    /** @type {string} */
    TextAlign = null;
    /** @type {boolean} */
    HasFilter = false;
    /** @type {boolean} */
    Frozen = false;
    /** @type {string} */
    FilterTemplate = null;
    /** @type {boolean} */
    Editable = false;
    /** @type {string} */
    FormatExcell = null;
    /** @type {string} */
    DatabaseName = null;
    /** @type {string} */
    Summary = null;
    /** @type {number} */
    SummaryColSpan = 0;
    /** @type {boolean} */
    BasicSearch = false;
    /** @type {string} */
    ShowExp = null;
    /** @type {string} */
    MinWidth = null;
    /** @type {string} */
    MaxWidth = null;
    /** @type {string} */
    TenantCode = null;
    /** @type {string} */
    OrderBy = null;
    /** @type {string} */
    ParentId = null;
    /** @type {string} */
    Lang = null;
    /** @type {string} */
    Name = null;
    /** @type {boolean} */
    IsTab = false;
    /** @type {string} */
    TabGroup = null;
    /** @type {boolean} */
    IsVertialTab = false;
    /** @type {boolean} */
    Responsive = false;
    /** @type {number} */
    OuterColumn = 0;
    /** @type {number} */
    XsOuterColumn = 0;
    /** @type {number} */
    SmOuterColumn = 0;
    /** @type {number} */
    LgOuterColumn = 0;
    /** @type {number} */
    XlOuterColumn = 0;
    /** @type {number} */
    XxlOuterColumn = 0;
    /** @type {number} */
    BadgeMonth = 0;
    /** @type {boolean} */
    IsDropDown = false;
    /** @type {boolean} */
    IsMultiple = false;
    /** @type {string} */
    Html = null;
    /** @type {string} */
    Css = null;
    /** @type {string} */
    Javascript = null;
    /** @type {HTMLElement} */
    ParentElement = null;
    /** @type {Component[]} */
    Columns = [];
    /** @type {Component[]|string} */
    LocalQuery;
    /** @type {Component[]} */
    Components;
    /** @type {any} */
    Layout;
    /** @type {Function} */
    OnClick;
    /** @type {string} */
    AddRowExp;
    /** @type {string} */
    EntityName;
    /** @type {string} */
    TableName;
    /** @type {string} */
    RowSpan;
    /** @type {string} */
    ComponentDefaultValueId;
    /** @type {string} */
    GroupTypeId;
    CanRead = false;
    CanReadAll = false;
    CanWrite = false;
    CanWriteAll = false;
    CanDelete = false;
    CanDeleteAll = false;
    CanCopy = false;
    CanCopyAll = false;
    CanDeactivate = false;
    CanDeactivateAll = false;
    CanExport = false;
    IsPublic = false;
}