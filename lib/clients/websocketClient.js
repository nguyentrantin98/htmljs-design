import { Client } from "./client.js";
import ReconnectingWebSocket from "reconnecting-websocket";
import EntityAction from "../models/EntityAction.js";
export class WebSocketClient {
    /**
     * @type {EntityAction[]}
     */
    EntityActionList;
    /**
     * @param {string} url
     */
    constructor(url) {
        this.EntityActionList = [];
        const token = Client.Token ? Client.Token.AccessToken : null;
        if (!token) return;
        var ws = Client.api.includes("https") ? "wss" : "ws";
        const wsUri = `${ws}://${url}?access_token=${token}`;
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
            this.EntityActionList.filter(x => x.QueueName == objRs.QueueName).forEach(x => {
                x.action(objRs);
            });
            window.dispatchEvent(new CustomEvent(objRs.QueueName, { detail: objRs }));
        } catch (error) {
            this.deviceKey = responseStr;  // Fallback if JSON parsing fails
        }
    }

    AddListener(queueName, entityAction) {
        const index = this.EntityActionList.findIndex(item => item.QueueName === queueName);
        if (index !== -1) {
            this.EntityActionList[index].action = entityAction;
        }
        else {
            this.EntityActionList.push({
                QueueName: queueName,
                action: entityAction
            })
        }
    }

    RemoveListener(queueName) {
        const index = this.EntityActionList.findIndex(item => item.QueueName === queueName);
        if (index !== -1) {
            this.EntityActionList.splice(index, 1);
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
