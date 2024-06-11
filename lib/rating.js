import EditableComponent from './editableComponent.js';
import { Utils } from "./utils/utils.js";
import ObservableArgs from './models/observable.js';
import "./utils/fix.js";


export class Rating extends EditableComponent {
     /**
     * @param {import('./models/component.js').Component} ui
     * @param {HTMLElement} [ele=null] 
     */
    
    constructor(ui, ele = null) {
        super(ui,ele);
        this.DefaultValue = 0;
        if (!ui) throw new Error("UI component is required");
        this.ParentElement = ele;
        this.InputList = [];
        this._value = null;

        this.Render();
    }

    get value() {
        return this._value;
    }

    set value(val) {
        if (this._value === val) {
            return;
        }
        this._value = val;
        this.SetSelected(this._value);
        this.Entity.SetComplexPropValue(this.Name, this._value);
        this.dirty = true;
    }

    get Disabled() {
        return super.Disabled;
    }

    set Disabled(value) {
        super.Disabled = value;
        this.InputList.forEach(input => {
            input.Disabled = value;
        });
    }

    SetSelected(value) {
        if (value === null || value <= 0 || value > this.Meta.Precision) {
            return;
        }
        this.InputList[this.Meta.Precision - value].checked = true;
    }

    Render() {
        const container = document.createElement('div');
        container.className = 'rate';
        this.ParentElement.appendChild(container);
        this.Element = container;
    
        const radioGroup = `${this.Name}_${this.Meta.Id}_${this.HashCode()}`;
        for (let item = this.Meta.Precision; item >= 1; item--) {
            const radioId = `${radioGroup}_${item}`;
            const input = document.createElement('input');
            input.setAttribute('type', 'radio');
            input.id = radioId;
            input.name = radioGroup;
            input.value = item.toString();
            // @ts-ignore
            input.style = this.Meta.Style; 
            input.addEventListener('change', this.DispatchChange.bind(this));
    
            this.InputList.push(input);
            this.Element.appendChild(input);
    
            const label = document.createElement('label');
            label.setAttribute('for', radioId);
            label.textContent = `${item} stars`;
            this.Element.appendChild(label);
        }
    
        this._value = Utils.GetPropValue(this.Entity, this.Name);
        this.SetSelected(this._value);
    
        this.DOMContentLoaded?.Invoke();
    }

    DispatchChange(event) {
        if (this.Disabled) return;

        if (!this.InputList.length) return;
        
        const checkedInput = this.InputList.find(input => input.checked);
        if (!checkedInput) return;

        const oldValue = this.value;
        this.value = parseInt(checkedInput.value);
        if (this.UserInput) {
            // @ts-ignore
            this.UserInput.Invoke(new ObservableArgs ({ newData: this.value, oldData: oldValue }));
        }
        setTimeout(() => {
            this.DispatchEvent(this.Meta.Events, 'click', this.Entity);
        }, 0);
    }

    UpdateView(force = false, dirty = null, ...componentNames) {
        this.value = Utils.GetPropValue(this.Entity, this.Name);
        this.value = (this.value !== undefined && this.value !== null) ? parseInt(this.value) : null;
    }

    GetValueText() {
        return this._value === null ? "Không đánh giá" : `${this._value} sao`;
    }

    async ValidateAsync() {
        this.ValidationResult.Clear();
        if (this.value === null) return false;
        const isValid = this.value !== undefined && this.ValidateRequired(this.value);
        return isValid;
    }

    HashCode() {
        return JSON.stringify(this.Meta).split("").reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
    }
}