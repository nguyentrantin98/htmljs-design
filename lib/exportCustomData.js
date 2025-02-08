import { Client } from "./clients/client.js";
import { ListView } from "./listView.js";
import { PopupEditor } from "./popupEditor.js";
import { Toast } from "./toast.js";
import { Html } from "./utils/html.js";
import { Utils } from "./utils/utils.js";

export class ExportCustomData extends PopupEditor {
    static Prefix = "Export";

    /**
     * @param {ListView} ParentListView
     */
    constructor(ParentListView) {
        super('Component');
        this.Name = "Export CustomData";
        this.Title = "Xuất excel tùy chọn";
        document.addEventListener('DOMContentLoaded', () => {
            this.LocalRender();
        });
        this.ParentListView = ParentListView;
        this._tbody = null;
        this._headers = [];
        this._userSetting = null;
        this._table = null;
        this._hasLoadSetting = false;
    }

    Move() {
        const self = this;
        const table = this._table;

        let draggingEle;
        let draggingRowIndex;
        let placeholder;
        let list;
        let isDraggingStarted = false;

        let x = 0;
        let y = 0;

        const swap = function (nodeA, nodeB) {
            const parentA = nodeA.parentNode;
            const siblingA = nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;

            nodeB.parentNode.insertBefore(nodeA, nodeB);
            parentA.insertBefore(nodeB, siblingA);
        };

        const isAbove = function (nodeA, nodeB) {
            const rectA = nodeA.getBoundingClientRect();
            const rectB = nodeB.getBoundingClientRect();

            return rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2;
        };

        const cloneTable = function () {
            const rect = table.getBoundingClientRect();
            const width = parseInt(window.getComputedStyle(table).width);

            list = document.createElement('div');
            list.classList.add('clone-list');
            list.style.position = 'absolute';
            table.parentNode.insertBefore(list, table);

            table.style.visibility = 'hidden';

            table.querySelectorAll('tr').forEach(function (row) {
                const item = document.createElement('div');
                item.classList.add('draggable');

                const newTable = document.createElement('table');
                newTable.setAttribute('class', 'clone-table');
                newTable.style.width = `${width}px`;

                const newRow = document.createElement('tr');
                const cells = Array.from(row.children);
                cells.forEach(function (cell) {
                    if (cell instanceof HTMLElement) {
                        const newCell = cell.cloneNode(true);
                        if (newCell instanceof HTMLElement) {
                            newCell.style.width = `${parseInt(window.getComputedStyle(cell).width)}px`;
                            newRow.appendChild(newCell);
                        }
                    }
                });

                newTable.appendChild(newRow);
                item.appendChild(newTable);
                list.appendChild(item);
            });
        };

        const mouseDownHandler = function (e) {
            const originalRow = e.target.parentNode;
            draggingRowIndex = Array.from(table.querySelectorAll('tr')).indexOf(originalRow);

            x = e.clientX;
            y = e.clientY;

            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        };

        const mouseMoveHandler = function (e) {
            if (!isDraggingStarted) {
                isDraggingStarted = true;

                cloneTable();

                draggingEle = Array.from(list.children)[draggingRowIndex];
                draggingEle.classList.add('dragging');

                placeholder = document.createElement('div');
                placeholder.classList.add('placeholder');
                draggingEle.parentNode.insertBefore(placeholder, draggingEle.nextSibling);
                placeholder.style.height = `${draggingEle.offsetHeight}px`;
            }

            draggingEle.style.position = 'absolute';
            draggingEle.style.top = `${draggingEle.offsetTop + e.clientY - y}px`;
            draggingEle.style.left = `${draggingEle.offsetLeft + e.clientX - x}px`;

            x = e.clientX;
            y = e.clientY;

            const prevEle = draggingEle.previousElementSibling;
            const nextEle = placeholder.nextElementSibling;

            if (prevEle && prevEle.previousElementSibling && isAbove(draggingEle, prevEle)) {
                swap(placeholder, draggingEle);
                swap(placeholder, prevEle);
            }

            if (nextEle && isAbove(nextEle, draggingEle)) {
                swap(nextEle, placeholder);
                swap(nextEle, draggingEle);
            }
        };

        const mouseUpHandler = function () {
            if (placeholder) {
                placeholder.parentNode.removeChild(placeholder);
            }

            draggingEle.classList.remove('dragging');
            draggingEle.style.removeProperty('top');
            draggingEle.style.removeProperty('left');
            draggingEle.style.removeProperty('position');

            const endRowIndex = Array.from(list.children).indexOf(draggingEle);

            isDraggingStarted = false;

            list.parentNode.removeChild(list);

            let rows = Array.from(table.querySelectorAll('tr'));
            if (draggingRowIndex > endRowIndex) {
                rows[endRowIndex].parentNode.insertBefore(rows[draggingRowIndex], rows[endRowIndex]);
            } else {
                rows[endRowIndex].parentNode.insertBefore(rows[draggingRowIndex], rows[endRowIndex].nextSibling);
            }

            table.style.removeProperty('visibility');

            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
            self.OrderBy();
        };

        table.querySelectorAll('tr').forEach(function (row, index) {
            if (index === 0) {
                return;
            }
            const firstCell = row.firstElementChild;
            firstCell.classList.add('draggable');
            firstCell.addEventListener('mousedown', mouseDownHandler);
        });
    }


    LocalRender() {
        if (this.ParentListView instanceof ListView) {
            this.ParentListView.GetUserSetting(ExportCustomData.Prefix).then(x => this.UserSettingLoaded(x, true));
        }
    }

    UserSettingLoaded(res, render = true) {
        this._hasLoadSetting = true;
        this._userSetting = res[0].length > 0 ? res[0][0] : null;
        if (this._userSetting) {
            let usrHeaders = JSON.parse(this._userSetting.Value)
                .reduce((acc, x) => {
                    acc[x.Id] = x;
                    return acc;
                }, {});
            this._headers.forEach(x => {
                x.IsExport = true;
                let current = usrHeaders[x.Id];
                if (current) {
                    x.IsExport = current.IsExport;
                    x.OrderExport = current.OrderExport;
                }
            });
        }
        this._headers.sort((a, b) => a.OrderExport - b.OrderExport);
        if (!render) return;
        let content = this.FindComponentByName('Content');
        content.Element.classList.add('table');
        this._table = content.Element;
        // Rendering of headers and setting up drag-and-drop functionality
        this.RenderDetails();
        this.Move();
    }

    SetChecked(item, e) {
        item.IsExport = e.target.checked;
        this.Dirty = true;
    }

    DirtyCheckAndCancel() {
        this.Dirty = true;
        super.DirtyCheckAndCancel();
    }

    RenderDetails() {
        Html.Take(this._tbody).Clear();
        let i = 1;
        for (let item of this._headers) {
            Html.Instance.TRow.DataAttr("id", item.Id)
                .TData.DataAttr("id", item.Id).Style("padding:0").IText(i.toString(), this.EditForm.Meta.Label).End
                .TData.Style("padding:0").Checkbox(item.IsExport).Event("input", (e1) => item.IsExport = e1.target.checked).End.End
                .TData.Style("padding:0").ClassName("text-left").IText(item.Label, this.EditForm.Meta.Label).End
                .EndOf("tr");
            i++;
        }
        this.Move();
    }

    OrderBy() {
        let j = 1;
        Array.from(this._tbody.children).forEach(y => {
            const header = this._headers.find(x => x.Id === y.getAttribute("data-id"));
            if (header) {
                header.OrderExport = j;
                j++;
            }
        });
    }

    ExportAll() {
        this.Export();
    }

    ExportSelected() {
        if (this.ParentListView.SelectedIds.length === 0) {
            Toast.Warning("Select at least 1 row to export");
            return;
        }
        this.Export(null, null, this.ParentListView.SelectedIds);
    }

    Export(skip = null, pageSize = null, selectedIds = null) {
        Toast.Success("Đang xuất excel");
        if (this._hasLoadSetting && this.Dirty) {
            this.ParentListView.UpdateSetting(this._userSetting, ExportCustomData.Prefix, JSON.stringify(this._headers)).then(() => {
                this.ExportWithSetting(skip, pageSize, selectedIds);
            });
            return;
        }
        this.ParentListView.GetUserSetting(ExportCustomData.Prefix).then(x => {
            this.UserSettingLoaded(x, false);
            this.ExportWithSetting(skip, pageSize, selectedIds);
        });
    }

    ExportWithSetting(skip, pageSize, selectedIds) {
        let sql = this.ParentListView.GetSql(skip, pageSize);
        sql.Count = false;
        if (this._headers.some(x => x.IsExport)) {
            sql.FieldName = this._headers
                .filter(x => x.IsExport)
                .map(x => x.FieldText.trim() === "" ? x.FieldName : x.FieldText);
            sql.Select = this._headers.some(x => x.FieldName) ? sql.FieldName.join(", ") : null;
        }
        if (selectedIds.length > 0) {
            let ids = selectedIds.join(", ");
            sql.Where = `Id in (${ids})`;
        }
        sql.Params = this.ParentListView.Meta.Label || this.ParentListView.Meta.RefName;
        sql.Table = this.ParentListView.Meta.RefName;

        let xhrWrapper = {
            Value: JSON.stringify(sql),
            Url: Utils.ExportExcel,
            IsRawString: true,
            Method: "POST"
        };

        // @ts-ignore
        Client.Instance.SubmitAsync(xhrWrapper)
            .then(path => {
                Client.Download(`/excel/Download/${path}`);
                Toast.Success("Xuất file thành công");
            });
    }

}
