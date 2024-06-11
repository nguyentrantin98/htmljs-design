export class ObservableList {
    constructor(Data = []) {
        this._data = Data;
        this.Listeners = [];
    }

    Clear() {
        while (this._data.length) this._data.pop();
    }
    
    // Subscribe to changes
    Subscribe(callback) {
        this.Listeners.push(callback);
    }

    // Unsubscribe from changes
    Unsubscribe(Callback) {
        this.Listeners = this.Listeners.filter(listener => listener !== Callback);
    }

    // Notify all listeners
    Notify(Action, Item, Index) {
        const Args = { ListData: this._data, Item, Index, Action };
        this.Listeners.forEach(Listener => Listener(Args));
    }

    get Data() {
        return this._data;
    }

    set Data(Value) {
        this._data = Value;
        this.Notify('Render');
    }

    Add(Item, Index = this._data.length) {
        this._data.splice(Index, 0, Item);
        this.Notify('Add', Item, Index);
    }

    Remove(Item) {
        const Index = this._data.indexOf(Item);
        if (Index > -1) {
            this._data.splice(Index, 1);
            this.Notify('Remove', Item, Index);
        }
    }

    RemoveAt(Index) {
        if (Index >= 0 && Index < this._data.length) {
            const Item = this._data[Index];
            this._data.splice(Index, 1);
            this.Notify('Remove', Item, Index);
        }
    }

    Update(Item, Index) {
        if (Index >= 0 && Index < this._data.length) {
            this._data[Index] = Item;
            this.Notify('Update', Item, Index);
        }
    }
}
