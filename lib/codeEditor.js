import { EditableComponent } from "./editableComponent.js";
import { Component } from "./models/component.js";
import { ComponentExt } from "./utils/componentExt.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import * as monaco from "monaco-editor";
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import 'monaco-editor/min/vs/editor/editor.main.css';

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
        this.EditorLoaded();
    }

    EditorLoaded() {
        self.MonacoEnvironment = {
            getWorker(_, label) {
                if (label === 'json') {
                    return new jsonWorker()
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return new cssWorker()
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return new htmlWorker()
                }
                if (label === 'typescript' || label === 'javascript') {
                    return new tsWorker()
                }
                return new editorWorker()
            }
        }

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
        this.editor.onContextMenu(function (e) {
            e.event.preventDefault();
            e.event.stopPropagation();
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
