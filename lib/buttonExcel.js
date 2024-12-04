import { GridView } from "./gridView.js";
import { Button } from "./button.js";
import { PdfReport } from "./pdfReport.js";
import { Html } from "./utils/html.js";
import { Component } from "./models/index.js";
import { Client } from "./clients/index.js";

export class ButtonExcel extends Button {
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
     * Asynchronously handles the click dispatch.
     */
    async DispatchClickAsync() {
        var response = await this.LoadData();
        const pdfUrl = response; // Adjust this if your API returns an object containing the URL
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = pdfUrl;
        a.download = this.Meta.PlainText || 'output.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    LoadData() {
        let promise = new Promise((resolve, reject) => {
            Client.Instance.PostAsync({ ComId: this.Meta.Id, Data: this.Entity }, "/api/CreateExcel").then(res => {
                resolve(res);
            }).catch(e => {
                resolve(e);
            });
        });
        return promise;
    }
}
