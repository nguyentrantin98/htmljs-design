import { Section } from './section.js';
export class ListViewSection extends Section {
    /** @typedef {import('./listView.js').ListView} ListView */
    /** @type {ListView} */
    ListView;
    Render() {
        // @ts-ignore
        this.ListView = this.Parent;
        super.Render();
    }
}