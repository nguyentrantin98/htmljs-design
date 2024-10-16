import { GridView } from "./gridView.js";
import { Button } from "./button";
import { PdfReport } from "./pdfReport";
import { Html } from "./utils/html.js";
import { Component } from "./models/";
import { html2pdf } from "html2pdf.js";

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
        setTimeout(() => this.DispatchClickAsync(), 0);
    }
    /**
    @type {HTMLIFrameElement}
    */
    IFrameElement
    /**
     * Asynchronously handles the click dispatch.
     */
    async DispatchClickAsync() {
        const handlerMail = this.ClosePreview.bind(this);
        const handlerPrint = this.PrintPdf.bind(this);
        const handlerPdf = this.ExportPdf.bind(this);
        Html.Take(this.TabEditor?.Element ?? document.body).Div.ClassName("backdrop").Style("align-items: center;").Escape(handlerMail);
        this.Preview = Html.Context;
        Html.Instance.Div.ClassName("popup-content");
        this.PopupContent = Html.Context;
        Html.Instance.Div.ClassName("popup-title").Span.IText(this.Meta.PlainText || "Report PDF");
        this.TitleElement = Html.Context;
        Html.Instance.End.Div.ClassName("title-center");
        this.TitleCenterElement = Html.Context;
        Html.Instance.End.Div.ClassName("icon-box d-flex").Style("display: flex; gap: 20px; align-items: center;")
            .Span.ClassName("fal fa-print").Event("click", handlerPrint).End
            .Span.ClassName("fa fa-times").Event("click", handlerMail).End.End.End.Div.ClassName("popup-body scroll-content").Style("padding-bottom: 1rem;max-height:calc(100vh - 9rem) !important;display: flex; align-items: center;background-color:#525659");
        Html.Instance.Iframe.ClassName("container-rpt").Style("margin:auto;background:#fff;overflow: auto;min-height:calc(100vh - 10rem);").Width("210mm");
        this.IFrameElement = Html.Context;
        var css = document.createElement('link');
        css.rel = "stylesheet";
        css.href = "/custom.css";
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
     * Called when the PDF library is loaded.
     */
    GeneratePdf(format) {
        this.PdfLibLoaded(format);
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
        html2pdf().from(iframeBody).set({
            margin: 1,
            filename: this.Meta.PlainText + '.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'in', format: 'letter' }
        }).save();
    }
}
