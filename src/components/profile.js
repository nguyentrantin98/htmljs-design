import { EditableComponent } from "../../lib"
import { Html } from "../../lib/utils/html";

export class Profile extends EditableComponent {
    constructor(meta, ele) {
        super(meta, ele);
    }

    Render() {
        Html.Take(this.ParentElement).H1.IText("profile");
    }
}