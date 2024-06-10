import { ListView } from "listView";
import { Spinner } from "spinner";
import { Html } from "utils/html";
import { Utils } from "utils/utils";
import { SqlViewModel } from "models/sqlViewModel";
import { ListViewItem } from "listViewItem";
import EventType from "models/eventType";
import { Client } from "clients/client";
import { ElementType } from "models/elementType";

export class TreeView extends ListView {
    constructor(ui) {
        super(ui);
    }

    Rerender() {
        this.DisposeNoRecord();
        this.Header = this.Header.filter(x => !x.Hidden);
        this.MainSection.Element.AddClass("overflow");
        const firstData = this.FormattedRowData.Nothing() ? this.RowData.Data : this.FormattedRowData;
        this.RenderContent(this.Header, this.MainSection, true, firstData);
        this.MainSection.DisposeChildren();
        if (this.Editable) {
            this.AddNewEmptyRow();
        } else if (this.RowData.Data.Nothing()) {
            this.NoRecordFound();
            this.DomLoaded();
            return;
        }
        if (this.MainSection.Element instanceof HTMLTableSectionElement) {
            this.MainSection.Element.addEventListener(EventType.ContextMenu, this.BodyContextMenuHandler.bind(this));
        }
        this.DomLoaded();
        Spinner.Hide();
    }

    RenderContent(headers, node, first, rowDatas) {
        if (rowDatas.Nothing()) {
            return;
        }
        Html.Take(node.Element).Ul.ClassName((!first ? "d-block " : " ") + (first ? " wtree" : " "));
        const ul = Html.Context;
        rowDatas.forEach(async (row) => {
            await this.RenderRow(headers, node, row, ul);
        });
    }

    RenderRow(headers, node, row, ul) {
        const fn = Utils.IsFunction(this.Meta.PreQuery);
        // @ts-ignore
        const data = await Client.Instance.ComQuery(new SqlViewModel({
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
            ComId: this.Meta.Id,
            Params: fn ? JSON.stringify(fn.call(null, this)) : null
        })).Done(ds => {
            const datas = ds.length > 0 ? ds[0].ToList() : null;
            const count = ds.length > 1 && ds[1].length > 0 ? ds[1].total : 0;
            Html.Take(ul);
            const rowSection = new ListViewItem(ElementType.li, 
                // @ts-ignore
                {
                Entity: row,
                ListViewSection: this.MainSection
            });
            node.AddChild(rowSection);
            Html.Instance.Div.ClassName(count > 0 ? "has" : "").Render();
            const label = Html.Context;
            headers.forEach(header => {
                const com = header;
                Html.Take(label).P.Render();
                rowSection.RenderTableCell(row, com);
                Html.Take(label).EndOf(ElementType.p);
            });
            if (count > 0) {
                rowSection.Element.addEventListener(EventType.Click, () => this.FocusIn(rowSection, row, datas));
            }
        });
    }
    

    FocusIn(listViewItem, row, datas) {
        const ul = listViewItem.Element.QuerySelector("ul");
        if (listViewItem.Element.HasClass("expanded")) {
            ul.RemoveClass("d-block");
            ul.AddClass("d-none");
            listViewItem.Element.RemoveClass("expanded");
        } else {
            listViewItem.Element.AddClass("expanded");
            if (!ul) {
                this.RenderContent(this.Header, listViewItem, false, datas);
            } else {
                ul.RemoveClass("d-none");
                ul.AddClass("d-block");
                listViewItem.Element.AddClass("expanded");
            }
        }
    }

    CalcFilterQuery() {
        let res = super.CalcFilterQuery();
        const resetSearch = this.ListViewSearch.EntityVM.SearchTerm && this.AdvSearchVM.Conditions.Nothing();
        if (!resetSearch) {
            let filterPart = OdataExt.GetClausePart(res, OdataExt.FilterKeyword);
            filterPart = filterPart.replace(new RegExp("((and|or) )?Parent(\\w|\\W)* eq null( (and|or)$)?", "g"), "");
            filterPart = filterPart.replace(new RegExp("^Parent(\\w|\\W)* eq null( (and|or))?", "g"), "");
            res = OdataExt.ApplyClause(res, filterPart);
        }
        return res;
    }
}