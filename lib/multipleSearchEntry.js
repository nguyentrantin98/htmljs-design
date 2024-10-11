import { SearchEntry } from "./searchEntry.js";
import { Client } from "./clients/client.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import EventType from "./models/eventType.js";

export class MultipleSearchEntry extends SearchEntry {
    static MultipleClass = "multiple";
    _toggleButton = null;
    IsMultiple = true;

    constructor(ui) {
        super(ui);
    }

    Render() {
        this._listValues = [];
        this.SetDefaultVal();
        this.TryParseData();
        this.RenderInputAndEvents();
        this.FindMatchText();
        this.SearchResultEle = document.body;
        this.Element.parentElement.classList.add(MultipleSearchEntry.MultipleClass);
    }

    TryParseData() {
        if (!this.Entity) {
            return;
        }
        let source = this.Entity[this.Name];
        if (!source) {
            return;
        }
        this._listValues = source.split(this.Meta.GroupFormat || ',').filter(x => x.trim().length > 0);
    }

    _listValues = [];

    get ListValues() {
        return this._listValues;
    }

    set ListValues(value) {
        if (!value) {
            this._listValues = [];
        } else {
            this._listValues = Array.from(new Set(value));
        }
        this.SetEntityValue();
    }

    SetEntityValue() {
        this.Entity[this.Name] = this.ListValues.length > 0 ? this.ListValues.join(this.Meta.GroupFormat || ',') : null;
        this.Entity[this.Name + "Text"] = this.MatchedItems.length > 0 ? this.MatchedItems.map(item => this.GetMatchedText(item)).join(this.Meta.GroupFormat || ',') : this.Entity[this.Name + "Text"];
    }

    MatchedItems = [];

    FindMatchText() {
        if (this.EmptyRow) {
            return;
        }
        if (!this.ProcessLocalMatch()) {
            this.SetMatchedValue();
        }
    }

    ProcessLocalMatch() {
        if (Utils.isNullOrWhiteSpace(this.Meta.RefName)) {
            var data = Utils.IsFunction(this.Meta.Query, false, this);
            this.MatchedItems = data.filter(x => this.Entity[this.Meta.FieldName] && this.Entity[this.Meta.FieldName].includes(x.Id));
            this.SetMatchedValue();
            return true;
        }
        else {
            this.Matched = this.Entity[this.DisplayField] || null;
            if (this._listValues.length > 0 && this.MatchedItems.length == 0 && (!this.Parent.IsListViewItem || this.Meta.IsMultiple)) {
                Client.Instance.GetByIdAsync(this.Meta.RefName, this._listValues).then(data => {
                    this.MatchedItems = data.data ? data.data : null;
                    this.SetMatchedValue();
                })
                return true;
            }
        }
        return false;
    }

    SetMatchedValue() {
        this._input.value = '';
        this.ListValues.forEach(value => {
            let item = this.MatchedItems.find(x => x[this.IdField] === value);
            this.RenderTag(item);
        });
    }

    ClearTagIfNotExists() {
        let tags = Array.from(this.ParentElement.querySelectorAll("div > span")).filter(tag => {
            let id = (tag instanceof HTMLElement) ? tag.dataset.id : null;
            return id && !this.ListValues.includes(id);
        });
        tags.forEach(tag => {
            if (tag instanceof HTMLElement) {
                tag.remove();
            }
        });
    }

    RenderTag(item) {
        if (!item) {
            return;
        }
        let idAttr = item[this.IdField];
        let exist = this.Element.parentElement.querySelector(`span[data-id='${idAttr}']`);
        if (exist) {
            return;
        }
        Html.Take(this.Element.parentElement).Span.Attr("data-id", idAttr).I.ClassName("fal fa-tag mr-1").End.Text(this.GetMatchedText(item));
        var tag = Html.Context;
        this.Element.parentElement.insertBefore(Html.Context, this._input);
        if (this.Disabled) {
            this._input.readOnly = true;
        }
        Html.Instance.Button.ClassName("fa fa-times").Event(EventType.Click, async () => {
            if (this.Disabled) {
                return;
            }
            let oldMatch = this.MatchedItems;
            this.MatchedItems.splice(this.MatchedItems.indexOf(item), 1);
            var id = item[this.IdField];
            let indexToRemove = this.ListValues.indexOf(id);
            this.ListValues = this.ListValues.filter((value, index) => index !== indexToRemove);
            this.SetEntityValue();
            this.Dirty = true;
            if (this.UserInput != null) {
                this.UserInput?.Invoke({ NewData: this._value, OldData: oldMatch, EvType: EventType.Change });
            }
            await this.DispatchEvent(this.Meta.Events, EventType.Change, this);
            tag.remove();
        }).End.Render();
    }

    EntrySelected(rowData) {
        window.clearTimeout(this._waitForDispose);
        this.EmptyRow = false;
        if (rowData === null || this.Disabled) {
            return;
        }

        let oldMatch = this.MatchedItems;
        var id = rowData[this.IdField];
        if (this.ListValues.length == 0 || !this.ListValues.includes(id)) {
            this.ListValues.push(id);
            this.MatchedItems.push(rowData);
        }
        else {
            return;
        }
        this.SetEntityValue();
        this.Dirty = true;
        this.FindMatchText();
        this._input.focus();
        if (this.UserInput != null) {
            this.UserInput?.Invoke({ NewData: this._value, OldData: oldMatch, EvType: EventType.Change });
        }
        this.DispatchEvent(this.Meta.Events, EventType.Change, this).then();
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.TryParseData();
        this.SetEntityValue();
        this.ClearTagIfNotExists();
        this.FindMatchText();
    }
}
