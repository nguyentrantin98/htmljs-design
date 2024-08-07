import { EditableComponent } from "./editableComponent.js";
import * as CanvasJS from "@canvasjs/charts";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";

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
                Params: submitEntity,
                ComId: this.Meta.Id,
            };
            // @ts-ignore
            this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
                Url: "/api/feature/report",
                IsRawString: true,
                JsonData: JSON.stringify(entity, this.getCircularReplacer(), 2),
                Method: "POST"
            });
        }
        const type = this.Meta.ClassName ?? "pie";
        const text = this.Meta.PlainText;
        let options = null;
        if (!this.Meta.FormatData) {
            options = {
                theme: "light2",
                animationEnabled: true,
                showInLegend: "true",
                legendText: "{name}",
                title: {
                    text: text,
                    fontFamily: "roboto",
                    fontSize: 15
                },
                data: [{
                    type: type,
                    toolTipContent: "{label} {y}",
                    dataPoints: this.Data
                }],
                legend: {
                    cursor: "pointer",
                    fontSize: 9,
                    fontFamily: "roboto",
                }
            };
        } else {
            options = JSON.parse(this.Meta.FormatData);
        }
        var formatter = Utils.IsFunction(this.Meta.Template, false, this);
        if (formatter != null) {
            options.Data = formatter;
        } else if (!this.Meta.GroupBy) {
            options.data = this.Data.reduce((acc, item) => {
                const key = `${item.type || type}|${item.name || ''}|${item.axisYType || ''}`;
                if (!acc[key]) acc[key] = { type: item.type || type, name: item.name, axisYType: item.axisYType, dataPoints: [] };
                acc[key].dataPoints.push({ y: item.y, label: item.label });
                return acc;
            }, {});
            options.data = Object.values(options.data).map(group => ({
                type: group.type,
                toolTipContent: "{label} {y}",
                dataPoints: group.dataPoints
            }));
        } else {
            options.data = [{
                type: type,
                toolTipContent: "{label} {y}",
                dataPoints: this.Data
            }];
        }
        // @ts-ignore
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
