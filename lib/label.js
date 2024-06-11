import { Component } from "./models/component.js";
import { Client } from "./clients/client.js";
import EditableComponent from "./editableComponent.js";
import { Direction, Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { ComponentExt } from "./utils/componentExt.js";


export class Label extends EditableComponent {
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
    }

    Render() {
        this.SetDefaultVal();
        const cellData = this.Entity[this.Meta.FieldName];
        let cellText = '';
        if (!this.Element) {
            this.RenderNewEle(cellText, cellData);
        }
        if (this.Meta && this.Meta.ComponentType == "Checkbox") {
            this.Element.InnerHTML = cellData ? "✅" : "☐";
            return;
        }


        if (!Utils.isNullOrWhiteSpace(this.Meta.Query)) {
            var formatter = Utils.IsFunction(this.Meta.Query);
            if (this.Meta.Query) {
                this.QueryCellText(formatter);
                return;
            }
        }
        else {
            cellText = this.CalcCellText(cellData);
            this.UpdateEle(cellText);
        }
    }

    RenderCellTextAsync() {
    }

    UpdateEle(cellText) {
        this.Element.innerHTML = cellText;
        if (!cellText.includes("<div")) {
            this.Element.setAttribute("title", cellText);
        }
    }

    RenderNewEle(cellText, cellData) {
        Html.Take(this.ParentElement).TextAlign(this.CalcTextAlign(this.Meta, cellData));
        if (cellText.includes("<div")) {
            Html.Instance.Div.Render();
        }
        else {
            Html.Instance.Span.Render();
        }
        Html.Instance.ClassName("cell-text").InnerHTML(cellText);
        this.Element = Html.Context;
        Html.Instance.End.Render();
    }

    CalcCellText(cellData) {
        var cellText = Utils.GetCellText(this.Meta, cellData, this.Entity, false, this.EmptyRow, this.EditForm?.Entity);
        if (!cellText || cellText == "null") {
            cellText = "";
        }
        return cellText;
    }

    QueryCellText(formatter) {
        if (!this.Meta.PreQuery || formatter === null) {
            return;
        }
        const fn = Utils.IsFunction(this.Meta.PreQuery);
        const entity = fn ? fn.call(this, this).toString() : "";
        const submit = {
            MetaConn: this.MetaConn,
            DataConn: this.DataConn,
            Params: JSON.stringify(entity),
            ComId: this.Meta.Id
        };
        // @ts-ignore
        Client.Instance.SubmitAsync({ Method: "POST", Url: Utils.ComQuery, Value: JSON.stringify(submit) })
            .then(data => {
                if (data.Nothing()) {
                    return;
                }
                const text = formatter.call(this, this, data).toString();
                this.UpdateEle(text, null, false);
            });
    }

    LabelClickHandler(e) {
        this.DispatchEvent(this.Meta.Events, "click", this.Entity);
    }

    /**
     * 
     * @param {Component} header 
     * @param {any} cellData 
     * @returns {string}
     */
    CalcTextAlign(header, cellData) {
        const textAlign = header.TextAlignEnum;
        if (textAlign) {
            return textAlign;
        }
        if (header.ReferenceId || cellData === null || typeof cellData === "string") {
            return "left";
        }
        if (typeof cellData === "number") {
            return "right";
        }
        if (typeof cellData === "boolean") {
            return "center";
        }
        return "center";
    }

    UpdateView(force = false, dirty = null, componentNames) {
        this.PrepareUpdateView(force, dirty);
        this.Render();
    }

    GetValueTextAct() {
        return this.Element.textContent;
    }
}