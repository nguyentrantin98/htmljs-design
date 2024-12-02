import { Component, ElementType } from "./models/";
import { ListViewItem } from "./listViewItem.js";
import { Html } from "./utils/html.js";

export class GridViewItem extends ListViewItem {
    constructor(tr) {
        super(tr);
    }

    /**
     * 
     * @param {Component[]} headers 
     * @param {any} row 
     * @param {number} index 
     * @param {*} emptyRow 
     */
    RenderRowData(headers, row, index = null, emptyRow = false) {
        if (index !== null) {
            if (index >= this.Element.parentElement.children.length || index < 0) {
                index = 0;
            }
            this.Element.parentElement.insertBefore(this.Element, this.Element.parentElement.children[index]);
        }
        headers.filter(x => !x.Hidden).forEach(header => {
            this.RenderTableCell(row, header, null);
        });
    }

    /**
     * @param {any} rowData
     * @param {Component} header
     */
    RenderTableCell(rowData, header, cellWrapper = null) {
        Html.Take(this.Element).TData.TabIndex(-1).DataAttr("field", header.FieldName).TextAlign(header.TextAlign || 'left').Event("focusin", (e) => this.FocusCell(e, header));
        var td = Html.Instance.GetContext();
        Html.Instance.Event("keydown", (e) => this.ListViewItemTab(e, td, header));
        header.FocusSearch = true;
        super.RenderTableCell(rowData, header, cellWrapper ?? Html.Context);
        Html.Instance.EndOf(ElementType.td);
    }

    /**
     * @param {Event} e
     * @param {Component} header
     */
    FocusCell(e, header) {
        if (this.ListView == null) {
            return;
        }
        if (this.ListView.LastElementFocus) {
            this.ListView.LastElementFocus?.closest("td").classList.remove("cell-selected");
        }

        /** @type {HTMLTableCellElement} */
        // @ts-ignore
        let td = e.target;
        td.closest("td").classList.add("cell-selected");
        this.ListView.LastElementFocus = td;
        this.ListView.LastComponentFocus = header;
        this.ListView.EntityFocusId = this.EntityId;
    }
}