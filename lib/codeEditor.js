import { EditableComponent } from "./editableComponent.js";
import { Component } from "./models/component.js";
import { ComponentExt } from "./utils/componentExt.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import "dayjs/locale/vi.js";
dayjs.locale('vi');
dayjs.extend(utc);
dayjs.extend(timezone);
import EventType from "./models/eventType.js";
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
            this.OldValue = this.Entity[this.Name];
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
        if ((this.Meta.Lang ?? 'javascript') == 'javascript') {
            monaco.languages.registerCompletionItemProvider("javascript", {
                provideCompletionItems: function (model, position) {
                    var word = model.getWordUntilPosition(position);
                    var range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };
                    var sup = [
                        {
                            label: 'openpopup',
                            kind: monaco.languages.CompletionItemKind.Function,
                            documentation: "Fast, unopinionated, minimalist web framework",
                            insertText: `this.OpenPopup("component-editor", null);`,
                            range: range,
                        }
                    ];
                    return {
                        suggestions: sup,
                    };
                },
            });
        }

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
            }).End.Icon('fal fa-history').Style("position: absolute; z-index: 1000; bottom: 0; right: 0;")
            .Event('click', () => {
                this.RenderPopup();
            }).Event('contextmenu', (e) => this.EditForm.SysConfigMenu(e, this.Meta, null, null));
    }
    time;

    ResizeHandler() {
        window.clearTimeout(this.time);
        this.time = window.setTimeout(() => {
            const minWidth = this.Parent.Element.clientWidth - 30; // adjust as needed
            this.Element.style.width = minWidth + 'px';
        }, 200);
    }
    /**@type {HTMLElement} */
    _backdrop;
    /**@type {HTMLElement} */
    BodyElement;
    RenderPopup() {
        Html.Take(this.EditForm.Element).Div.ClassName("backdrop").TabIndex(-1).Trigger(EventType.Focus);
        this._backdrop = Html.Context;
        Html.Instance.Div.ClassName("popup-content").Div.ClassName("popup-title").Span.IText("History change");
        this.TitleElement = Html.Context;
        Html.Instance.End.Div.ClassName("icon-box").Span.ClassName("fa fa-times")
            .Event(EventType.Click, () => {
                this._backdrop.remove();
            }).End.End.End.Div.ClassName("popup-body").Div.ClassName("wrapper scroll-content");
        this.BodyElement = Html.Context;
        Html.Instance.End.Div.ClassName("popup-footer");
        if (this._backdrop.OutOfViewport().Top) {
            this._backdrop.scrollIntoView(true);
        }
        let submitEntity = Utils.IsFunction(this.Meta.PreQuery, true, this);
        const res = {
            ComId: this.Meta.Id,
            Params: submitEntity,
            OrderBy: (!this.Meta.OrderBy ? "ds.InsertedDate desc" : this.Meta.OrderBy),
            Count: false,
            Skip: 0,
            Top: 10,
        };
        Client.Instance.SubmitAsync({
            NoQueue: true,
            Url: `/api/feature/com?t=${Client.Token.TenantCode || Client.Tenant}`,
            Method: "POST",
            JsonData: JSON.stringify(res, this.getCircularReplacer(), 2),
            AllowAnonymous: true
        }).then(data => {
            /**@type {[]} */
            var dataa = data.value;
            dataa.forEach(item => {
                Html.Take(this.BodyElement);
                Html.Instance.Div.Label.ClassName("header").Text(dayjs(item.InsertedDate).utc().format("DD/MM/YYYY HH:mm")).End.Div.ClassName("diff-container").Style("height:250px");
                const modifiedModel = monaco.editor.createModel(
                    item.Value ?? ``,
                    "javascript"
                );
                const originalModel = monaco.editor.createModel(
                    item.OldValue ?? ``,
                    "javascript"
                );
                const diffEditor = monaco.editor.createDiffEditor(
                    Html.Context,
                    {
                        originalEditable: true,
                        automaticLayout: true,
                    }
                );
                diffEditor.setModel({
                    original: originalModel,
                    modified: modifiedModel,
                });
            });
        });
    }
    /**
     * Updates the view of the Checkbox based on the current state.
     * @param {boolean} [force=false] - Force the update regardless of changes.
     * @param {?boolean} [dirty=null] - The new dirty state.
     * @param {...string} componentNames - Additional component names to update.
     */
    UpdateView(force = false, dirty = null, ...componentNames) {
        this.Value = this.Entity[this.Meta.FieldName];
        if (!this.Dirty) {
            this.OriginalText = this.Value;
            this.OldValue = this.Value;
        }
    }
}
