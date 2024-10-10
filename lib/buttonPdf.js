import { GridView } from "./gridView.js";
import { Button } from "./button";
import { PdfReport } from "./pdfReport";
import { Html } from "./utils/html.js";
import { Component } from "./models/";

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
        Html.Take(this.TabEditor?.Element ?? document.body).Div.ClassName("backdrop").Style("align-items: center;").Escape(handlerMail);
        this.Preview = Html.Context;
        Html.Instance.Div.ClassName("popup-content");
        this.PopupContent = Html.Context;
        Html.Instance.Div.ClassName("popup-title").Span.IText(this.Meta.PlainText || "Report PDF");
        this.TitleElement = Html.Context;
        Html.Instance.End.Div.ClassName("title-center");
        this.TitleCenterElement = Html.Context;
        Html.Instance.End.Div.ClassName("icon-box d-flex").Style("display: flex; gap: 20px; align-items: center;").Span.ClassName("fa fa-times")
            .Event("click", handlerMail).End.End.End.Div.ClassName("popup-body scroll-content").Style("padding-bottom: 1rem;max-height:calc(100vh - 9rem) !important;display: flex; align-items: center;background-color:#525659");
        Html.Instance.Iframe.ClassName("container-rpt").Style("margin:auto;background:#fff;overflow: auto;min-height:calc(100vh - 10rem);").Width("220mm");
        this.IFrameElement = Html.Context;
        var style = `table td{ vertical-align: middle; } p{ margin:0; } body { font-size: 10px;}`;
        var styleElement = document.createElement('style');
        styleElement.textContent = style;
        this.IFrameElement.contentWindow.document.head.appendChild(styleElement);
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
}
