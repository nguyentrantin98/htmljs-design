import { Component } from "./models/component.js";
import { Client } from "./clients/client.js";
import { EditableComponent } from "./editableComponent.js";
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
            this.Element.textContent = cellData ? "✅" : "☐";
            return;
        }
        cellText = this.CalcCellText(cellData);
        this.UpdateEle(cellText);
    }
    /**
     * @param {String} cellText
     */
    UpdateEle(cellText) {
        if (this.Meta.IsMultiple && !Utils.isNullOrWhiteSpace(cellText)) {
            var news = cellText.split(this.Meta.GroupFormat || ",");
            var distinctNews = [...new Set(news)];
            Html.Take(this.Element).Clear();
            Html.Take(this.Element).ForEach(distinctNews, (item) => {
                Html.Instance.Span.ClassName("tag").I.ClassName("fal fa-tag").End.Text(item).End.Render();
            });
        }
        else {
            this.Element.innerHTML = cellText;
        }
        if (!cellText.includes("<div")) {
            this.Element.setAttribute("title", cellText);
        }
    }

    RenderNewEle(cellText, cellData) {
        Html.Take(this.ParentElement).TextAlign(this.CalcTextAlign(this.Meta, cellData));
        if (!this.Meta.IsMultiple) {
            if (cellText.includes("<div")) {
                Html.Instance.Div.Render();
            }
            else {
                Html.Instance.Span.Render();
            }
            Html.Instance.ClassName("cell-text").InnerHTML(cellText);
        }
        else {
            Html.Instance.Div.Render();
        }
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
        const entity = Utils.IsFunction(this.Meta.PreQuery, false, this);
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
        this.DispatchEvent(this.Meta.Events, "click", this, this.Entity).then();
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
        if (header.ComponentType == "Dropdown" || header.ComponentType == "Select2" || cellData === null || typeof cellData === "string") {
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

    GetValueText() {
        return this.Element.textContent;
    }
}