import { SearchEntry } from "./searchEntry.js";

export class MultipleSearchEntry extends SearchEntry {
    static MultipleClass = "multiple";
    _isStringSource = false;
    _toggleButton = null;
    IsMultiple = true;

    constructor(ui) {
        super(ui);
    }

    render() {
        this._isStringSource = this.Entity !== null && Object.getPrototypeOf(this.Entity).hasOwnProperty(this.Name) && typeof this.Entity[this.Name] === 'string';
        super.Render();
        this.Element.parentElement.classList.add(MultipleSearchEntry.MultipleClass);
        this.TryParseData();
        this.FindMatchText();
    }

    TryParseData() {
        if (!this.Entity) {
            return;
        }
        let source = this.Entity[this.Name];
        if (!source) {
            return;
        }
        let list = null;
        if (this._isStringSource) {
            list = source.split(',').filter(x => x.trim().length > 0);
        } else {
            list = source;
        }
        list.filter(x => !this._listValues.includes(x)).forEach(x => this._listValues.push(x));
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

        this.SetEntityValue(value);
        this.CascadeField();
        this.PopulateFields();
    }

    GridResultDomLoaded() {
        super.GridResultDomLoaded();
        if (this._toggleButton) {
            return;
        }
        const toolbar = document.createElement("div");
        toolbar.className = "dropdown-toolbar";
        this._gv.Element.appendChild(toolbar);
    
        const toggleButton = document.createElement("button");
        toggleButton.className = "fa fa-check";
        toggleButton.setAttribute("title", "Chọn tất cả");
        toggleButton.addEventListener("click", () => this.ToggleAllRecord());
        toolbar.appendChild(toggleButton);
    
        const closeButton = document.createElement("button");
        closeButton.className = "fa fa-times";
        closeButton.setAttribute("title", "Đóng gợi ý");
        closeButton.addEventListener("click", () => this.Dispose());
        toolbar.appendChild(closeButton);
    
        this._toggleButton = toggleButton;
    }
    

    ToggleAllRecord() {
        let value = this.ListValues;
        if (!value) {
            this.ListValues = [];
            this._toggleButton.setAttribute("title", "Chọn tất cả");
        } else {
            this.ListValues = null;
            this._toggleButton.setAttribute("title", "Hủy chọn");
        }
        this.FindMatchText();
    }

    SetEntityValue(value) {
        if (this._isStringSource) {
            this.Entity[this.Name] = value.join(",");
        } else {
            this.Entity[this.Name] = value;
        }
    }

    MatchedItems = [];

    FindMatchText() {
        if (this.EmptyRow || this.ProcessLocalMatch()) {
            return;
        }
        let values = this.ListValues;
        this.ClearTagIfNotExists();
        if (this.MatchedItems.length && values.every(val => this.MatchedItems.some(x => x[this.IdField] === val))) {
            this.SetMatchedValue();
        } else {
            // simulate network call
            let ds = []; // Fetch data using async call, omitted for simplicity
            this.MatchedItems = ds.length > 0 ? ds[0] : this.MatchedItems;
            this.SetMatchedValue();
        }
    }

    ProcessLocalMatch() {
        let isLocalMatched = this._gv && this.RowData.Data.length > 0 || this.Meta.LocalData;
        if (isLocalMatched) {
            let rows = this.Meta.LocalData ? this.Meta.LocalData : this.RowData.Data;
            this.MatchedItems = rows.filter(x => this._listValues.includes(x[this.IdField].toString()));
        }
        if (this.MatchedItems.length && this.MatchedItems.length === this._listValues.length) {
            this.SetMatchedValue();
            return true;
        }
        return false;
    }

    SetMatchedValue() {
        this._input.value = '';
        this.ClearTagIfNotExists();
        this.ListValues.forEach(value => {
            let item = this.MatchedItems.find(x => x[this.IdField].toString() === value);
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
        let span = document.createElement("span");
        span.setAttribute("data-id", idAttr);
        span.innerHTML = this.GetMatchedText(item);
        this.Element.parentElement.insertBefore(span, this._input);
        // Button and event handling omitted for simplicity
    }
}
