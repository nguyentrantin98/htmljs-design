import { EditableComponent } from "./editableComponent.js";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
import ApexCharts from "apexcharts";
import EventType from "./models/eventType.js";
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
     * @type {HTMLElement}
     */
    SearchElement;
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
            this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
                Url: "/api/feature/report",
                IsRawString: true,
                JsonData: JSON.stringify(entity),
                Method: "POST"
            });
        }
        var options = this.Options;
        if (!Utils.isNullOrWhiteSpace(this.Meta.Template)) {
            options = Utils.IsFunction(this.Meta.Template, false, this);
        }
        var seft = this;
        if (options.chart && options.chart.toolbar && options.chart.toolbar.tools && options.chart.toolbar.tools.customIcons) {
            options.chart.toolbar.tools.customIcons = [
                {
                    icon: '<span class="far fa-filter"></span>',
                    index: -1,
                    title: 'Filter range',
                    class: 'custom-menu-open',
                    click: function (chart, options, e) {
                        seft.ShowSearch();
                    }
                },
                {
                    icon: '<span class="far fa-sync"></span>',
                    index: -1,
                    title: 'Refresh',
                    class: 'custom-menu-open',
                    click: function (chart, options, e) {
                        seft.ShowSearch();
                    }
                }
            ]
        }
        var chart = new ApexCharts(this.Element, options)
        chart.render();
    }

    Options = {
        series: [44, 55, 41, 17, 15],
        chart: {
            width: 380,
            type: 'donut',
            dropShadow: {
                enabled: true,
                color: '#111',
                top: -1,
                left: 3,
                blur: 3,
                opacity: 0.2
            },
            toolbar: {
                show: true,
                tools: {
                    download: false,
                    selection: false,
                    customIcons: []
                }
            }
        },
        stroke: {
            width: 0,
        },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: {
                            showAlways: true,
                            show: true
                        }
                    }
                }
            }
        },
        labels: ["Comedy", "Action", "SciFi", "Drama", "Horror"],
        dataLabels: {
            dropShadow: {
                blur: 3,
                opacity: 0.8
            }
        },
        fill: {
            type: 'pattern',
            opacity: 1,
            pattern: {
                enabled: true,
                style: ['verticalLines', 'squares', 'horizontalLines', 'circles', 'slantedLines'],
            },
        },
        states: {
            hover: {
                filter: 'none'
            }
        },
        theme: {
            palette: 'palette2'
        },
        title: {
            text: "Favourite Movie Type"
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    };

    async ReloadChart() {
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: JSON.stringify(submitEntity),
            ComId: this.Meta.Id,
        };
        this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
            Url: "/api/feature/report",
            IsRawString: true,
            JsonData: JSON.stringify(entity),
            Method: "POST"
        });
        var options = this.Options;
        if (!Utils.isNullOrWhiteSpace(this.Meta.Template)) {
            options = Utils.IsFunction(this.Meta.Template, false, this);
        }
        var chart = new ApexCharts(this.Element, options)
        chart.render();
    }

    CloseSearch() {
        this.SearchElement.remove();
    }

    ShowSearch() {
        Html.Take(this.Element.querySelector(".apexcharts-toolbar")).Div.Style("opacity: 1; pointer-events: all; transition: .15s ease all;").TabIndex(-1).Event(EventType.FocusOut, this.CloseSearch.bind(this)).ClassName("apexcharts-menu");
        this.SearchElement = Html.Context;
        Html.Instance.Div.ClassName("apexcharts-menu-item").TabIndex(-1).IText("This year").End
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").IText("Q1").End
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").IText("Q2").End
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").IText("Q3").End
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").IText("Q4").End
            .End.Render();
            this.SearchElement.focus();
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
