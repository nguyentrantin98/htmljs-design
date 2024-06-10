import EditableComponent from "./editableComponent.js";
import { CanvasJS } from "./libs/canvasjs.min.js";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";

/**
 * Represents a Chart component that can be rendered and updated.
 */
export class Chart extends EditableComponent {
    /**
     * Creates an instance of the Chart component.
     * @param {Component} meta - The UI component.
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
        }, 1000);
    }

    /**
     * Adds a div element as the chart wrapper if it doesn't already exist.
     */
    AddElement() {
        if (!this.Element) {
            // @ts-ignore
            this.Element = Html.Take(this.ParentElement).Div().ClassName("chart-wrapper").GetContext();
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
            const queryFn = Utils.IsFunction(this.Meta.PreQuery);
            const submitEntity = queryFn?.call(null, this);
            const entity = JSON.stringify({
                Params: queryFn ? JSON.stringify(submitEntity) : null,
                ComId: this.Meta.Id,
                MetaConn: this.Meta.MetaConn,
                DataConn: this.Meta.DataConn,
            });
            // @ts-ignore
            this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
                Url: Utils.ComQuery,
                IsRawString: true,
                Value: entity,
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
        var formatter = Utils.IsFunction(this.Meta.FormatEntity);
        if (formatter) {
            options.Data = formatter.call(this, this.Data);
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
        setTimeout(() => this.RenderChart(), 0);
    }
}
