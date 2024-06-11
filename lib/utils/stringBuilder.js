export class StringBuilder {
    constructor(initialString = '') {
        this._buffer = [initialString];
    }

    Append(str) {
        this._buffer.push(str);
        return this; // for method chaining
    }

    ToString() {
        return this._buffer.join('');
    }
}