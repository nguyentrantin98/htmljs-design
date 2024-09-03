import { GridView } from "./gridView.js";
import { GroupViewItem } from "./groupViewItem.js";
import { ListViewItem } from "./listViewItem.js";
import { EventType, ElementType } from "./models/";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { Section } from "./index.js";

export class GroupRowData {
    constructor() {
        this.Key = null;
        this.Children = [];
    }
}

export class GroupGridView extends GridView {

    constructor(ui) {
        super(ui);
    }
    Render() {
        super.Render();
        Html.Take(this.Element).ClassName("group-table").End.Render();
    }
    RenderContent() {
        if (!this.LoadRerender) {
            this.Header = this.Header.filter(x => !x.Hidden);
            this.RenderTableHeader(this.Header);
            this.LoadRerender = true;
        }
        if (this.Editable) {
            this.AddNewEmptyRow();
        }
        this.AddSections();
        this.FormattedRowData = this.FormattedRowData.length == 0 ? this.RowData.Data : this.FormattedRowData;
        if (this.FormattedRowData.length == 0) {
            return;
        }
        this.MainSection.Show = false;
        this.MainSection.DisposeChildren();
        this.FormattedRowData.forEach((row, index) => {
            Html.Take(this.MainSection.Element);
            this.RenderRowData1(this.Header, row, this.MainSection, null);
        });
        this.MainSection.Show = true;
        this.ContentRendered();
        window.setTimeout(() => {
            this.RenderIndex();
        }, 500);
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

    /**
     * @param {ListViewItem} rowSection
     */
    MoveEmptyRow(rowSection) {
        let groupSection1 = this.AllListViewItem.find(group => group.GroupRow && group.Entity[this._groupKey] === rowSection.Entity[this._groupKey]);
        if (groupSection1) {
            var tr = rowSection;
            tr.Parent = this.MainSection;
            tr.ListViewSection = this.MainSection;
            tr.GroupSection = groupSection1;
            tr.Element.classList.add("group-detail");
            var lastChild = groupSection1.ChildrenItems[groupSection1.ChildrenItems.length - 1];
            var index = this.AllListViewItem.indexOf(lastChild);
            if (this.AllListViewItem.length == index + 1) {
                this.MainSection.Element.appendChild(tr.Element);
            }
            else {
                this.MainSection.Element.insertBefore(tr.Element, this.AllListViewItem[index + 1].Element);
            }
            this.MainSection.Children.splice(index + 1, 0, tr);
            groupSection1.ChildrenItems.push(tr);
            this.Dirty = true;
            return tr;
        }
        else {
            Html.Take(this.MainSection);
            let first = rowSection.Entity;
            var groupSection = new GroupViewItem(ElementType.tr);
            groupSection.Key = rowSection.Entity[this._groupKey];
            groupSection.Entity = first;
            groupSection.ParentElement = this.MainSection.Element;
            groupSection.ListViewSection = true;
            groupSection.ListViewSection = this.MainSection;
            groupSection.ListView = this;
            this.MainSection.AddChild(groupSection);
            groupSection.Element.tabIndex = -1;
            var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, groupSection);
            Html.Instance.TData.ClassName("status-cell").EndOf(ElementType.td)
                .TData.Event(EventType.Click, () => this.DispatchClick(first))
                .Event(EventType.DblClick, () => this.DispatchDblClick(first))
                .Icon("fal fa-chevron-down").Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).End
                .Div.ClassName("d-flex").InnerHTML(groupText);
            groupSection.GroupText = Html.Context;
            groupSection.Chevron = Html.Context.previousElementSibling;
            groupSection.Chevron.parentElement.previousElementSibling.appendChild(groupSection.Chevron);
            Html.Instance.EndOf(ElementType.td);
            this.Header.slice(2).forEach(item => {
                Html.Instance.TData.ClassName("data-summary").Style("font-weight:600");
                var sec = new Section(null, Html.Context);
                sec.Meta = item;
                groupSection.AddChild(sec);
                Html.Instance.EndOf(ElementType.td);
            });
            Html.Instance.EndOf(ElementType.tr);
            Html.Take(this.MainSection.Element);
            rowSection.Element.classList.add("group-detail");
            groupSection.ChildrenItems.push(rowSection);
            rowSection.GroupSection = groupSection;
            var lastChild = groupSection.ChildrenItems[groupSection.ChildrenItems.length - 1];
            var index = this.AllListViewItem.indexOf(groupSection);
            if (this.AllListViewItem.length == index + 1) {
                this.MainSection.Element.appendChild(rowSection.Element);
            }
            else {
                this.MainSection.Element.insertBefore(rowSection.Element, this.AllListViewItem[index + 1].Element);
            }
            this.MainSection.Children.splice(index + 1, 0, rowSection);
            return rowSection;
        }
    }

    AddRow(row, fromIndex, singleAdd = true) {
        if (!Utils.isNullOrWhiteSpace(this.Meta.GroupBy)) {
            let keys = this.Meta.GroupBy.split(",");
            row[this._groupKey] = keys.map(key => row[key]).join(" ");
        }
        let groupSection1 = this.AllListViewItem.find(group => group.GroupRow && group.Entity[this._groupKey] === row[this._groupKey]);
        if (groupSection1) {
            var tr = super.RenderRowData(this.Header, row, this.MainSection, fromIndex, false);
            tr.GroupSection = groupSection1;
            tr.Element.classList.add("group-detail");
            groupSection1.ChildrenItems.push(tr);
            this.Dirty = true;
            return tr;
        }
        else {
            Html.Take(this.MainSection);
            let first = row;
            var groupSection = new GroupViewItem(ElementType.tr);
            groupSection.Key = row[this._groupKey];
            groupSection.Entity = row;
            groupSection.ParentElement = this.MainSection.Element;
            groupSection.ListViewSection = true;
            groupSection.ListViewSection = this.MainSection;
            groupSection.ListView = this;
            this.MainSection.AddChild(groupSection);
            groupSection.Element.tabIndex = -1
            var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, groupSection);
            Html.Instance.TData.ClassName("status-cell").EndOf(ElementType.td)
                .TData.Event(EventType.Click, () => this.DispatchClick(first))
                .Event(EventType.DblClick, () => this.DispatchDblClick(first))
                .Icon("fal fa-chevron-down").Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).End
                .Div.ClassName("d-flex").InnerHTML(groupText);
            groupSection.GroupText = Html.Context;
            groupSection.Chevron = Html.Context.previousElementSibling;
            groupSection.Chevron.parentElement.previousElementSibling.appendChild(groupSection.Chevron);
            Html.Instance.EndOf(ElementType.td);
            this.Header.slice(2).forEach(item => {
                Html.Instance.TData.ClassName("data-summary").Style("font-weight:600");
                var sec = new Section(null, Html.Context);
                sec.Meta = item;
                groupSection.AddChild(sec);
                Html.Instance.EndOf(ElementType.td);
            });
            Html.Instance.EndOf(ElementType.tr);
            Html.Take(this.MainSection.Element);
            let rowSection = super.RenderRowData(this.Header, row, this.MainSection);
            rowSection.Element.classList.add("group-detail");
            groupSection.ChildrenItems.push(rowSection);
            rowSection.GroupSection = groupSection;
            this.Dirty = true;
            return rowSection;
        }
    }

    // @ts-ignore
    RenderRowData1(headers, row, section, index, emptyRow = false) {
        let groupSection1 = this.AllListViewItem.find(group => group.GroupRow && group.Entity[this._groupKey] === row[this._groupKey]);
        if (groupSection1) {
            var tr = super.RenderRowData(headers, row, section, index, emptyRow);
            tr.GroupSection = groupSection1;
            tr.Element.classList.add("group-detail");
            groupSection1.ChildrenItems.push(tr);
            return tr;
        }
        Html.Take(section.Element);
        let first = row;
        var groupSection = new GroupViewItem(ElementType.tr);
        groupSection.Key = row[this._groupKey];
        if (this.Meta.IsMultiple) {
            groupSection.Entity = JSON.parse(JSON.stringify(row[this.Meta.GroupBy.substr(0, this.Meta.GroupBy.length - 2)]));
            groupSection.Entity[this._groupKey] = row[this._groupKey];
        }
        else {
            groupSection.Entity = row;
        }
        groupSection.ParentElement = section.Element;
        groupSection.ListViewSection = true;
        groupSection.ListViewSection = section;
        groupSection.ListView = this;
        section.AddChild(groupSection);
        groupSection.Element.tabIndex = -1;
        var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, groupSection);
        if (!this.Meta.IsMultiple) {
            Html.Instance.TData.ClassName("status-cell").TabIndex(-1).Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).Icon("fal fa-chevron-down");
            groupSection.Chevron = Html.Context;
            Html.Instance.End.End.TData.Event(EventType.Click, () => this.DispatchClick(first))
                .Event(EventType.DblClick, () => this.DispatchDblClick(first))
                .Div.ClassName("d-flex");
            groupSection.GroupText = Html.Context;
            Html.Instance.InnerHTML(groupText);
            Html.Instance.EndOf(ElementType.td);
            this.Header.slice(2).forEach(item => {
                Html.Instance.TData.ClassName("data-summary").Style("font-weight:600");
                var sec = new Section(null, Html.Context);
                sec.Meta = item;
                groupSection.AddChild(sec);
                Html.Instance.EndOf(ElementType.td);
            });
        }
        else {
            Html.Instance.TData.ClassName("status-cell").TabIndex(-1).Event(EventType.Click, () => groupSection.ShowChildren = !groupSection.ShowChildren).Icon("fal fa-chevron-down");
            groupSection.Chevron = Html.Context;
            Html.Instance.End.EndOf(ElementType.td)
            this.Header.slice(1).forEach(item => {
                Html.Instance.TData.ClassName("data-group");
                groupSection.RenderTableCell(groupSection.Entity, item);
                Html.Instance.EndOf(ElementType.td);
            });
        }
        Html.Instance.EndOf(ElementType.tr);
        Html.Take(section.Element);
        let rowSection = super.RenderRowData(headers, row, section);
        rowSection.Element.classList.add("group-detail");
        groupSection.ChildrenItems.push(rowSection);
        rowSection.GroupSection = groupSection;
        return groupSection;
    }

    DispatchClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.Click, row).then();
    }

    DispatchDblClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.DblClick, row).then();
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
                if (x instanceof ListViewItem && x.GroupSection && x.GroupSection.Entity instanceof GroupRowData) {
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

    async AddRows(rowsData) {
        let listItem = [];
        await Promise.all(rowsData.map(async x => {
            listItem.push(this.AddRow(x, null, false));
        }));
        this.RenderIndex();
        this.DomLoaded();
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
        var groupText = Utils.IsFunction(this.Meta.GroupFormat, false, this);
        if (!groupText) {
            groupText = Utils.FormatEntity2(this.Meta.GroupFormat, null, first, Utils.EmptyFormat, Utils.EmptyFormat);
        }
        if (this.Meta.GroupReferenceId) {
            let val = first[this.Meta.GroupBy.substr(0, this.Meta.GroupBy.length - 2)];
            groupSection.Entity = val;
            groupSection.Entity["ModelName"] = this.Meta.RefName;
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
    /**
     * Updates pagination details based on the current data state.
     */
    RenderIndex() {
        if (this.MainSection.Children.length === 0) {
            return;
        }
        var index = 0;
        var indexRow = 0;
        var isChild = false;
        this.AllListViewItem.forEach((row) => {
            if (row.GroupRow) {
                index = 0;
                isChild = true;
                return;
            }
            if (row.GroupRow && isChild) {
                index = 0;
                isChild = false;
            }
            var previous = row.FirstChild.Element.closest("td").previousElementSibling;
            if (!previous) {
                return;
            }
            if (row.EmptyRow) {
                index = 0;
                previous.innerHTML = "<i class='fal fa-plus'></i>";
            }
            else {
                previous.innerHTML = (index + 1).toString();
                row.RowNo = indexRow;
                indexRow++;
                index++;
            }
        });
    }
}
