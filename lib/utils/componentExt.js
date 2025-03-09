import { ComponentType } from "../models/componentType.js";
import { Utils } from "./utils.js";
import { Component } from "../models/component.js";
import { Client } from "../clients/client.js";
import { PatchVM } from "../models/patch.js";
import { EditForm } from "../editForm.js";
import { TabEditor } from "../tabEditor.js";
import { Html } from "./html.js";
import { Feature } from "../models/feature.js";
import { Textbox } from "../textbox.js";
import { SearchMethodEnum } from "../models/enum.js";

export class ComponentExt {
    /**
     * @param {any} com
     * @returns {PatchVM}
     */
    static StepPx = 10;
    static MapToPatch(com, table = null, fields = null) {
        /** @type {PatchVM} */
        // @ts-ignore
        const patch = {
            Table: table,
            Changes: [],
        };
        Utils.ForEachProp(com, (prop, val) => {
            if (prop.startsWith("$") || (fields && !fields.includes(prop))) return;
            // @ts-ignore
            patch.Changes.push({
                Field: prop,
                Value: val?.toString()
            });
        });
        return patch;
    }

    /**
     * @param {Component} component
     * @param {string} searchTerm
     * @param {Textbox} textbox
     */
    static MapToFilterOperator(component, searchTerm, textbox) {
        var rs = '';
        if (Utils.isNullOrWhiteSpace(searchTerm) || !component.FieldName) {
            if (!textbox) {
                return '';
            }
            let fieldName = `ds.[${component.FieldName}]`;
            switch (textbox.SearchMethod) {
                case SearchMethodEnum.Empty:
                    rs = `(${fieldName} is null or ${fieldName} = '')`
                    break;
                case SearchMethodEnum.Filled:
                    rs = `${fieldName} is not null`
                    break;
                default:
                    break
            }
            return rs;
        }
        searchTerm = searchTerm.trim();
        let fieldName = `ds.[${component.FieldName}]`;
        var searchParam = `@${component.FieldName.toLocaleLowerCase()}search`;
        switch (component.HotKey ? SearchMethodEnum.StartWith : (textbox ? textbox.SearchMethod : SearchMethodEnum.Contain)) {
            case SearchMethodEnum.Empty:
                rs = `(${fieldName} is null or ${fieldName} = '')`;
                break;
            case SearchMethodEnum.Filled:
                rs = `${fieldName} is not null`;
                break;
            case SearchMethodEnum.Equal:
                if (component.ComponentType === "Dropdown") {
                    if (Utils.isNullOrWhiteSpace(component.RefName)) {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `ds2.[${x}] = ${searchParam}`;
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                    else {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `ds2.[${x}] = ${searchParam}`;
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                }
                else if (component.ComponentType === "Datepicker") {
                    rs = `(${fieldName} >= ${searchParam} AND ${fieldName} < DATEADD(day, 1, ${searchParam}))`;
                }
                else {
                    rs = `${fieldName} = ${searchParam}`;
                }
                break;
            case SearchMethodEnum.NotEqual:
                if (component.ComponentType === "Dropdown") {
                    if (Utils.isNullOrWhiteSpace(component.RefName)) {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `ds2.[${x}] != ${searchParam}`;
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                    else {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `ds2.[${x}] != ${searchParam}`;
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                }
                else if (component.ComponentType === "Datepicker") {
                    rs = `(${fieldName} < ${searchParam} OR ${fieldName} >= DATEADD(day, 1, ${searchParam}))`;
                }
                else {
                    rs = `${fieldName} != ${searchParam}`;
                }
                break;
            case SearchMethodEnum.Contain:
                if (component.ComponentType === "Dropdown") {
                    if (Utils.isNullOrWhiteSpace(component.RefName)) {
                        var datas = JSON.parse(component.Query);
                        var fieldSearch = this.ExtractStrings(component.FormatData)[0];
                        var ids = datas.filter(x => x[fieldSearch].includes(searchTerm)).map(x => x.Id);
                        if (ids && ids.length > 0) {
                            rs = `${fieldName} in ('${ids.join("','")}')`;
                        }
                        else {
                            rs = `${fieldName} = '-1'`;
                        }
                    }
                    else {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `charindex(${searchParam}, ds2.[${x}]) >= 1`
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                }
                else if (component.ComponentType === "Checkbox") {
                    rs = `${fieldName} in (${searchTerm})`;
                }
                else {
                    rs = `charindex(${searchParam}, ${fieldName}) >= 1`;
                }
                break;
            case SearchMethodEnum.StartWith:
                if (component.ComponentType === "Dropdown") {
                    if (Utils.isNullOrWhiteSpace(component.RefName)) {
                        var datas = JSON.parse(component.Query);
                        var fieldSearch = this.ExtractStrings(component.FormatData)[0];
                        var ids = datas.filter(x => x[fieldSearch].includes(searchTerm)).map(x => x.Id);
                        if (ids && ids.length > 0) {
                            rs = `${fieldName} in ('${ids.join("','")}')`;
                        }
                        else {
                            rs = `${fieldName} = '-1'`;
                        }
                    }
                    else {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `ds2.[${x}] LIKE ${searchParam} + '%'`;
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }
                }
                else {
                    rs = `${fieldName} LIKE ${searchParam} + '%'`;
                }
                break;
            case SearchMethodEnum.NotContain:
                if (component.ComponentType === "Dropdown") {
                    if (Utils.isNullOrWhiteSpace(component.RefName)) {
                        var datas = JSON.parse(component.Query);
                        var fieldSearch = this.ExtractStrings(component.FormatData)[0];
                        var ids = datas.filter(x => x[fieldSearch].includes(searchTerm)).map(x => x.Id);
                        if (ids && ids.length > 0) {
                            rs = `${fieldName} not in ('${ids.join("','")}')`;
                        }
                        else {
                            rs = `${fieldName} = '-1'`;
                        }
                    }
                    else {
                        var sqlmap = this.ExtractStrings(component.FormatData).map(x => {
                            return `charindex(${searchParam}, ds2.[${x}]) = 0`
                        });
                        rs = `exists (select ds2.Id from [${component.RefName}] ds2 where ds2.Id = ${fieldName} and (${sqlmap.join(" and ")}))`;
                    }

                }
                else {
                    rs = `charindex(${searchParam}, ${fieldName}) = 0`;
                }
                break;
            default:
                break;
        }
        return rs;
    }

    static MapToFilterOperatorValue(component, searchTerm) {
        if (Utils.isNullOrWhiteSpace(searchTerm) || !component.FieldName) {
            return null;
        }
        searchTerm = searchTerm.trim();
        var searchParam = `@${component.FieldName.toLocaleLowerCase()}search`;
        return {
            FieldName: searchParam,
            Value: searchTerm
        };
    }
    /**
     * @param {string} inputy
     * 
     * @return {string[]}
     */
    static ExtractStrings(input) {
        const regex = /\{([^}]+)\}/g;
        const matches = [];
        let match;

        while ((match = regex.exec(input)) !== null) {
            matches.push(match[1]);
        }

        return matches;
    }

    /**
     * @param {featureName} feature
     * @param {boolean | undefined} portal
     */
    static async InitFeatureByName(featureName, portal = true) {
        const instance = new TabEditor(featureName);
        instance.Portal = portal;
        instance.Render();
        return instance;
    }

    /**
 * Loads a feature by name and optionally by ID, returning a promise that resolves to the feature.
 * 
 * @param {string} name - The name of the feature to load.
 * @param {string} [id=null] - The optional ID of the feature.
 * @returns {Promise<Component>} A promise that resolves to the loaded Feature object or null if not found.
 */
    static LoadFeature(name, id = null) {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const featureTask = Client.Instance.SubmitAsync({
                Url: `/api/feature/getFeature`,
                Method: "POST",
                JsonData: JSON.stringify({
                    Name: name
                })
            })
            featureTask.then(ds => {
                resolve(ds);
            }).catch(err => reject(err));
        });
    }

    static LoadPublicFeature(name, id = null) {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            const featureTask = Client.Instance.SubmitAsync({
                Url: `/api/feature/getPublicFeature?name=` + name,
                IsRawString: true,
                Method: "GET",
            })
            featureTask.then(ds => {
                resolve(ds);
            }).catch(err => reject(err));
        });
    }


    // Assign methods to an instance based on a feature's script
    static AssignMethods(feature, instance) {
        try {
            const scriptFunction = new Function(feature.Script).call(instance);
            Object.assign(instance, scriptFunction);
            if (typeof instance.Init === 'function') {
                /**
                 * @type {Function}
                 */
                const method = instance["Init"];
                if (!method) {
                    return Promise.resolve(false);
                }
                new Promise((resolve, reject) => {
                    let task = method.apply(instance, instance);
                    if (!task || task.isCompleted == null) {
                        resolve(task);
                    } else {
                        task.then(() => resolve(task)).catch(e => reject(e));
                    }
                });
            }
        } catch (error) {
            console.log(error);
        }

    }

    // Find a component that has a specific event handler registered
    static FindComponentEvent(component, eventName) {
        let parent = component.ParentForm;
        while (parent !== null && !parent[eventName]) {
            parent = parent.ParentForm;
        }
        return parent;
    }

    // Modify the visibility of specific fields in a component
    static SetShow(component, show, ...fieldNames) {
        component.Children.filter(child => fieldNames.includes(child.Name))
            .forEach(child => child.Show = show);
    }


    /**
    * Detailed rendering logic for the calendar, handling navigation and selection of dates.
    * @param {HTMLElement} element - The date to render in the calendar.
    * @param {HTMLElement} parentEle - The date to render in the calendar.
    */
    // Alter position of HTMLElement relative to parent
    static AlterPosition(element, parentEle) {
        if (!element || !element.parentElement || !parentEle) {
            return;
        }
        const containerRect = parentEle.getBoundingClientRect();
        var containerBottom = containerRect.bottom;
        element.style.top = "auto";
        element.style.right = "auto";
        element.style.bottom = "auto";
        element.style.left = "auto";
        Html.Take(element).Floating(containerBottom, containerRect.left);
        if (this.IsOutOfViewport(element).Right) {
            if (!this.IsOutOfViewport(element).Bottom) {
                this.BottomCenter(element, parentEle);
            }
            else if (containerRect.Top > element.clientHeight) {
                this.TopCenter(element, parentEle);
            }
        }
        if (this.IsOutOfViewport(element).Bottom) {
            this.TopCenter(element, parentEle);
        }
    }

    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static BottomCenter(element, parent) {
        const containerRect = parent.getBoundingClientRect();
        element.style.right = 'auto';
        element.style.top = containerRect.bottom + 'px';
        this.MoveLeft(element);
    }

    static GetComputedPx(element, prop) {
        const computedVal = window.getComputedStyle(element)[prop];
        return computedVal ? parseFloat(computedVal.replace('px', '')) || 0 : 0;
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static TopCenter(element, parent) {
        element.style.right = 'auto';
        this.MoveLeft(element);
        this.MoveTop(element, parent);
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static MoveLeft(element) {
        while (this.IsOutOfViewport(element).Right) {
            const left = this.GetComputedPx(element, 'left') - this.StepPx;
            element.style.left = left + 'px';
        }
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static MoveTop(element, parent) {
        const parentTop = parent ? parent.getBoundingClientRect().top : null;
        while (this.IsOutOfViewport(element).Bottom || (parent && element.getBoundingClientRect().bottom > parentTop)) {
            const top = this.GetComputedPx(element, 'top') - (parent ? 1 : this.StepPx);
            element.style.top = top + 'px';
        }
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static LeftMiddle(element, parent) {
        const containerRect = parent.getBoundingClientRect();
        element.style.left = 'auto';
        element.style.bottom = 'auto';
        element.style.right = containerRect.left + 'px';
        this.MoveTop(element);
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static RightMiddle(element, parent) {
        const containerRect = parent.getBoundingClientRect();
        element.style.right = 'auto';
        element.style.bottom = 'auto';
        element.style.left = containerRect.right + 'px';
        this.MoveTop(element);
    }
    /**
    * @param {HTMLElement} element 
    * @param {HTMLElement} parent
    */
    static IsOutOfViewport(element) {
        const rect = element.getBoundingClientRect();
        return {
            Top: rect.top < 0,
            Right: rect.right > (window.innerWidth || document.documentElement.clientWidth),
            Bottom: rect.bottom > (window.innerHeight || document.documentElement.clientHeight),
            Left: rect.left < 0
        };
    }

    // Download a file using Blob and URL.createObjectURL
    static DownloadFile(filename, blob) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Toggle full screen mode for an element
    static FullScreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) { /* Safari */
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE11 */
            element.msRequestFullscreen();
        }
    }

    static FindClosest(component, Type) {
        if (component instanceof Type) {
            return component;
        }

        while (component.Parent != null) {
            component = component.Parent;
            if (component instanceof Type) {
                return component;
            }
        }
        return null;
    }

    /**
     * @typedef {import("../editableComponent.js").default} EditableComponent
     * @param {EditableComponent} com
     * @param {TabEditor} tab
     */
    static async OpenTabOrPopup(com, tab) {
        const editablMd = await import('../editableComponent.js');
        const { EditForm } = await import('../editForm.js');
        const { TabEditor } = await import('../tabEditor.js');
        let parentTab;
        if (com instanceof EditForm) {
            parentTab = com;
        } else if (com instanceof editablMd.default) {
            parentTab = EditForm || this.FindClosest(com, EditForm);
        }
        if (tab instanceof TabEditor) {
            if (tab.Popup) {
                com.AddChild(tab);
            } else {
                tab.Render();
            }

            tab.ParentForm = parentTab;
            tab.OpenFrom = parentTab instanceof EditForm && parentTab?.FirstOrDefault(x => x.Entity === tab.Entity);
        }
    }

    /**
     * 
     * @param {EditableComponent} com 
     * @param {TabEditor} tab 
     */
    async OpenTabOrPopup(com, tab) {
        const { EditForm } = await import('../editForm.js');
        let parentTab;
        if (com instanceof EditForm) {
            parentTab = com;
        } else {
            parentTab = com.EditForm || com.FindClosest(x => x instanceof EditForm);
        }

        if (tab.Popup) {
            com.AddChild(tab);
        } else {
            tab.Render();
        }

        tab.ParentForm = parentTab;
        tab.OpenFrom = parentTab?.FilterChildren(x => x.Entity === tab.Entity)?.[0];
    }

    /**
     * @typedef {import('../tabEditor.js').TabEditor} TabEditor
     * @param {EditableComponent} com
     * @param {string} id
     * @param {string} featureName
     * @param {() => TabEditor} factory
     */
    static async OpenTab(com, id, featureName, factory, popup = false, anonymous = false) {
        const md = await import('../tabEditor.js');
        if (!popup && md.TabEditor.FindTab(id)) {
            const exists = md.TabEditor.FindTab(id);
            exists.Focus();
            return exists;
        }
        const feature = await this.LoadFeature(featureName);
        const tab = factory();
        tab.Popup = popup;
        tab.Name = featureName;
        tab.Id = id;
        tab.Meta = feature;
        this.AssignMethods(feature, tab);
        await this.OpenTabOrPopup(com, tab);
        return tab;
    }

    /**
     * @param {EditableComponent} com
     * @param {string} featureName
     * @param {{ (): EditableComponent }} factory
     */
    static OpenPopup(com, featureName, factory, anonymous = false, child = false) {
        const hashCode = () => {
            let hash = 0;
            let str = JSON.stringify(com);
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash |= 0;
            }
            return hash;
        };
        // @ts-ignore
        return this.OpenTab(com, hashCode().toString(), featureName, factory, true, anonymous);
    };
}
