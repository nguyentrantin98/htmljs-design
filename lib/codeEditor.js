import EditableComponent from "./editableComponent.js";
import { Component } from "./models/component.js";
import { ComponentExt } from "./utils/componentExt.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";

/**
 * Represents a code editor component.
 */
export class CodeEditor extends EditableComponent {
    /**
     * Creates an instance of a CodeEditor.
     * @param {Component} ui - The UI component.
     * @param {HTMLElement} [ele=null] - The HTML element associated with the editor.
     */
    constructor(ui, ele = null) {
        super(ui);
        this.Element = ele || null;
        this.DefaultValue = '';
        this.editor = null;
    }

    /**
     * Renders the code editor.
     */
    Render() {
        if (!this.Element) {
            this.ParentElement.style.textAlign = 'unset';
            Html.Take(this.ParentElement).Div.ClassName("code-editor").Style("height:150px;max-height:150px;position: relative;");
            this.Element = Html.Context;
        }
        this.Config().then(() => {
            if (typeof (require) === 'undefined') return;
            // @ts-ignore
            require(["vs/editor/editor.main"], this.EditorLoaded.bind(this));
        });
    }

    /**
     * Updates the view of the editor.
     * @param {boolean} [force=false] - Whether to force the update.
     * @param {boolean|null} [dirty=null] - Whether the view is considered dirty.
     * @param {string[]} componentNames - Names of the components to update.
     */
    UpdateView(force = false, dirty = null, ...componentNames) {
        this.editor.setValue(this.FieldVal);
    }

    static _hasConfig;
    async Config() {
        if (typeof (require) === 'undefined') return;
        if (CodeEditor._hasConfig) return;
        CodeEditor._hasConfig = true;

        // @ts-ignore
        require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.8.3/min/vs' } });
        // @ts-ignore
        window.MonacoEnvironment = { getWorkerUrl: () => proxy };

        let proxy = URL.createObjectURL(new Blob([`
            self.MonacoEnvironment = {
                baseUrl: 'https://unpkg.com/monaco-editor@0.8.3/min/'
            };
            importScripts('https://unpkg.com/monaco-editor@0.8.3/min/vs/base/worker/workerMain.js');
            `], { type: 'text/javascript' }));
    }

    EditorLoaded() {
        // @ts-ignore
        this.editor = monaco.editor.create(this.Element, {
            value: this.FieldVal ?? Str.Empty,
            language: this.Meta.Lang ?? 'javascript',
            theme: this.Meta.Theme ?? 'vs-light',
            automaticLayout: true,
            minimap: {
                enabled: false,
            }
        });
        window.addEventListener('resize', this.ResizeHandler.bind(this));
        this.editor.getModel().onDidChangeContent(() => {
            this.FieldVal = this.editor.getValue();
            this.Dirty = true;
        });
        this.Element.classList.add('code-editor');
        this.Element.style.resize = 'both';
        this.Element.style.border = '1px solid #dde';
        // register change event from UI
        this.addEventListener('UpdateView', () => {
            this.editor.setValue(this.FieldVal);
        });
        Html.Take(this.Element).Icon('fal fal fa-compress-wide').Style("position: absolute; z-index: 1000; top: 0; right: 0;")
            .Event('click', () => {
                ComponentExt.FullScreen(this.Element);
            });
    }
    time;

    ResizeHandler() {
        window.clearTimeout(this.time);
        this.time = window.setTimeout(() => {
            const minWidth = this.Parent.Element.clientWidth - 30; // adjust as needed
            this.Element.style.width = minWidth + 'px';
        }, 200);
    }
}
