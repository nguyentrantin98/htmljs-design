import { EditableComponent } from "./editableComponent.js";
import { Utils } from "./utils/utils.js";
import { Html } from "./utils/html.js";
import { Component } from "./models/component.js";
import ApexTree from 'apextree'
/**
 * Represents a Chart component that can be rendered and updated.
 */
export class TreeNode extends EditableComponent {
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
     * @type {Graph}
     */
    Graph;
    /**
     * Renders the chart component by adding an HTML element and setting up the chart.
     */
    Render() {
        this.AddElement();
        this.RenderAsync();
    }

    /**
     * Adds a div element as the chart wrapper if it doesn't already exist.
     */
    AddElement() {
        if (!this.Element) {
            this.Element = Html.Take(this.ParentElement).Div.ClassName("toolbar-container")
                .Button2("far fa-arrow-down").End
                .Button2("far fa-arrow-up").End
                .Button2("far fa-arrow-left").End
                .Button2("far fa-arrow-right").End
                .Button2("Fit to Screen").End.Div.ClassName("chart-wrapper").GetContext();
        }
    }

    /**
     * Asynchronously renders the chart after data and configurations are ready.
     */
    RenderAsync() {
        this.RenderChart();
        this.DOMContentLoaded?.Invoke();
    }

    /**
     * Renders the chart using data available or fetching it if necessary.
     */
    RenderChart() {
        this.AddElement();
        var data = {};
        if (!Utils.isNullOrWhiteSpace(this.Meta.Template)) {
            data = Utils.IsFunction(this.Meta.Template, false, this.Options);
        }
        this.Graph = new ApexTree(this.Element, this.Options);
        this.Graph.render(data);
    }

    Options = {
        contentKey: 'name',
        width: "100%",
        height: 700,
        nodeWidth: 150,
        nodeHeight: 50,
        childrenSpacing: 150,
        siblingSpacing: 30,
        direction: 'top',
        fontSize: '20px',
        fontFamily: 'sans-serif',
        fontWeight: 600,
        fontColor: '#a06dcc',
        borderWidth: 2,
        borderColor: '#a06dcc',
        canvasStyle: 'border: 1px solid black;background: #f6f6f6;',
    };
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
