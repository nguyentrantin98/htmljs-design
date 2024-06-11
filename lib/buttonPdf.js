import { GridView } from "gridView.js";
import { Button } from "./button.js";
import { Html } from "./utils/html.js";
import { html2pdf } from './libs/html2pdf.js'
import { Client } from "clients/client.js";
import { Component } from "./models/component.js";
import { PdfReport } from "./pdfReport.js";

export class ButtonPdf extends Button {
    /**
     * Creates an instance of ButtonPdf.
     * @param {Component} ui - The UI component.
     * @param {HTMLElement} ele - The HTML element.
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.Preview = null;
        this.PdfReport = null;
    }

    /**
     * Dispatches the click event.
     */
    // @ts-ignore
    DispatchClick() {
        setTimeout(() => this.DispatchClickAsync(), 0);
    }

    /**
     * Asynchronously handles the click dispatch.
     */
    async DispatchClickAsync() {
        Html.Take(this.TabEditor.Element).Div.ClassName("backdrop")
            .Style("align-items: center;").Escape((e) => this.Preview.remove());
        this.Preview = Html.Context;
        Html.Instance.Div.ClassName("popup-content confirm-dialog").Style("top: 0;")
            .Div.ClassName("popup-title").InnerHTML(this.Meta.PlainText)
            .Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event("click", () => this.ClosePreview())
            .EndOf(".popup-title")
            .Div.ClassName("popup-body scroll-content");
        if (this.Meta.Precision === 2) {
            Html.Instance.Div.ClassName("container-rpt");
            Html.Instance.Div.ClassName("menuBar")
                .Div.ClassName("printBtn")
                // @ts-ignore
                .Button.ClassName("btn btn-success mr-1 fa fa-print").Event("click", () => this.EditForm.PrintSection(this.Preview.querySelector(".print-group"), true, this.Meta)).End
                .Button.ClassName("btn btn-success mr-1").Text("a4").Event("click", () => this.GeneratePdf("a4")).End
                .Button.ClassName("btn btn-success mr-1").Text("a5").Event("click", () => this.GeneratePdf("a5")).End
                .Render();
            Html.Instance.EndOf(".menuBar").Div.ClassName("print-group");
        }
        let body = Html.Context;
        this.PdfReport = new PdfReport(this.Meta);
        this.PdfReport.ParentElement = body;
        if (this.Meta.FocusSearch) {
            if (this.Meta.Precision === 2) {
                // @ts-ignore
                let parentGridView = this.TabEditor.FindActiveComponent(x => x instanceof GridView).FirstOrDefault();
                if(parentGridView instanceof GridView){
                    let selectedData = parentGridView.CacheData;
                    if (!selectedData) {
                        selectedData = parentGridView.RowData.Data;
                    }
                    let selectedRow = selectedData.filter(x => parentGridView.SelectedIds.includes(x["Id"].toString()));
                    for (let item of selectedRow) {
                        let js = new PdfReport(this.Meta);
                        js.ParentElement = body;
                        js.Selected = item;
                        this.Parent.AddChild(js);
                    }
                    setTimeout(() => {
                        let ele = Array.from(this.Preview.querySelectorAll(".print-group"));
                        let printWindow = window.open("", "_blank");
                        printWindow.document.close();
                        printWindow.document.body.innerHTML = ele.map(x => x.outerHTML).join("</br>");
                        printWindow.print();
                        printWindow.addEventListener("mousemove", e => printWindow.close());
                        printWindow.addEventListener("click", e => printWindow.close());
                        printWindow.addEventListener("keyup", e => printWindow.close());
                        printWindow.addEventListener("afterprint", async e => {
                            // @ts-ignore
                            await this.DispatchEvent(this.Meta.Events, "afterprint", selectedRow);
                        });
                        if (this.Meta.Style) {
                            let style = document.createElement("style");
                            style.appendChild(document.createTextNode(this.Meta.Style));
                            printWindow.document.head.appendChild(style);
                        }
                        this.PdfReport.Dispose();
                        this.Preview.remove();
                    }, 2000);
                }
                
            } else {
                this.Parent.AddChild(this.PdfReport);
                let printWindow = window.open("", "_blank");
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.document.body.innerHTML = this.PdfReport.Element.querySelector(".printable").outerHTML;
                    printWindow.print();
                    printWindow.addEventListener("mousemove", e => printWindow.close());
                    printWindow.addEventListener("click", e => printWindow.close());
                    printWindow.addEventListener("keyup", e => printWindow.close());
                    printWindow.addEventListener("afterprint", async e => {
                        // @ts-ignore
                        await this.DispatchEvent(this.Meta.Events, "afterprint", this.EditForm);
                    });
                    if (this.Meta.Style) {
                        let style = document.createElement("style");
                        style.appendChild(document.createTextNode(this.Meta.Style));
                        printWindow.document.head.appendChild(style);
                    }
                    this.PdfReport.Dispose();
                    this.Preview.remove();
                }, 2000);
            }
        } else {
            if (this.Meta.Precision === 2) {
                let parentGridView = this.TabEditor.FindActiveComponent(x => x instanceof GridView).FirstOrDefault();
                if(parentGridView instanceof GridView){
                    let selectedData = parentGridView.CacheData;
                    if (!selectedData) {
                        selectedData = parentGridView.RowData.Data;
                    }
                    let selectedRow = selectedData.filter(x => parentGridView.SelectedIds.includes(x["Id"].toString()));
                    for (let item of selectedRow) {
                        let js = new PdfReport(this.Meta);
                        js.ParentElement = body;
                        js.Selected = item;
                        this.Parent.AddChild(js);
                    }
                }
            } else {
                this.Parent.AddChild(this.PdfReport);
            }
        }
    }

    /**
     * Called when the PDF library is loaded.
     */
    GeneratePdf(format) {
        let task = Client.LoadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
        task.Done(() => this.PdfLibLoaded(format));
    }
    
    PdfLibLoaded(format) {
        let element = this.Preview.querySelector(".print-group");
        let first = element.querySelector(".printable");
        if (first instanceof HTMLElement) { 
            first.style.pageBreakBefore = "auto";
        }
        const openPdfInNewWindow = (pdf) => {
            const blob = pdf.output('blob');
            let isMobile = window['Cordova'] != null;
            if (!isMobile) {
                window.open(window.URL.createObjectURL(blob));
                return;
            }
            let isAndroid = window['device']?.platform === "Android";
            if (isAndroid) {
                window.location.href = window.URL.createObjectURL(blob);
                return;
            }
            if (window['cordova']) { 
                window['cordova'].InAppBrowser.open(window.URL.createObjectURL(blob), "_system");
            }
        };
        // @ts-ignore
        html2pdf().from(element).set({
            jsPDF: { format: format },
            image: { type: 'jpeg', quality: 0.98 },
            pdfCallback: openPdfInNewWindow
        }).save();
    }

    /**
     * Closes the preview.
     */
    ClosePreview() {
        this.Preview.remove();
    }
}
