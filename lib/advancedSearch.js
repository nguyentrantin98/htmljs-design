import { EditableComponent } from "./editableComponent.js";
import {
    AdvSearchVM, ActiveStateEnum, AdvSearchOperation, FieldCondition, LogicOperation, OperationToSql,
    OrderBy, OrderbyDirection, Entity, ElementType, Component, ComponentType, EventType, KeyCodeEnum,
    FeaturePolicy
} from "./models/";
import { Section } from "./section.js";
import { Uuid7 } from "./structs/uuidv7.js";
import { Str } from "./utils/ext.js";
import dayjs from 'dayjs';
import { Textbox } from "./textbox.js";
import { Numbox } from "./numbox.js";
import { Datepicker } from "./datepicker.js";

/** @typedef {import("./gridView.js").GridView} GridView */
/** @typedef {import("./listView.js").ListView} ListView */

export class AdvancedSearch extends EditableComponent {
    /** @type {ListView} */
    // @ts-ignore
    Parent;
    /** @type {AdvSearchVM} */
    // @ts-ignore
    Entity;
    /**
     * @param {import("./listView.js").ListView} parent
     */
    constructor(parent) {
        super(null);
        this.Name = "AdvancedSearch";
        this.Title = "Tìm kiếm nâng cao";
        this.Icon = "fa fa-search-plus";
        this.Parent = parent;
    }

    LocalRender() {
        this._headers = this.Parent.Header
            .filter(x => x.Id != null && x.Label && x.Active && !x.Hidden);
        const fp = new FeaturePolicy();
        fp.CanRead = true;
        fp.CanWrite = true;
        fp.CanDelete = true;
        this.Entity = this.Parent.AdvSearchVM;
        var orderby = this.Parent.Meta.OrderBy;
        this.Parent.OrderBy = !orderby ? this.Parent.OrderBy :
            orderby.split(",").map(x => {
                if (!x) return null;
                var orderField = x.trim().replace(new RegExp("\\s+", "g"), " ").replace("ds.", "").split(" ");
                if (orderField.length < 1) {
                    return null;
                }

                var field = this._headers.find(header => header.FieldName == orderField[0]);
                if (field == null) {
                    return null;
                }

                /** @type {OrderBy} */
                // @ts-ignore
                var result = {
                    ComId: field.Id,
                    FieldName: field.FieldName
                };
                if (orderField.length == 1) {
                    result.OrderbyDirectionId = OrderbyDirection.ASC;
                } else {
                    result.OrderbyDirectionId = orderField[1].toLowerCase() === 'asc' ? OrderbyDirection.ASC : OrderbyDirection.DESC;
                }
                return result;
            }).filter(x => x != null);
        var section = this.AddSection();
        this.AddFilters(section);
        this.AddOrderByGrid(section);
    }

    AddSection() {
        var section = new Section(ElementType.div);
        // @ts-ignore
        section.Meta = {
            Column: 4,
            Label: "Filter",
            Active: true,
            ClassName: "scroll-content"
        };
        this.AddChild(section);
        var label = new HTMLLabelElement();
        section.Element.appendChild(label);
        label.textContent = "Status";
        section.ClassName = "filter-warpper panel group wrapper";
        return section;
    }

    /**
     * Add basic filter to the top of GridView or ListView
     * @param {Section} section 
     */
    AddFilters(section) {
        /** @type {GridView} */
        // @ts-ignore
        this._filterGrid = new GridView({
            Id: Uuid7.Id25(),
            FieldName: "Conditions",
            Column: 4,
            RefName: "FieldCondition",
            LocalRender: true,
            IgnoreConfirmHardDelete: true,
            CanAdd: true,
            Events: "{'DOMContentLoaded': 'FilterDomLoaded'}"
        });
        // @ts-ignore
        this._filterGrid.OnDeleteConfirmed = () => {
            // @ts-ignore
            this._filterGrid.GetSelectedRows().forEach(row => {
                // @ts-ignore
                this._filterGrid.RowData.remove(row);
            });
        };
        this._filterGrid.Header = this._filterGrid.Meta.LocalHeader = [
            {
                Id: "1",
                FieldName: "FieldId",
                Events: "{'change': 'FieldId_Changed'}",
                Label: "Tên cột",
                RefName: "Component",
                FormatData: "ShortDesc",
                Active: true,
                Editable: true,
                ComponentType: "SearchEntry",
                MinWidth: "100px",
                MaxWidth: "200px",
                LocalRender: true,
                LocalData: this._headers,
                // @ts-ignore
                LocalHeader: [
                    // @ts-ignore
                    {
                        FieldName: "ShortDesc",
                        Label: "Column",
                        Active: true
                    }
                ],
                Validation: "[{\"Rule\": \"required\", \"Message\": \"{0} is required\"}]"
            },
            {
                Id: "2",
                FieldName: "CompareOperatorId",
                Label: "Toán tử",
                // @ts-ignore
                ReferenceId: this._entityId,
                RefName: "Entity",
                ComponentType: "SearchEntry",
                FormatData: "Description",
                Active: true,
                Editable: true,
                MinWidth: "150px",
                LocalRender: true,
                // @ts-ignore
                LocalData: IEnumerableExtensions.ToEntity(AdvSearchOperation),
                LocalHeader: [
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._entityId,
                        FieldName: "Name",
                        Label: "Operator",
                        Active: true
                    },
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._entityId,
                        FieldName: "Description",
                        Label: "Allias",
                        Active: true
                    }
                ],
                Validation: "[{\"Rule\": \"required\", \"Message\": \"{0} is required\"}]"
            },
            // @ts-ignore
            {
                Id: "3",
                FieldName: "Value",
                Label: "Value",
                // @ts-ignore
                ReferenceId: this._entityId,
                RefName: "Entity",
                ComponentType: "Input",
                Active: true,
                Editable: true,
                MinWidth: "450px",
                Validation: "[{\"Rule\": \"required\", \"Message\": \"{0} is required\"}]"
            },
            {
                Id: "2",
                FieldName: "LogicOperatorId",
                Label: "logic",
                // @ts-ignore
                ReferenceId: this._entityId,
                RefName: "Entity",
                ComponentType: "SearchEntry",
                FormatData: "Description",
                Active: true,
                Editable: true,
                DefaultVal: "0",
                LocalRender: true,
                LocalData: LogicOperation.ToEntity(),
                LocalHeader: [
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._entityId,
                        FieldName: "Name",
                        Label: "Logic",
                        Active: true
                    },
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._entityId,
                        FieldName: "Value",
                        Label: "Value",
                        Active: true
                    }
                ]
            }
        ];
        this._filterGrid.RowData.Data = this._filterGrid.Meta.LocalData = this.Entity.Conditions;
        this._filterGrid.ParentElement = section.Element;
        section.AddChild(this._filterGrid);
        this._filterGrid.Element.addEventListener(EventType.KeyDown, this.ToggleIndent.bind(this));
    }

    FilterDomLoaded() {
        this._filterGrid.MainSection.Children.forEach(x => {
            var condition = x.Entity;
            this.FieldId_Changed(condition, condition.Field);
        });
    }

    HeaderForAdvSearch() {
        return this.Parent.Header
            .filter(x => x.Id != null && x.Label && x.Active && !x.Hidden);
    }

    /**
     * 
     * @param {Section} section 
     */
    AddOrderByGrid(section) {
        /** @type {ListView} */
        // @ts-ignore
        this._orderByGrid = new GridView({
            FieldName: "OrderBy",
            Column: 4,
            // @ts-ignore
            ReferenceId: this._orderById,
            RefName: "Entity",
            CanAdd: true,
            IgnoreConfirmHardDelete: true,
            LocalRender: true
        });
        // @ts-ignore
        this._orderByGrid.OnDeleteConfirmed = () => {
            // @ts-ignore
            this._orderByGrid.GetSelectedRows().forEach(row => {
                this._orderByGrid.RowData.Remove(row);
            });
        };
        this._orderByGrid.Meta.LocalHeader = [
            {
                Id: "1",
                FieldName: "FieldId",
                Events: "{'change': 'FieldId_Changed'}",
                Label: "Tên cột",
                // @ts-ignore
                ReferenceId: this._ComponentId,
                RefName: "Component",
                FormatData: "ShortDesc",
                Active: true,
                Editable: true,
                ComponentType: "SearchEntry",
                MinWidth: "100px",
                MaxWidth: "200px",
                LocalData: this._headers,
                LocalRender: true,
                LocalHeader: [
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._ComponentId,
                        FieldName: "ShortDesc",
                        Label: "Tên cột",
                        Active: true
                    }
                ]
            },
            {
                Id: "2",
                // @ts-ignore
                EntityId: this._orderById,
                FieldName: "OrderbyDirectionId",
                Label: "Thứ tự",
                // @ts-ignore
                ReferenceId: this._entityId,
                RefName: "Entity",
                ComponentType: "SearchEntry",
                FormatData: "Description",
                Active: true,
                Editable: true,
                MinWidth: "100px",
                MaxWidth: "120px",
                LocalData: OrderbyDirection.ToEntity(),
                LocalHeader: [
                    // @ts-ignore
                    {
                        // @ts-ignore
                        EntityId: this._entityId,
                        FieldName: "Name",
                        Label: "Thứ tự",
                        Active: true
                    }
                ],
                LocalRender: true
            }
        ];
        this._orderByGrid.Meta.LocalData = this.Entity.OrderBy;
        this._orderByGrid.ParentElement = section.Element;
        section.AddChild(this._orderByGrid);
    }

    /**
     * @param {Event} e
     */
    ToggleIndent(e) {
        var keyCode = e.KeyCodeEnum();
        if (keyCode != KeyCodeEnum.Tab) {
            return;
        }

        e.preventDefault();
        var reducing = e.ShiftKey();
        // @ts-ignore
        var selectedRows = this._filterGrid.GetSelectedRows();
        var idMap = selectedRows.reduce((/** @type {{ [x: string]: any; }} */ map, /** @type {{ Id: string | number; }} */ row) => {
            map[row.Id] = row;
            return map;
        }, {});
        this._filterGrid.RowAction(row => {
            var fieldCondition = row.Entity;
            fieldCondition.Level += reducing ? -1 : 1;
            Array.from(row.Element.querySelectorAll("td")).forEach(td => {
                td.style.paddingLeft = fieldCondition.Level + "rem";
            });
        }, row => idMap.hasOwnProperty(row.Entity.Id));
    }

    DirtyCheckAndCancel() {
        super.Dispose();
    }

    async ApplyAdvSearch() {
        const isValid = await this.ValidateAsync();
        if (!isValid) return;
        this.CalcAdvSearchQuery();
        this.Parent.ReloadData(false, 0).Done();
    }

    CalcAdvSearchQuery() {
        // @ts-ignore
        this.Parent.Wheres = this.Entity.Conditions.map((x, index) => {
            return {
                Condition: this.GetSearchValue(x)
            };
        }).filter(x => x.Condition);
    }

    /**
     * 
     * @param {FieldCondition} condition 
     * @returns 
     */
    GetSearchValue(condition) {
        var ignoreSearch = false;
        var value = condition.Value;
        if (value == null && condition.CompareOperatorId != AdvSearchOperation.EqualNull && condition.CompareOperatorId != AdvSearchOperation.NotEqualNull) {
            return null;
        }
        if (condition.Field.ComponentType.includes(ComponentType.Datepicker) && value) {
            value = value;
            // @ts-ignore
        } else if (condition.Field.ComponentType == nameof(Number)) {
            value = value + "";
        } else {
            // @ts-ignore
            value = value + "";
        }
        var func = OperationToSql[condition.CompareOperatorId];
        var formattedFunc = ignoreSearch ? Str.Empty : Str.Format(func, condition.OriginFieldName, value);
        return formattedFunc;
    }

    /**
     * 
     * @param {FieldCondition} condition 
     * @param {Component} field 
     * @returns 
     */
    FieldId_Changed(condition, field) {
        if (condition == null || field == null) {
            return;
        }
        condition.OriginFieldName = field.FieldName;
        condition.Field = field;

        var cell = this._filterGrid.FirstOrDefault(x => x.Entity == condition && x.Name == "Value");
        /** @type {EditableComponent} */
        // @ts-ignore
        var compareCell = this._filterGrid.find(x => x.Entity == condition
            && x.FieldName == "CompareOperatorId");
        if (cell == null) {
            return;
        }

        var parentCellElement = cell.ParentElement;
        var parentCell = cell.Parent;
        cell.Dispose();
        /** @type {EditableComponent} */
        var component = null;
        if (field.ComponentType.includes(ComponentType.Datepicker)) {
            component = this.SetSearchDateTime(compareCell, field);
            // @ts-ignore
            condition.Value = new dayjs().format('YYYY/MM/DD');
        } else if (field.ComponentType.includes(ComponentType.SearchEntry) || field.ComponentType.includes(ComponentType.MultipleSearchEntry)) {
            component = this.SetSearchId(compareCell, field);
            condition.Value = "";
        } else if (field.ComponentType.includes(ComponentType.Checkbox)) {
            component = this.SetSearchBool(compareCell, field);
            // @ts-ignore
            condition.Value = ActiveStateEnum.All;
            condition.Display.ValueText = 'All';
        } else if (field.ComponentType.includes(ComponentType.Numbox)) {
            component = this.SetSearchDecimal(compareCell, field);
            condition.Value = "0";
        } else {
            // @ts-ignore
            component = AdvancedSearch.SetSearchString(compareCell, field);
        }
        // Binding data manually because of field name confliction
        // @ts-ignore
        component.UserInput += (e) => {
            component.Entity.Value = e.NewData;
        };
        condition.LogicOperatorId = condition.LogicOperatorId || LogicOperation.And;
        this._filterGrid.FirstOrDefault(x => x.Meta != null && x.Entity == condition
            && x.Name == "LogicOperatorId")?.UpdateView();
        condition.CompareOperatorId = compareCell.Meta.LocalData.find(x => x.Id == condition.CompareOperatorId)?.Id;
        // @ts-ignore
        compareCell.Value = condition.CompareOperatorId;
        // @ts-ignore
        compareCell.Display.ValueText = Object.keys(AdvSearchOperation).find(key => AdvSearchOperation[key] === condition.CompareOperatorId);
        compareCell.UpdateView();
        component.Entity = condition;
        // @ts-ignore
        component.Value = condition.Value;
        component.Parent = parentCell;
        parentCell.Children.splice(2, 0, component);
        component.ParentElement = parentCellElement;
        // @ts-ignore
        component.Render();
    }

    /**
     * 
     * @param {string} componentType 
     * @returns {Entity[]}
     */
    static OperatorFactory(componentType) {
        // @ts-ignore
        var entities = AdvSearchOperation;
        switch (componentType) {
            case ComponentType.Dropdown:
                return entities.In;
        }
        return null;
    }

    static SetSearchString(compareCell, comInfo) {
        var component;
        var com = new Component();
        com.CopyPropFrom(comInfo);
        com.ComponentType = ComponentType.Textbox;
        component = new Textbox(comInfo);
        compareCell.Meta.LocalData = AdvancedSearch.OperatorFactory(ComponentType.Textbox);
        return component;
    }

    /**
     * Create component for search decimal
     * @param {EditableComponent} compareCell 
     * @param {Component} comInfo 
     * @returns {EditableComponent}
     */
    SetSearchDecimal(compareCell, comInfo) {
        var component;
        var com = new Component();
        com.CopyPropFrom(comInfo);
        com.ComponentType = ComponentType.Numbox;
        // @ts-ignore
        component = new Numbox(comInfo);
        compareCell.Meta.LocalData = AdvancedSearch.OperatorFactory(ComponentType.Number);
        return component;
    }

    /**
     * Create component for search boolean
     * @param {EditableComponent} compareCell 
     * @param {Component} com 
     * @returns {EditableComponent}
     */
    SetSearchBool(compareCell, com) {
        var comInfo = new Component();
        comInfo.CopyPropFrom(com);
        var component;
        comInfo.FormatData = '{Description}';
        comInfo.ComponentType = ComponentType.MultipleSearchEntry;
        comInfo.LocalRender = true;
        comInfo.LocalData = ActiveStateEnum.ToEntity();
        // @ts-ignore
        comInfo.LocalHeader = AdvancedSearch.GetBooleanSearchHeader();
        // @ts-ignore
        component = new MultipleSearchEntry(comInfo);
        compareCell.Meta.LocalData = AdvancedSearch.OperatorFactory(ComponentType.SearchEntry);
        return component;
    }

    static GetBooleanSearchHeader() {
        return [
            {
                // @ts-ignore
                FieldName: nameof(Models.Entity.Name),
                Label: "Trạng thái",
                Active: true
            },
            {
                // @ts-ignore
                FieldName: nameof(Models.Entity.Description),
                Label: "Miêu tả",
                Active: true
            }
        ];
    }

    /**
     * Create component for search dropdown
     * @param {EditableComponent} compareCell 
     * @param {Component} field 
     * @returns {EditableComponent}
     */
    SetSearchId(compareCell, field) {
        compareCell.Meta.LocalData = AdvancedSearch.OperatorFactory(ComponentType.SearchEntry);
        compareCell.FieldVal = AdvSearchOperation.In;
        compareCell.Entity.Display = compareCell.Entity.Display
            ?? { OperationText: AdvSearchOperation.GetFieldNameByVal(AdvSearchOperation.In) };

        var comInfo = new Component();
        comInfo.CopyPropFrom(field);
        comInfo.ComponentType = ComponentType.MultipleSearchEntry;
        // @ts-ignore
        var component = new MultipleSearchEntry(comInfo);
        return component;
    }

    /**
     * Create component for search dropdown
     * @param {EditableComponent} compareCell 
     * @param {Component} comInfo 
     * @returns {EditableComponent}
     */
    SetSearchDateTime(compareCell, comInfo) {
        var component;
        var com = new Component();
        com.CopyPropFrom(comInfo);
        // @ts-ignore
        com.ComponentType = nameof(Datepicker);
        com.Precision = 7; // add time picker
        // @ts-ignore
        component = new Datepicker(com);
        compareCell.Meta.LocalData =
            AdvSearchOperation.ToEntity().filter(x => x.Id < AdvSearchOperation.Contains);
        return component;
    }
}
