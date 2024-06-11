import { Client } from "./client.js";
import ReconnectingWebSocket from "reconnecting-websocket";
export class WebSocketClient {
    /**
     * @param {string} url
     */
    constructor(url) {
        const token = Client.token ? Client.token.accessToken : null;
        if (!token) return;

        const wsUri = `wss://${Client.Host}/${url}?access_token=${token}`;

        if (typeof ReconnectingWebSocket !== 'undefined') {
            this.socket = new ReconnectingWebSocket(wsUri);
            this.socket.onopen = (e) => {
                console.log("Socket opened", e);
            };
            this.socket.onclose = (e) => {
                console.log("Socket closed", e);
            };
            this.socket.onerror = (e) => {
                console.log(e);
            };
            this.socket.onmessage = this.HandleMessage.bind(this);
            // @ts-ignore
            this.socket.binaryType = "arraybuffer";
        }
        else {

            this.socket = new WebSocket(wsUri);
            this.socket.onopen = (e) => {
                console.log("Socket opened", e);
            };
            this.socket.onclose = (e) => {
                console.log("Socket closed", e);
            };
            this.socket.onerror = (e) => {
                console.log(e);
            };
            this.socket.onmessage = this.HandleMessage.bind(this);
            this.socket.binaryType = "arraybuffer";
        }
    }

    /**
     * @param {{ data: { toString: () => any; }; }} event
     */
    HandleMessage(event) {
        const responseStr = event.data.toString();
        try {
            const objRs = JSON.parse(responseStr);  // Assuming MQEvent is a JSON serializable object
            if (objRs.queueName) {
                window.dispatchEvent(new CustomEvent(objRs.queueName, { detail: objRs }));
            } else {
                this.deviceKey = responseStr;
            }
        } catch (error) {
            this.deviceKey = responseStr;  // Fallback if JSON parsing fails
        }
    }

    /**
     * @param {string | ArrayBufferLike | Blob | ArrayBufferView} message
     */
    Send(message) {
        this.socket.send(message);
    }

    Close() {
        this.socket?.close();
    }
}
