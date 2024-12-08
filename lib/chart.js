import { EditableComponent } from "./editableComponent.js";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Client } from "./clients/client.js";
import { Component } from "./models/component.js";
import * as echarts from 'echarts';
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
            this.Element = Html.Take(this.ParentElement).Div.ClassName("chart-wrapper").Style(this.Meta.Style || "height:350px").GetContext();
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
                Params: submitEntity ? JSON.stringify(submitEntity) : null,
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
        options.toolbox = {
            feature: {
                myFilter: {
                    show: true,
                    title: 'Filter Data',
                    icon: 'path://M8 2L2 14h12L8 2z',
                    onclick: () => {
                        this.ShowSearch();
                    },
                },
            }
        };
        var myChart = echarts.init(this.Element, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        if (options && typeof options === 'object') {
            myChart.setOption(options);
        }
        window.addEventListener('resize', myChart.resize);
    }
    /**
     * @type {echarts.EChartsOption}
     */
    Options = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        series: [
            {
                name: 'Access From',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 40,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: 1048, name: 'Search Engine' },
                    { value: 735, name: 'Direct' },
                    { value: 580, name: 'Email' },
                    { value: 484, name: 'Union Ads' },
                    { value: 300, name: 'Video Ads' }
                ]
            }
        ]
    };;

    async ReloadChart() {
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: submitEntity ? JSON.stringify(submitEntity) : null,
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
        options.toolbox = {
            feature: {
                myFilter: {
                    show: true,
                    title: 'Filter Data',
                    icon: 'path://M8 2L2 14h12L8 2z',
                    onclick: () => {
                        this.ShowSearch();
                    },
                },
            }
        };
        var myChart = echarts.init(this.Element, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        if (options && typeof options === 'object') {
            myChart.setOption(options);
        }
    }

    CloseSearch() {
        this.SearchElement.remove();
    }

    ShowSearch() {
        Html.Take(this.Element).Div.Style("opacity: 1; pointer-events: all; transition: .15s ease all;").TabIndex(-1).Event(EventType.FocusOut, this.CloseSearch.bind(this)).ClassName("apexcharts-menu");
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
