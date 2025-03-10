import { GridView } from "./gridView.js";
import { Button } from "./button";
import { PdfReport } from "./pdfReport";
import { Html } from "./utils/html.js";
import { Component } from "./models/";
import { Client } from "./clients/index.js";

export class ButtonPdf extends Button {
    /**
     * Create instance of component
     * @param {Component} ui 
     * @param {HTMLElement} ele 
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
        if (this.Meta.Precision == 7) {
            this.DispatchEvent(this.Meta.Events, "click", this, this.Entity).then(() => {
                this.Disabled = false;
                Spinner.Hide();
            });
        }
        else {
            setTimeout(() => this.DispatchClickAsync(), 0);
        }
    }
    /**
    @type {HTMLIFrameElement}
    */
    IFrameElement
    /**
     * Asynchronously handles the click dispatch.
     */
    async DispatchClickAsync() {
        const handlerClose = this.ClosePreview.bind(this);
        const handlerPrint = this.PrintPdf.bind(this);
        const handlerPdf = this.ExportPdf.bind(this);
        Html.Take(this.TabEditor?.Element ?? document.body).Div.ClassName("backdrop").Style("align-items: center;");
        this.Preview = Html.Context;
        Html.Instance.Div.Escape(handlerClose).ClassName("popup-content");
        this.PopupContent = Html.Context;
        Html.Instance.Div.ClassName("popup-title").Span.IText(this.Meta.PlainText || "Report PDF", this.EditForm.Meta.Label);
        this.TitleElement = Html.Context;
        Html.Instance.End.Div.ClassName("title-center");
        this.TitleCenterElement = Html.Context;
        Html.Instance.End.Div.ClassName("icon-box d-flex").Style("display: flex; gap: 20px; align-items: center;")
            .Span.ClassName("fal fa-file-pdf").Event("click", handlerPdf).End
            .Span.ClassName("fal fa-print").Event("click", handlerPrint).End
            .Span.ClassName("fa fa-times").Event("click", handlerClose).End.End.End.Div.ClassName("popup-body scroll-content").Style("padding-bottom: 1rem;max-height:calc(100vh - 9rem) !important;display: flex; align-items: center;background-color:#525659");
        Html.Instance.Iframe.ClassName("container-rpt").Style("margin:auto;background:#fff;overflow: auto;min-height:calc(20rem + 100vh);").Width((this.Meta.ReportTypeId == 2 || this.Meta.ReportTypeId == 4) ? "1123px" : "816px");
        this.IFrameElement = Html.Context;
        var css = document.createElement('style');
        css.textContent = `body {
                                    font-family: 'Montserrat';
                                    font-size: 10pt;
                                    padding-left: 5px !important;
                                    padding-right: 5px !important;
                                }

                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }

                                table {
                                    font-size: unset;
                                }

                                table > tr > td {
                                    vertical-align: top;
                                }

                                td>span,
                                td>p,
                                td>div,
                                td>strong {
                                    padding-left: 2px;
                                    vertical-align: top;
                                    white-space: pre-wrap;
                                }

                                .logo {
                                    min-width: 110px;
                                    min-height: 56px;
                                }

                                .dashed tbody td {
                                    border-bottom: 0.01px dashed rgb(126, 140, 141) !important;
                                }
                                    
                                .a4 {
                                    display: flex;
                                    justify-content: center;
                                    width:210mm;
                                }`;
        var link = document.createElement('link');
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap";
        this.IFrameElement.contentWindow.document.head.appendChild(link);
        this.IFrameElement.contentWindow.document.head.appendChild(css);
        this.PdfReport = new PdfReport(this.Meta);
        this.PdfReport.ParentElement = this.IFrameElement.contentWindow.document.body;
        if (this.Parent) {
            this.Parent.AddChild(this.PdfReport);
        } else {
            this.AddChild(this.PdfReport);
        }
    }
    /**
     * Closes the preview.
     */
    ClosePreview() {
        this.Preview.remove();
    }

    PrintPdf() {
        this.IFrameElement.contentWindow.print();
    }

    ExportPdf() {
        Client.Instance.PostAsync({ Html: this.IFrameElement.contentWindow.document.documentElement.outerHTML }, "/api/GenPdf").then(response => {
            const pdfUrl = response; // Adjust this if your API returns an object containing the URL
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = pdfUrl;
            a.download = this.Meta.PlainText || this.EditForm.Entity.Code || 'output.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }
}
