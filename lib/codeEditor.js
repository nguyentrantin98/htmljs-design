import { EditableComponent } from "./editableComponent.js";
import { Component } from "./models/component.js";
import { ComponentExt } from "./utils/componentExt.js";
import { Str } from "./utils/ext.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { Client } from "./clients/client.js";
import EventType from "./models/eventType.js";

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
            Html.Take(this.ParentElement).Div.ClassName("code-editor").Style(this.Meta.Style || "height:150px;max-height:150px;position: relative;");
            this.Element = Html.Context;
        }
        this.Config().then(() => {
            if (typeof (require) === 'undefined') return;
            // @ts-ignore
            require(["vs/editor/editor.main"], this.EditorLoaded.bind(this));
        });
    }

    static _hasConfig;
    async Config() {
        if (typeof (require) === 'undefined') return;
        if (CodeEditor._hasConfig) return;
        CodeEditor._hasConfig = true;

        // @ts-ignore
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs' } });
        // @ts-ignore
        window.MonacoEnvironment = { getWorkerUrl: () => proxy };

        let proxy = URL.createObjectURL(new Blob([`
            self.MonacoEnvironment = {
                baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/'
            };
            importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.47.0/min/vs/base/worker/workerMain.js');
            `], { type: 'text/javascript' }));
    }

    EditorLoaded() {
        monaco.languages.register({ id: 'javascript' });
        const jsKeywords = [
            'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
            'do', 'else', 'export', 'extends', 'finally', 'for', 'null', 'function', 'if', 'import', 'in',
            'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
            'void', 'while', 'with', 'yield', 'let', 'enum', 'await', 'async', 'static', 'true', 'false'
        ];
        monaco.languages.setMonarchTokensProvider('javascript', {
            keywords: jsKeywords,
            tokenizer: {
                root: [
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@default': 'identifier'
                        }
                    }],
                    [/(\.EditForm\.)/, 'custom-editform'],
                    [/(\.filter\()/, 'custom-filter'],
                    [/(\.find\()/, 'custom-find'],
                    [/(\.FirstCom\()/, 'custom-firstcom'],
                    [/(\.LoadMasterData\()/, 'custom-loadmasterdata'],
                    [/(\.ClearSelected\()/, 'custom-loadmasterdata'],
                    [/(\.forEach\()/, 'custom-reduce'],
                    [/(\.reduce\()/, 'custom-reduce'],
                    [/(\.OpenConfig\()/, 'custom-openconfig'],
                    [/(\.Item)/, 'custom-item'],
                    [/(\.Element)/, 'custom-item'],
                    [/(\.length)/, 'custom-length'],
                    [/(\.UpdateView2\()/, 'custom-updateview2'],
                    [/(\.UpdateView\()/, 'custom-updateview2'],
                    [/(\.Decimal\()/, 'custom-decimal'],
                    [/(\.times\()/, 'custom-times'],
                    [/(\.isNegative\()/, 'custom-isnegative'],
                    [/(\.abs\()/, 'custom-abs'],
                    [/(\.plus\()/, 'custom-plus'],
                    [/(\.div\()/, 'custom-div'],
                    [/(\.Parent)/, 'custom-parent'],
                    // Default JavaScript tokens
                    [/[{}[\]()]/, '@brackets'],
                    [/\/\/.*$/, 'comment'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'], // Non-terminated string
                    [/"([^"\\]|\\.)*"/, 'string'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'], // Non-terminated string
                    [/'([^'\\]|\\.)*'/, 'string'],
                    [/`([^`\\]|\\.)*$/, 'string.invalid'], // Non-terminated template
                    [/`([^`\\]|\\.)*`/, 'string'],
                    [/[+-/*=<>!~&|%]+/, 'operator']
                ]
            }
        });
        monaco.editor.defineTheme('light-soft', {
            base: 'vs', // Nền sáng
            inherit: true, // Kế thừa các thiết lập mặc định
            rules: [
                // Quy tắc màu cho các token tùy chỉnh
                { token: 'keyword', foreground: '0000FF' }, // Xanh dương đậm
                { token: 'identifier', foreground: '1E1E1E' }, // Đen đậm
                { token: 'custom-editform', foreground: 'A31515' }, // Đỏ sẫm
                { token: 'custom-filter', foreground: '795E26' }, // Nâu vàng
                { token: 'custom-find', foreground: '5A5A5A' }, // Xám đậm
                { token: 'custom-firstcom', foreground: '4B8BBE' }, // Xanh lam nhẹ
                { token: 'custom-loadmasterdata', foreground: 'B4009E' }, // Tím đậm
                { token: 'custom-reduce', foreground: '00008B' }, // Xanh dương sẫm
                { token: 'custom-openconfig', foreground: '2B91AF' }, // Xanh lam sáng
                { token: 'custom-item', foreground: '9932CC' }, // Tím nhạt
                { token: 'custom-length', foreground: '6A8759' }, // Xanh lá
                { token: 'custom-updateview2', foreground: '007ACC' }, // Xanh Visual Studio
                { token: 'custom-decimal', foreground: 'C75C6A' }, // Đỏ hồng
                { token: 'custom-times', foreground: 'FF4500' }, // Cam đỏ
                { token: 'custom-isnegative', foreground: '9B59B6' }, // Tím sáng
                { token: 'custom-abs', foreground: '2ECC71' }, // Xanh lá sáng
                { token: 'custom-plus', foreground: 'FF6347' }, // Đỏ cam nhạt
                { token: 'custom-div', foreground: '4682B4' }, // Xanh thép
                { token: 'custom-parent', foreground: '1ABC9C' }, // Xanh ngọc sáng

                // Quy tắc màu mặc định
                { token: 'comment', foreground: '008000', fontStyle: 'italic' }, // Xanh lá đậm
                { token: 'string', foreground: 'A31515' }, // Đỏ sẫm
                { token: 'operator', foreground: '000000' }, // Đen
                { token: 'number', foreground: '098658' }, // Xanh lục đậm
                { token: 'delimiter', foreground: '1E1E1E' }, // Đen xám
                { token: 'brackets', foreground: '1E1E1E' }, // Đen xám
            ],
            colors: {
                'editor.foreground': '#333333', // Màu chữ chung - Đen xám
                'editor.background': '#FFFFFF', // Nền trắng
                'editorLineNumber.foreground': '#5A5A5A', // Số dòng - Xám đậm
                'editorCursor.foreground': '#007ACC', // Con trỏ - Xanh lam Visual Studio
                'editor.selectionBackground': '#ADD6FF', // Nền vùng chọn - Xanh nhạt
                'editor.inactiveSelectionBackground': '#E5EBF1', // Nền vùng chọn không hoạt động - Xám xanh
            }
        });
        this.editor = monaco.editor.create(this.Element, {
            value: this.FieldVal ?? Str.Empty,
            language: this.Meta.Lang ?? 'javascript',
            theme: this.Meta.Theme ?? 'light-soft',
            automaticLayout: true,
            folding: true,
            minimap: {
                enabled: true,
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
        this.addEventListener('UpdateView', () => {
            this.editor.setValue(this.FieldVal);
        });

        Html.Take(this.Element).Icon('fal fal fa-compress-wide').Style("position: absolute; z-index: 1; top: 0; right: 0;")
            .Event('click', () => {
                ComponentExt.FullScreen(this.Element);
            }).End
            .Select.Event("change", /**@param {Event} e */(e) => {
                var newLanguage = e.target.value;
                monaco.editor.setModelLanguage(this.editor.getModel(), newLanguage);
            }).Style("position: absolute; z-index: 1; left: 0; bottom: 0;")
            .Option.Attr("value", "javascript").Attr(this.Meta.Lang == "javascript" ? "selected" : "no", "").IText("javascript").End
            .Option.Attr("value", "json").Attr(this.Meta.Lang == "json" ? "selected" : "no", "").IText("json").End
            .Option.Attr("value", "sql").Attr(this.Meta.Lang == "sql" ? "selected" : "no", "").IText("sql").End
            .Option.Attr("value", "html").Attr(this.Meta.Lang == "html" ? "selected" : "no", "").IText("html").End
            .Option.Attr("value", "css").Attr(this.Meta.Lang == "css" ? "selected" : "no", "").IText("css").End
            .Option.Attr("value", "text").Attr(this.Meta.Lang == "text" ? "selected" : "no", "").IText("text").End.End
            .Icon('fal fa-history').Style("position: absolute; z-index: 1; bottom: 0; right: 0;")
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
        const res = {
            ComId: this.Meta.Id,
            Params: JSON.stringify(Utils.IsFunction(this.Meta.PreQuery, true, this)),
            OrderBy: (!this.Meta.OrderBy ? "ds.InsertedDate desc" : this.Meta.OrderBy),
            Count: false,
            Skip: 0,
            Top: 10,
        };
        Client.Instance.SubmitAsync({
            NoQueue: true,
            Url: `/api/feature/com`,
            Method: "POST",
            JsonData: JSON.stringify(res),
        }).then(data => {
            /**@type {[]} */
            var dataa = data.value;
            dataa.forEach(item => {
                Html.Take(this.BodyElement);
                Html.Instance.Div.Label.ClassName("header").Text(this.dayjs(item.InsertedDate).format("DD/MM/YYYY HH:mm")).End.Div.ClassName("diff-container").Style("height:250px");
                const modifiedModel = monaco.editor.createModel(
                    item.Value ?? ``,
                    this.Meta.Lang ?? 'javascript'
                );
                const originalModel = monaco.editor.createModel(
                    item.OldValue ?? ``,
                    this.Meta.Lang ?? 'javascript'
                );
                const diffEditor = monaco.editor.createDiffEditor(
                    Html.Context,
                    {
                        originalEditable: true,
                        automaticLayout: true,
                        reareadOnly: true
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
