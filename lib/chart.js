import { EditableComponent } from "./editableComponent.js";
import * as CanvasJS from "@canvasjs/charts";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
CanvasJS.addColorSet("greenShades100", [
    "#2F4F4F", "#008080", "#2E8B57", "#3CB371", "#90EE90",
    "#006400", "#228B22", "#00FF00", "#32CD32", "#7CFC00",
    "#ADFF2F", "#9ACD32", "#6B8E23", "#556B2F", "#8B4513",
    "#D2691E", "#FF8C00", "#FFA07A", "#FF6347", "#FF4500",
    "#FFD700", "#FFFF00", "#FFFFE0", "#F0E68C", "#BDB76B",
    "#F5DEB3", "#DEB887", "#D2B48C", "#BC8F8F", "#F4A460",
    "#DAA520", "#FFD700", "#F0E68C", "#E6E6FA", "#D8BFD8",
    "#DDA0DD", "#EE82EE", "#DA70D6", "#C71585", "#FF1493",
    "#FF69B4", "#C71585", "#FFB6C1", "#FF00FF", "#8A2BE2",
    "#4B0082", "#6A5ACD", "#483D8B", "#7B68EE", "#4169E1",
    "#4682B4", "#87CEEB", "#00BFFF", "#1E90FF", "#ADD8E6",
    "#B0E0E6", "#87CEFA", "#00CED1", "#40E0D0", "#48D1CC",
    "#20B2AA", "#5F9EA0", "#008B8B", "#008080", "#2F4F4F",
    "#00FF7F", "#32CD32", "#98FB98", "#90EE90", "#00FA9A",
    "#3CB371", "#2E8B57", "#228B22", "#006400", "#7FFF00"
]);
/**
 * Represents a Chart component that can be rendered and updated.
 */
export class Chart extends EditableComponent {
    /**
     * Create instance of component
     * @param {Component | null} meta 
     * @param {HTMLElement | null} ele 
     */
    constructor(meta, ele) {
        super(meta, ele);
        this.Data = [];
    }

    /**
     * Renders the chart component by adding an HTML element and setting up the chart.
     */
    Render() {
        this.AddElement();
        setTimeout(async () => {
            await this.RenderAsync();
        }, 500);
    }

    /**
     * Adds a div element as the chart wrapper if it doesn't already exist.
     */
    AddElement() {
        if (!this.Element) {
            this.Element = Html.Take(this.ParentElement).Div.ClassName("chart-wrapper").GetContext();
        }
    }

    /**
     * Asynchronously renders the chart after data and configurations are ready.
     */
    async RenderAsync() {
        await this.RenderChart();
        this.DOMContentLoaded?.Invoke();
    }

    /**
     * Renders the chart using data available or fetching it if necessary.
     */
    async RenderChart() {
        this.AddElement();
        if (!this.Data || this.Data.length == 0) {
            const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
            const entity = {
                Params: JSON.stringify(submitEntity),
                ComId: this.Meta.Id,
            };
            // @ts-ignore
            this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
                Url: "/api/feature/report",
                IsRawString: true,
                JsonData: JSON.stringify(entity),
                Method: "POST"
            });
        }
        const type = this.Meta.ClassName ?? "pie";
        const text = this.Meta.PlainText;
        let options = null;
        function explodePie(e) {
            if (typeof (e.dataSeries.dataPoints[e.dataPointIndex].exploded) === "undefined" || !e.dataSeries.dataPoints[e.dataPointIndex].exploded) {
                e.dataSeries.dataPoints[e.dataPointIndex].exploded = true;
            } else {
                e.dataSeries.dataPoints[e.dataPointIndex].exploded = false;
            }
            e.chart.render();

        }
        if (Utils.isNullOrWhiteSpace(this.Meta.Template)) {
            options = {
                colorSet: "greenShades100",
                exportEnabled: true,
                animationEnabled: true,
                title: {
                    text: text
                },
                legend: {
                    cursor: "pointer",
                    itemclick: explodePie
                },
                data: [{
                    type: type,
                    showInLegend: true,
                    toolTipContent: "{name}: <strong>{y}</strong>",
                    indexLabel: "{name} - {y}",
                    dataPoints: this.Data
                }]
            };
        } else {
            options = JSON.parse(this.Meta.Template);
            options.data[0].dataPoints = this.Data;
        }
        const chart = new CanvasJS.Chart(this.Element, options);
        chart.render();
    }

    /**
     * Updates the view by potentially clearing existing data and re-rendering the chart.
     * @param {boolean} Force - Forces a data refresh.
     * @param {boolean} Dirty - Marks the current data as dirty.
     * @param {Array<string>} ComponentNames - Specific components to update.
     */
    UpdateView(Force = false, Dirty = null, ComponentNames = []) {
        if (Force) {
            this.Data = null;
        }
        if (this.Element) {
            this.Element.innerHTML = null;
        }
        setTimeout(() => this.RenderChart().then(), 0);
    }
}
