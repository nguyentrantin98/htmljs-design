import { GroupRowData } from "./groupGridView.js";
import { GroupViewItem } from "./groupViewItem.js";
import { ListView } from "./listView.js";
import { ListViewItem } from "./listViewItem.js";
import { ElementType } from "./models/elementType.js";
import EventType from "./models/eventType.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";

export class GroupListView extends ListView {
    static _groupKey = "__groupkey__";
    static GroupRowClass = "group-row";

    constructor(ui) {
        super(ui);
    }

    Render() {
        super.Render();
        Html.Take(this.Element).ClassName("group-listview").End.Render();
    }

    AddRow(item, fromIndex, singleAdd = true) {
        return new Promise((resolve) => {
            fromIndex = 0;
            this.DisposeNoRecord();
            const keys = this.Meta.GroupBy.split(",");
            item[GroupListView._groupKey] = keys.map(key => item[key]?.toString()).join(" "); 
            const groupKey = item[GroupListView._groupKey]; 
            const existGroup = this.AllListViewItem.find(group => group.GroupRow && group.Entity.As('GroupRowData').Key === groupKey); 
    
            if (existGroup === null) {
                const groupData = new GroupRowData();
                groupData.Key = groupKey;
                groupData.Children.push(item); 
                this.FormattedRowData.push(groupData);
                const rowSection = this.RenderRowData(this.Header, groupData, this.MainSection, this.MainSection.Children.length);
                if (singleAdd) {
                    this.AddNewEmptyRow(); 
                }
                this.Dirty = true; 
                resolve(rowSection);
            } else {
                existGroup.Entity.As('GroupRowData').Children.push(item);
                const index = this.MainSection.Children.indexOf(existGroup);
                const rowSection = this.RenderRowData(this.Header, item, this.MainSection, index + existGroup.Children.length); // Thực hiện render dữ liệu cho item mới trong nhóm
                if (singleAdd) {
                    this.AddNewEmptyRow(); 
                }
                this.Dirty = true; 
                resolve(rowSection);
            }
        });
    }

    AddRows(rowsData, index = 0) {
        let listItem = [];
        rowsData.forEach(async x => {
            listItem.push(await this.AddRow(x, 0, false));
        });
        return Promise.all(listItem);
    }

    RenderRowData(headers, row, listViewSection, index, emptyRow = false) {
        if (!(row instanceof GroupRowData)) {
            return super.RenderRowData(headers, row, listViewSection, index, emptyRow);
        }
        let wrapper = listViewSection.Element;
        if (!row.Key || row.Key.toString().IsNullOrWhiteSpace()) {
            let rowResult = null;
            row.Children.forEach(child => {
                Html.Take(wrapper);
                rowResult = this.RenderRowData(headers, child, listViewSection, null);
            });
            return rowResult;
        }
        let groupSection = new GroupViewItem(ElementType.div);
        groupSection.Entity = row;
        groupSection.ParentElement = wrapper;
        groupSection.GroupRow = true;
        groupSection.PreQueryFn = this._preQueryFn;
        groupSection.ListView = this;
        groupSection.Meta = this.Meta;
        listViewSection.AddChild(groupSection);
        let first = row.Children[0];
        let groupText = Utils.FormatEntity2(this.Meta.GroupFormat, null, first, x => "N/A", x => "N/A");
        Html.Take(groupSection.Element).Event(EventType.Click, this.DispatchClick.bind(this), first)
            .Event(EventType.DblClick, this.DispatchDblClick.bind(this), first)
            // @ts-ignore
            .Icon("fa fa-chevron-right").Event(EventType.Click, this.ToggleGroupRow.bind(this), groupSection).End
            .Span.InnerHTML(groupText);
        groupSection.GroupText = Html.Context;
        row.Children.forEach(child => {
            Html.Take(groupSection.Element);
            let childRow = this.RenderRowData(headers, child, groupSection, null);
            childRow.GroupSection = groupSection;
            Html.Take(childRow.Element).SmallCheckbox().Render();
            let chk = Html.Context.previousElementSibling;
            if(chk instanceof HTMLInputElement) {
                Html.Instance.End.End.Event(EventType.Click, (e) => {
                    e.PreventDefault();
                    childRow.Selected = !childRow.Selected;
                    chk.checked = childRow.Selected;
                });
            }
        });
        return groupSection;
    }

    DispatchClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.Click, row).Done();
    }

    DispatchDblClick(row) {
        this.DispatchEvent(this.Meta.GroupEvent, EventType.DblClick, row).Done();
    }

    ToggleGroupRow(groupSection, e) {
        const target = e.target;
        if (!target.classList.contains("fa-chevron-right") && !target.classList.contains("fa-chevron-down")) {
            return;
        }
        if (target.classList.contains("fa-chevron-right")) {
            target.classList.replace("fa-chevron-right", "fa-chevron-down");
            groupSection.Children.forEach(x => x.Show = false);
        } else {
            target.classList.replace("fa-chevron-down", "fa-chevron-right");
            groupSection.Children.forEach(x => x.Show = true);
        }
    }

    RemoveRowById(id) {
        const index = this.RowData.Data.findIndex(x => x[this.IdField].toString() === id);
        if (index < 0) {
            return;
        }
        this.RowData.Data.splice(index, 1);
        this.FilterChildren(x => x instanceof ListViewItem && x.Entity[this.IdField].toString() === id)
            .forEach(x => {
                if (x instanceof ListViewItem) {
                if (x.GroupSection && x.GroupSection.Entity instanceof GroupRowData) {
                    const groupChildren = x.GroupSection.Entity.Children;
                    groupChildren.Remove(x.Entity);
                    if (!groupChildren.length) {
                        this.RowData.Data.Remove(x.GroupSection.Entity);
                        x.GroupSection.Dispose();
                    }
                }
            }
                x.Dispose();
            });
        if (!this.RowData.Data.length) {
            this.NoRecordFound();
        }
    }

    RemoveRange(data) {
        data.forEach(x => this.RemoveRowById(x[this.IdField].toString()));
    }

    async AddOrUpdateRow(rowData, singleAdd = true, force = false, fields = []) {
        let existRowData = this.FilterChildren(x => x instanceof ListViewItem && x.Entity === rowData).pop(); // pop() lấy phần tử cuối cùng tương đương FirstOrDefault

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
            this.RowAction(x => x instanceof ListViewItem && x.Entity === existRowData.Entity, x => {
                if (x instanceof ListViewItem) {
                    x.EmptyRow = false;
                    x.UpdateView(force, fields);
                    x.Dirty = true;
                }
            });
        }

        if (singleAdd) {
            this.AddNewEmptyRow();
        }
    }
}
