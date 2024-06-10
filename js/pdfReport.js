import { Client } from "clients/client";
import { ConfirmDialog } from "confirmDialog";
import EditableComponent from "editableComponent";
import { Component } from "models/component";
import { ElementType } from "models/elementType";
import { SqlViewModel } from "models/sqlViewModel";
import { Section } from "section";
import { ComponentExt } from "utils/componentExt";
import { Html } from "utils/html";
import { html2pdf } from "libs/html2pdf";
import { Utils } from "utils/utils";

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
        this.Element.innerHTML = null;
        this.AddSections();
        this.RenderInternal();
    }

    AddSections() {
        if (this._rptContent !== null || !this.Show) {
            return;
        }
        this.Element.style.display = "none";
        const html = Html.Take(this.Element);
        if (this.Meta.Precision === 2) {
            html.Div.ClassName("printable").Style("page-break-before: always;");
            this._rptContent = html.GetContext();
        } else {
            html.Div.ClassName("container-rpt");
            const menuBar = html.Div.ClassName("menuBar");
            menuBar.Div.ClassName("printBtn")
                // @ts-ignore
                .Button.ClassName("btn btn-success mr-1 fa fa-print").Event("click", () => this.EditForm.PrintSection(this.Element.querySelector(".printable"), true, this.Meta)).End
                .Button.ClassName("btn btn-success mr-1").Text("a4").Event("click", async () => await this.GeneratePdf("a4")).End
                .Button.ClassName("btn btn-success mr-1").Text("a5").Event("click", async () => await this.GeneratePdf("a5")).End
                .Button.ClassName("btn btn-success mr-1 fa fa-file-excel").Event("click", () => {
                    const table = this._rptContent.querySelector("table");
                    if (!table) {
                        ConfirmDialog.RenderConfirm("Excel data not found in the report");
                        return;
                    }
                    ExcelExt.ExportTableToExcel(null, this.Meta.Label ?? this.Name, table);
                }).End.Render();
            if (Client.SystemRole) {
                menuBar.Button.ClassName("btn btn-success mr-1").ClassName("far fa-eye")
                    .Event("click", () => this.EditForm.PrintSection(this.Element.querySelector(".printable"))).End.Render();
            }
            menuBar.EndOf(".menuBar");
            html.Div.ClassName("printable").Style("page-break-before: always;");
            this._rptContent = html.GetContext();
        }
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
        // @ts-ignore
        html2pdf().from(element).set({
            jsPDF: { format: format },
            image: { type: 'jpeg', quality: 0.98 },
            pdfCallback: openPdfInNewWindow
        }).save();
    }

    RenderInternal() {
        if (!this.Show) {
            return;
        }
        this.DisposeChildren();
        let template;
        if (this.Meta.Template) {
            template = this.Meta.Template;
            this.TemplateLoaded(template);
        } else {
            ComponentExt.LoadFeature(this.Meta.RefClass, this.Meta.RefClass)
            .Done(ft => {
                template = ft.Template;
                this.TemplateLoaded(template);
            });
        }
    }

    TemplateLoaded(template) {
        if (!template) {
            throw new Error(PdfReport.TemplateNotFound);
        }
        this.LoadData().Done(dataSet => {
            if (!dataSet) {
                this.ShowErrorMessage(PdfReport.DataNotFound);
                return;
            }
            this.Element.style.display = "";
            // @ts-ignore
            const formatted = Utils.FormatEntity(template, null, dataSet, x => "");
            this._rptContent.innerHTML = formatted;
            let dsCount = 0;
            this._rptContent.children.forEach(child => {
                if(child instanceof HTMLElement) {
                    this.EditForm.BindingTemplate(child, this, dataSet, (ele, component, parent, entity) => {
                        if (ele.tagName === "TABLE") {
                            dsCount++;
                            const ds = dataSet["ds" + dsCount];
                            var com = new Section(ElementType.table)
                            {
                                Element = ele
                            };
                            const tbody = ele.tBodies[0];
                            let arr = ds;
                            if (!arr || arr.length === 0) {
                                arr = [{}];
                            }
                            const formattedRows = arr.map(arrItem => {
                                const cloned = this.CloneRow(tbody.rows);
                                return this.BindingRowData(cloned, arrItem);
                            }).flat();
                            tbody.innerHTML = "";
                            formattedRows.forEach(x => tbody.appendChild(x));
                            return com;
                        }
                        return this.EditForm.BindingCom(ele, component, parent, entity);
                    });
                }
            });
            if (this.Meta && this.Meta.Events.HasAnyChar()) {
                this.DispatchEvent(this.Meta.Events, "DOMContentLoaded", this.Entity).Done();
            }
        });
    }

    ShowErrorMessage(message) {
        if (this.Element.hidden) {
            return;
        }
        this.Element.style.display = "none";
        ConfirmDialog.RenderConfirm(message);
    }

    BindingRowData(template, arrItem) {
        if (arrItem === null || !template || template.length === 0) {
            return null;
        }
        let res = [];
        let subRowIndex = template.findIndex(x => x.dataset.subRpt === "true");
        for (let i = 0; subRowIndex >= 0 && i < subRowIndex || subRowIndex < 0 && i < template.length; i++) {
            // @ts-ignore
            template[i].innerHTML = Utils.FormatEntity(template[i].innerHTML, null, arrItem, x => "", x => "");
            res.push(template[i]);
        }
    
        if (subRowIndex < 0) {
            return res;
        }
    
        let cloned = template.slice(subRowIndex);
        let subGridRows = this.BindingSubGrid(cloned, arrItem);
        if (subGridRows && subGridRows.length > 0) {
            res = res.concat(subGridRows);
        }
        return res;
    }
    

    BindingSubGrid(template, groupItem) {
        let arrayField = "SubRpt";
        for (const field in groupItem) if (Array.isArray(groupItem[field])) arrayField = field;

        const cells = Array.from(template.flatMap(x => Array.from(x.cells)));
        const firstRowIndex = template.findIndex(x => x === cells.find(a => a.innerHTML.includes("{") && x.innerHTML.includes("}"))?.parentElement);
        const lastRowIndex = template.findIndex(x => x === cells.find(a => a.innerHTML.includes("{") && x.innerHTML.includes("}"))?.parentElement);
        if (!Array.isArray(groupItem[arrayField])) {
            return null;
        }
        const res = [...template.slice(0, firstRowIndex)];
        for (let i = 0; i < groupItem[arrayField].length; i++) {
            const subTemplate = this.CloneRow(template.slice(firstRowIndex, lastRowIndex + 1));
            const formatted = this.BindingRowData(subTemplate, groupItem[arrayField][i]);
            if (formatted && formatted.length > 0) {
                res.push(...formatted);
            }
        }
        res.push(...template.slice(lastRowIndex + 1));
        return res;
    }

    CloneRow(templateRow) {
        let res = [];
        for (let i = 0; i < templateRow.length; i++) {
            res.push(templateRow[i].cloneNode(true));
        }
        return res;
    }

    LoadData() {
        if (this.Data !== null) {
            let res = this.ProcessData(this.Data);
            return Promise.resolve(res);
        }
    
        let promise = new Promise((resolve, reject) => {
            const fn = this.Meta.PreQuery;
            let isFn = Utils.IsFunction(fn);
    
            if (!isFn) {
                reject(new Error("PreQuery is not a function"));
                return;
            }
    
            let sql = {
                ComId: this.Meta.Id,
                Params: JSON.stringify(isFn.call(null, this)),
                MetaConn: this.MetaConn,
                DataConn: this.DataConn,
                WrapQuery: false
            };
    
            Client.Instance.ComQuery(sql).then(ds => {
                this.Data = ds;
                let res = this.ProcessData(this.Data);
                resolve(res);
            }).catch(e => {
                this.ShowErrorMessage(e.message);
                reject(e);
            });
        });
    
        return promise;
    }

    ProcessData(dataSet) {
        let res = {};
        for (let i = 0; i < dataSet.length; i++) {
            for (let j = 0; j < dataSet[i].length; j++) {
                for (let prop in dataSet[i][j]) {
                    if (typeof dataSet[i][j][prop] === 'string') {
                        dataSet[i][j][prop] = Utils.DecodeSpecialChar(dataSet[i][j][prop]);
                    }
                }
            }
            if (i === 0) {
                for (let field in dataSet[0][0]) {
                    res[field] = dataSet[0][0][field];
                }
            } else {
                let ds = dataSet[i];
                let subRptField = [];
                let groupField = [];
                let subRptName;
                if (ds === null || ds.length === 0) continue;
                for (let field in ds[0]) {
                    if (field.indexOf('.') >= 0) subRptField.push(field);
                    else groupField.push(field);
                }
                if (subRptField.length > 0) {
                    subRptName = subRptField[0].split('.')[0];
                    let fieldMap = subRptField.map(x => ({ field: x.split('.').pop(), fullField: x }));
                    ds = ds.reduce((acc, curr) => {
                        let key = groupField.map(g => curr[g]).join('_');
                        if (!acc[key]) acc[key] = { ...curr, [subRptName]: [] };
                        let childRes = {};
                        fieldMap.forEach(field => {
                            childRes[field.field] = curr[field.fullField];
                            delete curr[field.fullField];
                        });
                        acc[key][subRptName].push(childRes);
                        return acc;
                    }, {});
                    res['ds' + i] = Object.values(ds);
                }
            }
        }
        if (Utils.IsFunction(this.Meta.FormatEntity)) {
            const fn = Utils.IsFunction(this.Meta.FormatEntity)
            return fn.call(null, res, this);
        }
        return res;
    }
    
    

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Data = null;
        window.clearTimeout(this._updateViewAwaiter);
        this._updateViewAwaiter = window.setTimeout(() => this.RenderInternal(), 200);
    }
}
