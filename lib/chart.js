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
     * @type {String}
     */
    Title;
    /**
     * @type {String}
     */
    FromDate;
    /**
     * @type {String}
     */
    ToDate;
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
        const formatDate = (date) => this.dayjs(date).format("YYYY-MM-DD");

        this.Title = "Month";

        let today = this.dayjs();
        let firstDayOfMonth = today.startOf("month");
        let lastDayOfMonth = today.endOf("month").add(1, "day"); // Thêm 1 ngày vào cuối tháng

        this.FromDate = formatDate(firstDayOfMonth);
        this.ToDate = formatDate(lastDayOfMonth);
        await this.RenderChart();
        this.DOMContentLoaded?.Invoke();
    }

    /**
     * Renders the chart using data available or fetching it if necessary.
     */
    async RenderChart() {
        this.AddElement();
        const submitEntity = Utils.IsFunction(this.Meta.PreQuery, false, this);
        const entity = {
            Params: submitEntity ? JSON.stringify(submitEntity) : JSON.stringify({
                FromDate: this.FromDate,
                ToDate: this.ToDate
            }),
            ComId: this.Meta.Id,
        };
        this.Data = this.Meta.LocalData ?? await Client.Instance.SubmitAsync({
            Url: "/api/feature/report",
            IsRawString: true,
            JsonData: JSON.stringify(entity),
            Method: "POST"
        });
        var options = this.Options;
        options = Utils.IsFunction(this.Meta.Template, false, this);
        if (this.Meta.CanSearch) {
            options.toolbox = {
                feature: {
                    myFilter: {
                        show: true,
                        title: this.Title,
                        icon: 'path://M8 2L2 14h12L8 2z',
                        onclick: () => {
                            this.ShowSearch();
                        },
                    },
                }
            };
        }
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
        options = Utils.IsFunction(this.Meta.Template, false, this);
        if (this.Meta.CanSearch) {
            options.toolbox = {
                feature: {
                    myFilter: {
                        show: true,
                        title: this.Title,
                        icon: 'path://M8 2L2 14h12L8 2z',
                        onclick: () => {
                            this.ShowSearch();
                        },
                    },
                }
            };
        }
        var myChart = echarts.init(this.Element, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        if (options && typeof options === 'object') {
            myChart.setOption(options);
        }
    }

    CloseSearch() {
        const menu = document.querySelectorAll(".apexcharts-menu");
        if (menu) {
            menu.forEach(item => {
                item.style.opacity = "0";
                item.style.pointerEvents = "none";
                setTimeout(() => item.remove(), 300);
            });
        }
    }

    ShowSearch() {
        Html.Take(this.Element).Div.Style("opacity: 1; pointer-events: all; transition: .15s ease all;")
            .TabIndex(-1)
            .ClassName("apexcharts-menu");
        this.SearchElement = Html.Context;
        const formatDate = (date) => this.dayjs(date).format("YYYY-MM-DD");
    
        Html.Instance
            // Tuần này
            .Div.ClassName("apexcharts-menu-item").TabIndex(-1).Event(EventType.Click, (e) => {
                e.preventDefault();
                this.Title = "Week";
    
                let today = this.dayjs();
                let firstDayOfWeek = today.startOf("week");
                let lastDayOfWeek = firstDayOfWeek.add(6, "day").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfWeek);
                this.ToDate = formatDate(lastDayOfWeek);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Week", this.EditForm.Meta.Label).End
    
            // Tuần trước
            .Div.ClassName("apexcharts-menu-item").TabIndex(-1).Event(EventType.Click, (e) => {
                e.preventDefault();
                this.Title = "Last Week";
    
                let today = this.dayjs();
                let firstDayOfLastWeek = today.startOf("week").subtract(7, "day");
                let lastDayOfLastWeek = firstDayOfLastWeek.add(6, "day").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfLastWeek);
                this.ToDate = formatDate(lastDayOfLastWeek);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Last Week", this.EditForm.Meta.Label).End
    
            // Tháng này
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, (e) => {
                e.preventDefault();
                this.Title = "Month";
    
                let today = this.dayjs();
                let firstDayOfMonth = today.startOf("month");
                let lastDayOfMonth = today.endOf("month").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfMonth);
                this.ToDate = formatDate(lastDayOfMonth);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Month", this.EditForm.Meta.Label).End
    
            // Tháng trước
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, (e) => {
                e.preventDefault();
                this.Title = "Last Month";
    
                let today = this.dayjs();
                let firstDayOfLastMonth = today.subtract(1, "month").startOf("month");
                let lastDayOfLastMonth = firstDayOfLastMonth.endOf("month").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfLastMonth);
                this.ToDate = formatDate(lastDayOfLastMonth);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Last Month", this.EditForm.Meta.Label).End
    
            // Quý này
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, () => {
                this.Title = "Quarter";
    
                let today = this.dayjs();
                let firstDayOfQuarter = today.startOf("quarter");
                let lastDayOfQuarter = today.endOf("quarter").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfQuarter);
                this.ToDate = formatDate(lastDayOfQuarter);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Quarter", this.EditForm.Meta.Label).End
    
            // Quý trước
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, () => {
                this.Title = "Last Quarter";
    
                let today = this.dayjs();
                let firstDayOfLastQuarter = today.subtract(1, "quarter").startOf("quarter");
                let lastDayOfLastQuarter = firstDayOfLastQuarter.endOf("quarter").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfLastQuarter);
                this.ToDate = formatDate(lastDayOfLastQuarter);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Last Quarter", this.EditForm.Meta.Label).End
    
            // Năm này
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, () => {
                this.Title = "Year";
    
                let today = this.dayjs();
                let firstDayOfYear = today.startOf("year");
                let lastDayOfYear = today.endOf("year").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfYear);
                this.ToDate = formatDate(lastDayOfYear);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Year", this.EditForm.Meta.Label).End
    
            // Năm trước
            .Div.TabIndex(-1).ClassName("apexcharts-menu-item").Event(EventType.Click, () => {
                this.Title = "Last Year";
    
                let today = this.dayjs();
                let firstDayOfLastYear = today.subtract(1, "year").startOf("year");
                let lastDayOfLastYear = firstDayOfLastYear.endOf("year").add(1, "day");
    
                this.FromDate = formatDate(firstDayOfLastYear);
                this.ToDate = formatDate(lastDayOfLastYear);
                this.RenderChart().then();
                this.CloseSearch();
            }).IText("Last Year", this.EditForm.Meta.Label).End
    
            .End.Render();
        this.SearchElement.firstElementChild.focus();
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
