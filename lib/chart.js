import { EditableComponent } from "./editableComponent.js";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
import Highcharts from 'highcharts';
import Exporting from 'highcharts/modules/exporting';
Exporting(Highcharts);
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
                chart: {
                    type: 'pie'
                },
                title: {
                    text: 'Egg Yolk Composition'
                },
                tooltip: {
                    valueSuffix: '%'
                },
                subtitle: {
                    text:
                        'Source:<a href="https://www.mdpi.com/2072-6643/11/3/684/htm" target="_default">MDPI</a>'
                },
                plotOptions: {
                    series: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: [{
                            enabled: true,
                            distance: 20
                        }, {
                            enabled: true,
                            distance: -40,
                            format: '{point.percentage:.1f}%',
                            style: {
                                fontSize: '1.2em',
                                textOutline: 'none',
                                opacity: 0.7
                            },
                            filter: {
                                operator: '>',
                                property: 'percentage',
                                value: 10
                            }
                        }]
                    }
                },
                series: [
                    {
                        name: 'Percentage',
                        colorByPoint: true,
                        data: [
                            {
                                name: 'Water',
                                y: 55.02
                            },
                            {
                                name: 'Fat',
                                sliced: true,
                                selected: true,
                                y: 26.71
                            },
                            {
                                name: 'Carbohydrates',
                                y: 1.09
                            },
                            {
                                name: 'Protein',
                                y: 15.5
                            },
                            {
                                name: 'Ash',
                                y: 1.68
                            }
                        ]
                    }
                ]
            };
        } else {
            options = JSON.parse(this.Meta.Template);
            options.series[0].data = this.Data;
        }
        Highcharts.chart(this.Element, options);
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
