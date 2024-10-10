import { Client } from "./clients";
import { ConfirmDialog } from "./confirmDialog";
import { EditableComponent } from "./editableComponent";
import { Section } from "./section";
import { ComponentExt } from "./utils/componentExt";
import { Html } from "./utils/html";
import { Utils } from "./utils/utils";
import { Component, ExcelExt, ElementType } from "./models";

export class PdfReport extends EditableComponent {
    static ErrorMessage = "ErrorMessage";
    static DataNotFound = "Không tìm thấy dữ liệu";
    static TemplateNotFound = "Template is null or empty";

    /**
    * @param {Component} ui 
    * @param {HTMLElement} ele
    */
    constructor(ui, ele = null) {
        super(ui);
        if (!ui) throw new Error("ArgumentNullException: ui");
        this.Meta = ui;
        this.Element = ele;
        this.Selected = null;
        this.Data = null;
        this.HiddenButton = false;
        this._rptContent = null;
    }

    Render() {
        if (this.Element === null) {
            this.Element = Html.Take(this.ParentElement).Div.GetContext();
        }
        this.AddSections();
        this.RenderInternal();
    }

    AddSections() {
        Html.Take(this.Element);
        this._rptContent = Html.GetContext();
    }

    async GeneratePdf(format) {
        await Client.LoadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
        let element = this.Element.parentElement.querySelector(".printable");
        if (this.Meta.Precision === 2) {
            element = this.Element.parentElement.querySelector(".print-group");
        }
        const printEl = element;
        if (printEl instanceof HTMLElement) {
            printEl.style.pageBreakBefore = null;
        }

        const openPdfInNewWindow = (pdf) => {
            const blob = pdf.output('blob');
            const isMobile = window['Cordova'] !== undefined;
            if (!isMobile) {
                window.open(window.URL.createObjectURL(blob));
                return;
            }
            const isAndroid = window['device']["platform"] === "Android";
            if (isAndroid) {
                window.location.href = window.URL.createObjectURL(blob);
                return;
            }
            window['cordova'].InAppBrowser.open(window.URL.createObjectURL(blob), "_system");
        };
    }

    RenderInternal() {
        this.DisposeChildren();
        let template = this.Meta.Template;
        this.TemplateLoaded(template);
    }

    TemplateLoaded(template) {
        if (!template) {
            throw new Error(PdfReport.TemplateNotFound);
        }
        this.LoadData().then(html => {
            this.Element.innerHTML = html;
        });
    }

    CloneRow(templateRow) {
        let res = [];
        for (let i = 0; i < templateRow.length; i++) {
            res.push(templateRow[i].cloneNode(true));
        }
        return res;
    }

    LoadData() {
        let promise = new Promise((resolve, reject) => {
            var gridViews = this.EditForm.ChildCom.filter(x => x.IsListView);
            var entity = JSON.parse(JSON.stringify(this.Entity));
            gridViews.forEach((grid, index) => {
                entity["t" + index] = grid.AllListViewItem.filter(x => !x.GroupRow).map(x => x.Entity);
                entity["t" + index + "h"] = grid.Header;
            })
            Client.Instance.PostAsync({ ComId: this.Meta.Id, Data: entity }, "/api/CreateHtml").then(res => {
                resolve(res);
            }).catch(e => {
                reject(e);
            });
        });
        return promise;
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Data = null;
        window.clearTimeout(this._updateViewAwaiter);
        this._updateViewAwaiter = window.setTimeout(() => this.RenderInternal(), 200);
    }
}
