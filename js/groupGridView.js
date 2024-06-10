import { GridView } from "./gridView.js";
import { GroupViewItem } from "./groupViewItem.js";
import { ListViewItem } from "./listViewItem.js";
import { ElementType } from "./models/elementType.js";
import EventType from "./models/eventType.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";

export class GroupRowData {
    constructor() {
        this.Key = null;
        this.Children = [];
    }
}

export class GroupGridView extends GridView {
    static _groupKey = "__groupkey__";
    static GroupRowClass = "group-row";

    constructor(ui) {
        super(ui);
    }

    Render() {
        super.Render();
        Html.Take(this.Element).ClassName("group-table").End.Render();
    }

    async RenderContent() {
        this.AddSections();
        this.FormattedRowData = this.FormattedRowData.Nothing() ? this.RowData.Data : this.FormattedRowData;
        if (this.FormattedRowData.Nothing()) {
            return;
        }
        this.MainSection.Show = false;
        this.MainSection.DisposeChildren();
        this.FormattedRowData.forEach((row, index) => {
            Html.Take(this.MainSection.Element);
            this.RenderRowData(this.Header, row, this.MainSection, null);
        });
        this.MainSection.Show = true;
        this.ContentRendered();
    }

    async ApplyFilter() {
        this.MainSection.DisposeChildren();
        return super.ApplyFilter();
    }

    NoRowData(list) {
        if (this.Editable) {
            this.AddNewEmptyRow();
        } else if (list.Nothing()) {
            this.NoRecordFound();
        }
    }

    async AddRow(item, fromIndex, singleAdd = true) {
        fromIndex = 0;
        let tcs = new Promise((resolve) => { // Ensure 'resolve' is available in the Promise context
            this.DisposeNoRecord();
            let keys = this.Meta.GroupBy.split(",");
            item[GroupGridView._groupKey] = keys.map(key => item.GetPropValue(key)?.toString()).join(" ");
            let groupKey = item[GroupGridView._groupKey];
            let existGroup = this.AllListViewItem
                .find(group => group.GroupRow && group.Entity.As(GroupRowData).Key === groupKey);
            let row;
            if (!existGroup) {
                let groupData = new GroupRowData();
                groupData.Key = groupKey;
                groupData.Children = [item];
                this.FormattedRowData.push(groupData);
                row = this.RenderRowData(this.Header, groupData, this.MainSection, 0);
            } else {
                existGroup.Entity.As(GroupRowData).Children.push(item);
                let index = this.MainSection.Children.indexOf(existGroup);
                row = this.RenderRowData(this.Header, item, this.MainSection, index + existGroup.Children.length + 1);
            }
            this.Dirty = true;
            resolve(row); // Now 'resolve' is properly defined and used
        });
        return tcs; // Return the promise
    }

    // @ts-ignore
    RenderRowData(headers, row, section, index, emptyRow = false) {
        if (!(row instanceof GroupRowData)) {
            return super.RenderRowData(headers, row, section, index, emptyRow);
        }
        if (!(section.Element instanceof HTMLTableSectionElement )) {
            throw new Error("The section is not an HTML table element");
        }
        Html.Take(section.Element); 
        if (row.Key === null || row.Key.toString().trim() === "") {
            let rowResult = null;
            row.Children.forEach(child => {
                Html.Take(section.Element); 
                rowResult = super.RenderRowData(headers, child, section, null);
            });
            return rowResult;
        }
        let first = row.Children[0];
        // @ts-ignore
        let groupSection = new GroupViewItem(ElementType.tr, {
            Entity: row,
            ParentElement: section.Element,
            GroupRow: true,
            ListViewSection: section,
            ListView: this
        });
        section.AddChild(groupSection);
            groupSection.Element.tabIndex = -1;
        let groupText;
        const fn = Utils.IsFunction(this.Meta.GroupFormat)
        if (fn) {
            groupText = fn.call(this, this, first).toString();
        } else {
            groupText = Utils.FormatEntity2(this.Meta.GroupFormat, null, first, Utils.EmptyFormat, Utils.EmptyFormat);
        }
        if (this.Meta.GroupReferenceId) {
            let val = first.GetPropValue(this.Meta.GroupBy.substr(0, this.Meta.GroupBy.length - 2));
            groupSection.Entity = val;
            groupSection.Entity.SetPropValue("ModelName", this.Meta.RefName);
            headers.filter(x => !x.Hidden).forEach(header => {
                Html.Instance.TData.TabIndex(-1)
                    .Style(header.Style)
                    .Event(EventType.FocusIn, e => this.FocusCell(e, header))
                    .DataAttr("field", header.FieldName).Render();
                let td = Html.Context;
                groupSection.RenderTableCell(val, header, td);
                Html.Instance.EndOf(ElementType.td);
            });
        } else {
            Html.Instance.TData.ClassName("status-cell").Icon("mif-pencil").EndOf(ElementType.td)
                .TData.ColSpan(headers.length - 1)
                .Event(EventType.Click, () => this.DispatchClick(first))
                .Event(EventType.DblClick, () => this.DispatchDblClick(first))
                .Icon("fa fa-chevron-down").Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).End
                .Div.ClassName("d-flex").InnerHTML(groupText);
            groupSection.GroupText = Html.Context;
            groupSection.Chevron = Html.Context.previousElementSibling;
            groupSection.Chevron.ParentElement.PreviousElementSibling.AppendChild(groupSection.Chevron);
            Html.Instance.EndOf(ElementType.td);
        }
        Html.Instance.EndOf(ElementType.tr);
        row.Children.forEach(child => {
            Html.Take(section.Element);
            let rowSection = super.RenderRowData(headers, child, section);
            rowSection.Element.AddClass("group-detail");
            groupSection.ChildrenItems.push(rowSection);
            rowSection.GroupSection = groupSection;
        });
        return groupSection;
    }
    
    

    DispatchClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.Click, row).Done();
    }

    DispatchDblClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.DblClick, row).Done();
    }

    ToggleAll() {
        let allSelected = this.AllListViewItem
            .filter(x => !x.GroupRow && !x.EmptyRow)
            .every(x => x.Selected);
        if (allSelected) {
            this.ClearSelected();
        } else {
            this.RowAction(x => {
                if (x instanceof ListViewItem) {
                    x.Selected = !x.GroupRow && !x.EmptyRow;
                }
            });
        }
    }

    RemoveRowById(id) {
        let index = this.RowData.Data.findIndex(x => x[this.IdField].toString() === id);
        if (index < 0) {
            return;
        }

        this.RowData.Data.splice(index, 1);
        this.FilterChildren(x => x instanceof ListViewItem && x.Entity[this.IdField].toString() === id)
            .forEach(x => {
                if ( x instanceof ListViewItem && x.GroupSection && x.GroupSection.Entity instanceof GroupRowData) {
                    let groupChildren = x.GroupSection.Entity.Children;
                    groupChildren.splice(groupChildren.indexOf(x.Entity), 1);
                    if (groupChildren.length === 0) {
                        this.RowData.Data.splice(this.RowData.Data.indexOf(x.GroupSection.Entity), 1);
                        x.GroupSection.Dispose();
                    }
                }
                x.Dispose();
            });
        this.NoRowData(this.RowData.Data);
    }

    RemoveRange(data) {
        data.forEach(x => this.RemoveRowById(x[this.IdField].toString()));
    }

    async AddRows(rowsData, index = 0) {
        let listItem = [];
        await Promise.all(rowsData.map(async x => {
            listItem.push(await this.AddRow(x, 0, false));
        }));
        return listItem;
    }

    async AddOrUpdateRow(rowData, singleAdd = true, force = false, ...fields) {
        let existRowData = this
           .FilterChildren(x => x instanceof ListViewItem && x.Entity[this.IdField] === rowData[this.IdField])
           .find(x => true);
        if (!existRowData) {
            await this.AddRow(rowData, 0, singleAdd);
            return;
        }
        if (existRowData.EmptyRow) {
            existRowData.Entity = null;
            await this.AddRow(rowData, 0, singleAdd);
        } else {
            existRowData.Entity.CopyPropFrom(rowData);
            // @ts-ignore
            this.RowAction(x => x.Entity === existRowData.Entity, x => x.UpdateView({ force, componentNames: fields }));
        }
    }

    // @ts-ignore
    RenderRowData(headers, row, section, index, emptyRow = false) {
        if (!(row instanceof GroupRowData)) {
            return super.RenderRowData(headers, row, section, index, emptyRow);
        }
        if (!(section.Element instanceof HTMLTableSectionElement)) {
            throw new Error("The section is not an HTML table element");
        }
        Html.Take(section.Element);
        if (row.Key === null || row.Key.toString().trim() === "") {
            let rowResult = null;
            row.Children.forEach(child => {
                Html.Take(section.Element); 
                rowResult = super.RenderRowData(headers, child, section, null);
            });
            return rowResult;
        }
        let first = row.Children[0];
        let groupSection = new GroupViewItem({
            type: ElementType.tr,
            Entity: row,
            ParentElement: section.Element,
            GroupRow: true,
            ListViewSection: section,
            ListView: this
        });
        
        section.AddChild(groupSection);
        groupSection.Element.tabIndex = -1;
        let groupText;
        const fn = Utils.IsFunction(this.Meta.GroupFormat)
        if (fn) {
            groupText = fn.call(this, this, first).toString();
        } else {
            groupText = Utils.FormatEntity2(this.Meta.GroupFormat, null, first, Utils.EmptyFormat, Utils.EmptyFormat);
        }
        if (this.Meta.GroupReferenceId) {
            let val = first.GetPropValue(this.Meta.GroupBy.substr(0, this.Meta.GroupBy.length - 2));
            groupSection.Entity = val;
            groupSection.Entity.SetPropValue("ModelName", this.Meta.RefName);
            headers.filter(x => !x.Hidden).forEach(header => {
                Html.Instance.TData.TabIndex(-1)
                    .Style(header.Style)
                    .Event(EventType.FocusIn, e => this.FocusCell(e, header))
                    .DataAttr("field", header.FieldName).Render();
                let td = Html.Context;
                groupSection.RenderTableCell(val, header, td);
                Html.Instance.EndOf(ElementType.td);
            });
        } else {
            Html.Instance.TData.ClassName("status-cell").Icon("mif-pencil").EndOf(ElementType.td)
                .TData.ColSpan(headers.length - 1)
                .Event(EventType.Click, () => this.DispatchClick(first))
                .Event(EventType.DblClick, () => this.DispatchDblClick(first))
                .Icon("fa fa-chevron-down").Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).End
                .Div.ClassName("d-flex").InnerHTML(groupText);
            groupSection.GroupText = Html.Context;
            groupSection.Chevron = Html.Context.previousElementSibling;
            groupSection.Chevron.ParentElement.PreviousElementSibling.AppendChild(groupSection.Chevron);
            Html.Instance.EndOf(ElementType.td);
        }
        Html.Instance.EndOf(ElementType.tr);
        row.Children.forEach(child => {
            Html.Take(section.Element);
            let rowSection = super.RenderRowData(headers, child, section);
            rowSection.Element.AddClass("group-detail");
            groupSection.ChildrenItems.push(rowSection);
            rowSection.GroupSection = groupSection;
        });
        return groupSection;
    }

    SetRowData(listData) {
        this.RowData._data = [];
        let hasElement = listData.HasElement();
        if (hasElement) {
            listData.forEach(item => this.RowData._data.push(item)); // Not to use AddRange because the _data is not always List
        }
        this.RenderContent();

        if (this.Entity && this.ShouldSetEntity) {
            this.Entity.SetComplexPropValue(this.Name, this.RowData.Data);
        }
    }
}
