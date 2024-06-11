import { GridView } from './gridView.js';
import { Utils } from './utils/utils.js';

export class CompareGridView extends GridView {
    /**
     * @param {import("./models/component.js").Component} ui
     */
    constructor(ui) {
        super(ui);
        this.ContentFieldName = "TextHistory";
        this.ReasonOfChange = "ReasonOfChange";
        this.Style = "white-space: pre-wrap;";
        this.Meta.LocalHeader = [
            // @ts-ignore
            {
                FieldName: "InsertedBy",
                ComponentType: "Label",
                Label: "Người thao tác",
                Description: "Người thao tác",
                ReferenceId: Utils.GetEntity("User")?.Id.toString(),
                RefName: "User",
                FormatData: "{" + "FullName" + "}",
                Active: true,
            },
            // @ts-ignore
            {
                FieldName: "InsertedDate",
                ComponentType: "Label",
                Label: "Ngày thao tác",
                Description: "Ngày thao tác",
                Active: true,
                TextAlign: "left",
                FormatData: "{0:dd/MM/yyyy HH:mm zz}"
            },
            // @ts-ignore
            {
                FieldName: "ReasonOfChange",
                ComponentType: "Label",
                Label: "Nội dung",
                Description: "Nội dung",
                HasFilter: true,
                Active: true,
            },
            // @ts-ignore
            {
                FieldName: "TextHistory",
                ComponentType: "Label",
                ChildStyle: this.Style,
                Label: "Chi tiết thay đổi",
                Description: "Chi tiết thay đổi",
                HasFilter: true,
                Active: true,
            },
        ];
    }

    FilterColumns(component) {
        super.FilterColumns(component);
        component.forEach(x => x.Frozen = false);
        this.Header.Remove(this.Header.find(x => x === GridView.ToolbarColumn));
        return component;
    }
}
