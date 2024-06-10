export class BadGatewayQueue {
    constructor() {
        this._queue = [];
    }

    Enqueue(options) {
        if (!options.NoQueue && options.Method !== 'GET') {
            options.Retry = true;
            this._queue.push(options);
        }
    }

    Dequeue() {
        return this._queue.shift();
    }

    Peek() {
        return this._queue[0];
    }

    get Count() {
        return this._queue.length;
    }
}
