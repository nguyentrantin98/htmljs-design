import { EditableComponent } from "./editableComponent.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";
import { ElementType } from './models/elementType.js'
import { Component, PatchVM, EventType, FeaturePolicy } from "./models/";
import { ComponentFactory } from "./utils/componentFactory.js";
import { Client } from "./clients/client.js";
import { TabComponent } from "./tabComponent.js";
import { TabGroup } from "./tabGroup.js";

export class Section extends EditableComponent {
    /**
     * 
     * @param {ElementType | string | null | undefined} eleType - Element type of the section
     * @param {HTMLElement | null} ele 
     */
    constructor(eleType, ele = null) {
        super(null, ele);
        this.elementType = eleType;
        this.Element = ele;
        this.innerEle = null;
        this._chevron = null;
    }

    Render() {
        if (this.elementType == null) {
            this.elementType = this.Element?.tagName?.toLowerCase();
        } else {
            Html.Take(this.ParentElement).Add(this.elementType.tagName == null ? this.elementType : this.elementType?.tagName?.toLowerCase());
            this.Element = Html.Context;
        }
        if (this.Meta === null) {
            return;
        }
        if (this.Meta.Html && this.Meta.Html != '') {
            let cssContent = this.Meta.Css && this.Meta.Css != '';
            const section = (this.Meta.FieldName?.toLowerCase() ?? '') + this.Meta.Id;
            if (cssContent) {
                const regex = /(?:^|[\s\r\n])\.([a-zA-Z0-9-_]+)/g;
                cssContent = cssContent.replace(regex, (match) => {
                    if (/\d/.test(match) || match.includes("minmax")) {
                        return match;
                    } else {
                        return match.replace(/([.])/, `[${section}]$1`);
                    }
                });
                if (!document.head.querySelector("#" + section)) {
                    const style = document.createElement("style");
                    style.id = section;
                    style.appendChild(document.createTextNode(cssContent));
                    document.head.appendChild(style);
                }
            }
            if (this.Element != null) {
                const cellText = Utils.GetHtmlCode(this.Meta.Html, [this.Entity]) ?? '';
                this.Element.innerHTML = cellText;
            }
            // @ts-ignore
            EditForm.SplitChild(this.Element.children, section);
            if (this.Meta.Javascript) {
                try {
                    const fn = new Function(this.Meta.Javascript);
                    const obj = fn.call(null, this.EditForm);
                    for (const prop in obj) {
                        this[prop] = obj[prop].bind(this);
                    }
                } catch (e) {
                    console.log(e.message);
                }
            }
            this.RenderChildrenSection(this.Meta);
            return;
        }
        this.RenderComponent(this.Meta);
        this.RenderChildrenSection(this.Meta);
    }

    HandleMeta() {
        if (!this.Meta.Html) {
            return;
        }

        const cssContent = this.Meta.Css;
        const hard = this.Meta.Id;
        const section = `${this.Meta.FieldName.toLowerCase()}${hard}`;

        if (cssContent) {
            const styleId = `${section}-style`;
            if (!document.getElementById(styleId)) {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = cssContent.replace(/(?:^|[\s\r\n])\.([a-zA-Z0-9-_]+)/g, (match, p1) => {
                    return `.${section} ${p1}`;
                });
                document.head.appendChild(style);
            }
        }

        this.Element.innerHTML = Utils.GetHtmlCode(this.Meta.Html, [this.Entity]);

        if (this.Meta.Javascript) {
            try {
                const fn = new Function('editForm', this.Meta.Javascript);
                fn.call(this, this.EditForm);
            } catch (e) {
                console.error('Error executing JavaScript:', e);
            }
        }
    }

    _chevron;
    get Chevron() { return this._chevron; }
    set Chevron(value) { this._chevron = value; }

    /**
     * Renders the dropdown elements and handles their interactions.
     */
    RenderDropDown() {
        const button = document.createElement('button');
        button.className = 'btn ribbon';
        button.textContent = this.Meta.Label;
        button.addEventListener('click', this.DropdownBtnClick.bind(this));

        const chevron = document.createElement('span');
        chevron.textContent = '▼';
        button.appendChild(chevron);

        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';
        dropdown.style.display = 'none'; // Initially hidden
        dropdown.tabIndex = -1; // Make it focusable

        this.Element.appendChild(button);
        this.Element.appendChild(dropdown);

        this.InnerEle = dropdown;
        this.Chevron = chevron;

        // Add a focus out listener to hide dropdown when focus is lost
        this.Element.addEventListener('focusout', this.HideDetailIfButtonOnly.bind(this));
    }

    /**
     * Handles button click to toggle the visibility of the dropdown.
     */
    DropdownBtnClick() {
        const isVisible = this.InnerEle.style.display !== 'none';
        this.InnerEle.style.display = isVisible ? 'none' : 'block';
        this.Chevron.textContent = isVisible ? '▼' : '▲';
    }

    /**
     * Hides the dropdown if the focus is moved away and only buttons are present.
     */
    HideDetailIfButtonOnly() {
        // This checks if all children are buttons which could be customized based on actual use case
        if (this._isAllBtn === null) {
            this._isAllBtn = Array.from(this.InnerEle.children).every(child => child.tagName === 'BUTTON');
        }

        if (this._isAllBtn) {
            this.InnerEle.style.display = 'none';
            this.Chevron.textContent = '▼';
        }
    }

    static HasElementAndAll(source, predicate) {
        if (source === null || source.length === 0) {
            return false;
        }

        return source.every(predicate);
    }

    /**
     * Renders a section based on the provided editable component and group information.
     * @param {EditableComponent} Parent - The parent component.
     * @param {Component} GroupInfo - The group info component.
     * @param {Object} Entity - Optional entity parameter.
     * @param {EditForm} form - Optional edit form.
     * @returns {Section} - The rendered section, or null if not permitted.
     */
    static RenderSection(parent, groupInfo, entity = null, form = null) {
        form = form ?? parent.EditForm;
        let width = groupInfo.Width;
        const OuterColumn = form.GetOuterColumn(groupInfo);
        const ParentColumn = form.GetInnerColumn(groupInfo.Parent);
        const HasOuterColumn = OuterColumn > 0 && ParentColumn > 0;
        if (HasOuterColumn) {
            const Per = (OuterColumn / ParentColumn * 100).toFixed(2);
            if (!groupInfo.ItemInRow) {
                groupInfo.ItemInRow = 2;
            }
            width = OuterColumn === ParentColumn ? "100%" : `${Per}%`;
        }
        else {
            width = "100%";
        }
        var section = this.RenderGroupContent(parent, groupInfo, width, entity, form);
        return section;
    }
    /**@param {EditForm} editForm */
    /**@param {EditForm} parent */
    static RenderGroupContent(parent, groupInfo, width, entity, editForm) {
        /**@type {EditForm}*/
        var form = editForm ?? parent.EditForm;
        if (groupInfo.ClassName?.includes("ribbon")) {
            Html.Take(form.PopUpMenu);
        }
        else if (groupInfo.ClassName?.includes("title")) {
            Html.Take(form.TitleCenterElement);
        }
        else {
            Html.Take(parent.Element);
        }
        Html.Instance.Div.Event(EventType.ContextMenu, (e) => form.SysConfigMenu(e, null, groupInfo, null)).ClassName("section-item card").Width(width).Div.ClassName(groupInfo.ClassName ?? "");
        if (groupInfo.Label) {
            Html.Instance.Label.ClassName("header").IText(groupInfo.Label);
            Html.Instance.End.Render();
        }
        if (!groupInfo.ClassName?.includes("ribbon")) {
            Html.Instance.ClassName("panel").ClassName("group");
        }

        Html.Instance.Display(!groupInfo.Hidden).Style(groupInfo.Style || "");
        const section = new Section(null, Html.Context);
        if (groupInfo.ComponentType == "Section") {
            section.IsSection = true;
        }
        section.EditForm = form;
        section.Id = groupInfo.FieldName + groupInfo.Id;
        section.Name = groupInfo.FieldName;
        section.Meta = groupInfo;
        section.Disabled = parent.Disabled || groupInfo.Disabled;
        // @ts-ignore
        parent.AddChild(section, null, groupInfo.ShowExp, groupInfo.DisabledExp);
        Html.Take(parent.Element);
        section.DOMContentLoaded?.Invoke();
        return section;
    }


    /**
     * Renders a tab group within a parent editable component.
     * @param {EditableComponent} Parent - The parent component.
     * @param {Component} Group - The group of components to be rendered as tabs.
     */
    static RenderTabGroup(Parent, Group, entity = null) {
        const disabled = Parent.Disabled || Group.Disabled;
        if (!Parent.EditForm.TabGroup) {
            Parent.EditForm.TabGroup = [];
        }

        var TabG = Parent.EditForm.TabGroup.find(x => x.Name === Group.TabGroup);
        if (!TabG) {
            TabG = new TabGroup(Group);
            TabG.Name = Group.TabGroup,
                TabG.Parent = Parent,
                TabG.ParentElement = Parent.Element,
                TabG.Entity = entity ?? Parent.Entity,
                TabG.Meta = Group,
                TabG.EditForm = Parent.EditForm,
                TabG.Children = [],
                TabG.Disabled = disabled;
            var SubTab = new TabComponent(Group)
            SubTab.Parent = TabG,
                SubTab.Entity = Parent.Entity,
                SubTab.Meta = Group,
                SubTab.Name = Group.FieldName,
                SubTab.EditForm = Parent.EditForm,
                SubTab.Disabled = disabled;
            // @ts-ignore
            TabG.Children.push(SubTab);
            Parent.EditForm.TabGroup.push(TabG);
            Parent.Children.push(TabG);
            if (Group.ComponentType == "Section") {
                SubTab.IsSection = true;
                TabG.IsSection = true;
            }
            TabG.Render();
            SubTab.Render();
            SubTab.RenderTabContent();
            SubTab.Focus();
        } else {
            var subTab = new TabComponent(Group)
            subTab.Parent = TabG,
                subTab.ParentElement = TabG.Element,
                subTab.Entity = Parent.Entity,
                subTab.Meta = Group,
                subTab.Name = Group.Name,
                subTab.EditForm = Parent.EditForm;
            subTab.Disabled = disabled;
            TabG.Children.push(subTab);
            if (Group.ComponentType == "Section") {
                subTab.IsSection = true;
                TabG.IsSection = true;
            }
            subTab.Render();
        }
    }


    /**
     * Renders child components according to metadata.
     * @param {Component} group - The group of components to render.
     */
    RenderChildrenSection(group) {
        if (!group.Children || group.Children.length === 0) {
            return;
        }

        group.Children.sort((a, b) => a.Order - b.Order).forEach(child => {
            if (child.IsTab) {
                Section.RenderTabGroup(this, child);
            } else {
                Section.RenderSection(this, child);
            }
        });
    }

    /**
     * Handles dynamic updates to component labels.
     * @param {Event} event - The event that triggered the label change.
     * @param {Component} component - The component whose label is being changed.
     */
    ChangeLabel(event, component) {
        clearTimeout(this._imeout);
        this._imeout = setTimeout(() => {
            // @ts-ignore
            this.SubmitLabelChanged('Component', component.Id, event?.target?.textContent);
        }, 1000);
    }

    /**
     * @param {string} table
     * @param {any} id
     * @param {any} label
     */
    SubmitLabelChanged(table, id, label) {
        var patch = new PatchVM();
        patch.Table = table;
        patch.Changes = [
            // @ts-ignore
            { Field: this.IdField, Value: id },
            // @ts-ignore
            { Field: 'Label', Value: label },
        ];
        Client.Instance.PatchAsync(patch).then(x => {
            console.log('patch success');
        });
    }

    static SubmitLabelChanged(table, id, label) {
        var patch = {
            Table: table,
            Changes: [
                { Field: "IdField", Value: id },
                { Field: "Component.Label", Value: label }
            ]
        };
        // @ts-ignore
        Client.Instance.PatchAsync(patch).Done();
    }

    static _imeout1;

    /**
     * Changes the label of a component group.
     * @static
     * @param {Event} e - The event object.
     * @param {Component} com - The component instance.
     */
    static ChangeComponentGroupLabel(e, com) {
        window.clearTimeout(Section._imeout1);
        Section._imeout1 = window.setTimeout(() => {
            this.SubmitLabelChanged('Meta', com.Id, Utils.DecodeSpecialChar(e.target instanceof HTMLElement && e.target.textContent));
        }, 1000);
    }

    /**
     * 
     * @param {Component} ui 
     * @param {Number} column
     * @param {FeaturePolicy[]} allComPolicies
     * @returns 
     */
    RenderCom(ui, column, allComPolicies) {
        if (ui.Hidden) {
            return;
        }
        const comPolicies = allComPolicies.filter(x => x.RecordId === ui.Id);
        const readPermission = !ui.IsPrivate || comPolicies.every(x => x.CanRead);
        const writePermission = !ui.IsPrivate || comPolicies.every(x => x.CanWrite);
        var innerCol = this.EditForm.GetInnerColumn(ui);
        if (!readPermission) {
            return;
        }

        Html.Take(this.Element);
        const colSpan = ui.Column || 2;
        ui.Label = ui.Label || '';

        let label = null;
        if (ui.ShowLabel) {
            Html.Div.IText(ui.Label).TextAlign(column === 0 ? 'left' : 'right').Render();
            label = Html.Context;
            Html.End.Render();
        }

        const childCom = ComponentFactory.GetComponent(ui, this.EditForm);
        if (childCom === null) return;

        if (childCom.IsListView) {
            // @ts-ignore
            this.EditForm.ListViews.push(childCom);
        }
        this.AddChild(childCom);
        if (childCom instanceof EditableComponent) {
            childCom.Disabled = ui.Disabled || this.Disabled || !writePermission || this.EditForm.IsLock || childCom.Disabled;
        }

        if (childCom.Element) {
            if (ui.ChildStyle) {
                const current = Html.Context;
                Html.Take(childCom.Element).Style(ui.ChildStyle);
                Html.Take(current);
            }
            if (ui.ClassName) {
                childCom.Element.classList.add(ui.ClassName);
            }

            if (ui.Row === 1) {
                childCom.ParentElement.parentElement.classList.add('inline-label');
            }

            if (Client.SystemRole) {
                childCom.Element.addEventListener('contextmenu', e => this.EditForm.SysConfigMenu(e, ui, ui, childCom));
            }
        }
        if (ui.Focus) {
            childCom.Focus();
        }

        if (colSpan <= innerCol) {
            if (label && label.nextElementSibling && colSpan !== 2) {
                if (label.nextElementSibling instanceof HTMLElement) {
                    label.nextElementSibling.style.gridColumn = `${column + 2}/${column + colSpan + 1}`;
                }
            } else if (childCom.Element) {
                childCom.Element.style.gridColumn = `${column + 2}/${column + colSpan + 1}`;
            }
            column += colSpan;
        } else {
            column = 0;
        }
        if (column === innerCol) {
            column = 0;
        }
    }

    async ComponentProperties(component) {
        const { ComponentBL } = await import('./forms/componentEditor.js');
        const { EditForm } = await import('./editForm.js');
        // @ts-ignore
        var editor = new ComponentBL({
            Entity: component,
            ParentElement: this.Element,
            OpenFrom: this.FindClosest(editForm => editForm instanceof EditForm),
        });
        this.AddChild(editor);
    }

    /**
     * @param {boolean} [disabled]
     */
    SetDisableUI(disabled) {
        const ele = this.Element;
        if (ele == null) {
            return;
        }

        if (disabled) {
            ele.setAttribute("disabled", "disabled");
        }
        else {
            ele.removeAttribute("disabled");
        }
    }

    /**
     * Renders a component within a group, setting up the necessary HTML structure.
     * @param {Component} group - The component group to render.
     */
    RenderComponent(group) {
        if (!group.Components || group.Components.length == 0) {
            return;
        }
        Html.Table.ClassName("ui-layout").TBody.TRow.Render();
        let column = 0;
        group.Components = this.EditForm.GetComPolicies(group.Components, Utils.ComponentId);
        group.Components.sort((a, b) => a.Order - b.Order).forEach(ui => {
            if (ui.Hidden) {
                return;
            }

            const ComPolicies = AllComPolicies.filter(x => x.RecordId === ui.Id);
            const ReadPermission = !ui.IsPrivate || ComPolicies.every(x => x.CanRead);
            const WritePermission = !ui.IsPrivate || ComPolicies.every(x => x.CanWrite);
            if (!ReadPermission) {
                return;
            }
            const colSpan = ui.Column || 1;
            ui.Label = ui.Label || '';
            Html.TData.ColSpan(colSpan).Visibility(ui.Visibility);
            if (ui.ShowLabel) {
                Html.Instance.Div.ClassName("group-control").Style(ui.ChildStyle).Div.ClassName('header-label').IText(ui.Label).End.Render();
            }
            if (ui.Style) {
                Html.Style(ui.Style);
            }
            if (ui.Width) {
                Html.Width(ui.Width);
            }
            const childCom = ComponentFactory.GetComponent(ui, this.EditForm);
            if (childCom === null) return;
            this.AddChild(childCom);
            this.EditForm.ChildCom.push(childCom);
            if (childCom) {
                childCom.Disabled = ui.Disabled || this.Disabled || !WritePermission || this.EditForm.IsLock || childCom.Disabled;
            }
            if (childCom.Element) {
                if (ui.ChildStyle) {
                    const Current = Html.Context;
                    Html.Take(childCom.Element).Style(ui.ChildStyle);
                    Html.Take(Current);
                }

                if (ui.Row === 1) {
                    childCom.ParentElement.parentElement.classList.add("inline-label");
                }

                if (Client.Instance.SystemRole && ui.ComponentType != "CodeEditor") {
                    childCom.Element.addEventListener("contextmenu", e => this.EditForm.SysConfigMenu(e, ui, group, childCom));
                }
            }
            if (ui.Focus) {
                childCom.Focus();
            }

            Html.EndOf("td");
            if (ui.Offset != null && ui.Offset > 0) {
                Html.TData.ColSpan(ui.Offset).End.Render();
                column += ui.Offset;
            }
            column += colSpan;
            if (column === this.EditForm.GetInnerColumn(group)) {
                column = 0;
                Html.EndOf("tr").TRow.Render();
            }
        });
    }
}