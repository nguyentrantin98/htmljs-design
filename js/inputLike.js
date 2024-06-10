import { Component } from "./models/component.js";
import { Textbox } from "./textbox.js";


class Textarea extends Textbox {
     /**
     * @param {Component} ui
     * @param {HTMLElement} [ele=null] 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.MultipleLine = true;
    }
}

class Password extends Textbox {
     /**
     * @param {Component} ui
     * @param {HTMLElement} [ele=null] 
     */
    constructor(ui, ele = null) {
        super(ui, ele);
        this.Password = true;
    }
}
export { Textarea, Password };
