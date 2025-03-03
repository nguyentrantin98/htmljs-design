﻿import { Component } from "./models/component.js";
import { Client } from "./clients/client.js";
import { EditableComponent } from "./editableComponent.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";


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
            this.OriginalText = this.Element.textContent;
            return;
        }
        var textCalc = Utils.IsFunction(this.Meta.FormatData || '', false, this);
        if (textCalc) {
            cellText = textCalc;
            this.Element.innerHTML = cellText;
        }
        else {
            this.CalcCellText(cellData);
        }
    }

    RenderNewEle(cellText, cellData) {
        if (!this.Meta.IsMultiple) {
            if (cellText.includes("<div")) {
                Html.Instance.Div.Render();
            }
            else {
                Html.Instance.Span.ClassName("cell-text").Render();
            }
            if (this.Meta.ComponentType == "Number") {
                Html.Instance.Style("justify-content: end;");
            }
            else if (this.Meta.ComponentType == "Checkbox") {
                Html.Instance.Style("justify-content: center;");
            }
            Html.Instance.InnerHTML(cellText);
        }
        else {
            Html.Instance.Render();
        }
        this.Element = Html.Context;
        Html.Instance.End.Render();
    }

    CalcCellText(cellData) {
        if (this.Meta.Query && this.Meta.ComponentType == "Label") {
            this.RunQuerys().then((data) => {
                var cellText = Utils.GetCellText(this.Meta, cellData, data[0][0], false, this.EmptyRow, this.EditForm?.Entity);
                if (!cellText || cellText == "null") {
                    cellText = "";
                }
                this.Element.innerHTML = cellText;
            });
        }
        else {
            var cellText = Utils.GetCellText(this.Meta, cellData, this.Entity, false, this.EmptyRow, this.EditForm?.Entity);
            if (!cellText || cellText == "null") {
                cellText = "";
            }
            this.Element.innerHTML = cellText;
        }
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
        const cellData = this.Entity[this.Meta.FieldName];
        var cellText = "";
        var textCalc = Utils.IsFunction(this.Meta.FormatData || '', false, this);
        if (textCalc) {
            cellText = textCalc;
            this.Element.innerHTML = cellText;
        }
        else {
            this.CalcCellText(cellData);
        }
    }

    GetValueText() {
        return this.Element.textContent;
    }
}