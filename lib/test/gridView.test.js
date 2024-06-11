import { GridView } from '../gridView'; // Adjust the path according to your project structure
import { ListViewSection } from '../section';
import { ListViewSearch } from '../listViewSearch';
import { Client } from "../clients/client";
import { Utils } from "../utils/utils";
import { Html } from "../utils/html";
import { ObservableList } from '../models/observableList.js';

describe('GridView', () => {
  /** @type {GridView} */
  let gridView,
    container, meta;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    meta = {
      Id: 'testGridView',
      IsSumary: true,
      IsCollapsible: false,
      CanSearch: true,
      ComponentType: 'GridView',
      Editable: true,
      CanAdd: true,
      DefaultAddStart: { HasValue: false },
      DefaultAddEnd: { HasValue: false },
      PopulateField: '',
      Events: {},
      Label: 'Test GridView',
      IsRealtime: false,
      CanCache: true,
      LocalRender: false,
      TopEmpty: false,
    };

    gridView = new GridView(meta);
    gridView.ParentElement = container;
    gridView.EditForm = {
      UpdateView: jest.fn(), GetElementPolicies: () => [],
      Meta: { FeaturePolicy: [] }, ResizeListView: () => { }
    }; // Mock EditForm

    // Initialize sections with a non-null Element
    gridView.MainSection = new ListViewSection(document.createElement('div'));
    gridView.EmptySection = new ListViewSection(document.createElement('div'));
    gridView.HeaderSection = new ListViewSection(document.createElement('div'));
    gridView.FooterSection = new ListViewSection(document.createElement('div'));
    gridView.MainSection.Element = document.createElement('div');
    gridView.EmptySection.Element = document.createElement('div');
    gridView.HeaderSection.Element = document.createElement('div');
    gridView.FooterSection.Element = document.createElement('div');
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  test('constructor initializes properties correctly', () => {
    expect(gridView.Meta).toEqual(meta);
    expect(gridView.SummaryClass).toBe("summary");
    expect(gridView.CellCountNoSticky).toBe(50);
    expect(gridView._summarys).toEqual([]);
  });

  test('DOMContentLoadedHandler calls AddSummaries and PopulateFields', () => {
    const addSummariesSpy = jest.spyOn(gridView, 'AddSummaries');
    const populateFieldsSpy = jest.spyOn(gridView, 'PopulateFields');

    gridView.DOMContentLoadedHandler();

    expect(addSummariesSpy).toHaveBeenCalled();
    expect(populateFieldsSpy).toHaveBeenCalled();
  });

  test('PopulateFields calls UpdateView with correct arguments', () => {
    gridView.Meta.PopulateField = 'field1,field2';
    const updateViewSpy = jest.spyOn(gridView.EditForm, 'UpdateView');

    gridView.PopulateFields();

    expect(updateViewSpy).toHaveBeenCalledWith(true, ['field1', 'field2']);
  });

  test('Rerender calls necessary methods and updates LoadRerender', () => {
    gridView.Header = [{ Hidden: false }, { Hidden: true }];
    gridView.RenderTableHeader = jest.fn();
    gridView.AddNewEmptyRow = jest.fn();
    gridView.RenderContent = jest.fn();
    gridView.StickyColumn = jest.fn();
    gridView.DisposeNoRecord = jest.fn();
    gridView.RenderIndex = jest.fn();

    gridView.Rerender();

    expect(gridView.LoadRerender).toBe(true);
    expect(gridView.RenderTableHeader).toHaveBeenCalledWith([{ Hidden: false }]);
    expect(gridView.AddNewEmptyRow).toHaveBeenCalled();
    expect(gridView.RenderContent).toHaveBeenCalled();
    expect(gridView.StickyColumn).toHaveBeenCalledWith(gridView);
    expect(gridView.RenderIndex).toHaveBeenCalled();
  });

  test('StickyColumn sticks elements correctly', () => {
    // Mock data
    const rows = [
      { Meta: { Frozen: true }, Element: document.createElement('div') },
      { Meta: { Frozen: false }, Element: document.createElement('div') }
    ];

    // Mocking Html.Take and its Sticky method
    const stickyMock = jest.fn().mockReturnThis();
    const htmlTakeSpy = jest.spyOn(Html, 'Take').mockReturnValue({
      Sticky: stickyMock
    });

    // Mocking the FilterChildren method
    rows.FilterChildren = jest.fn().mockReturnValue(rows.filter(x => x.Meta && x.Meta.Frozen));

    // Execute StickyColumn
    gridView.StickyColumn(rows);

    // Expect Html.Take to be called
    expect(htmlTakeSpy).toHaveBeenCalled();
    // Expect the Sticky method to be called with the correct parameters
    expect(stickyMock).toHaveBeenCalledWith({ left: "0" });

    // Clean up
    htmlTakeSpy.mockRestore();
  });


  test('AddSections initializes sections correctly', () => {
    gridView.AddSections();

    expect(gridView.MainSection).toBeInstanceOf(ListViewSection);
    expect(gridView.FooterSection).toBeInstanceOf(ListViewSection);
    expect(gridView.EmptySection).toBeInstanceOf(ListViewSection);
    expect(gridView.HeaderSection).toBeInstanceOf(ListViewSection);
  });

  test('ClickHeader applies background color to column', () => {
    // Tạo bảng và các hàng
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const tr1 = document.createElement('tr');
    const th1 = document.createElement('th');
    const td1 = document.createElement('td');
    tr1.appendChild(th1);
    tr1.appendChild(td1);
    tbody.appendChild(tr1);

    const tr2 = document.createElement('tr');
    const td2 = document.createElement('td');
    const td3 = document.createElement('td');
    tr2.appendChild(td2);
    tr2.appendChild(td3);
    tbody.appendChild(tr2);

    document.body.appendChild(table);

    // Thiết lập mock cho closest và querySelectorAll
    th1.closest = jest.fn().mockReturnValue(th1);
    th1.parentElement.querySelectorAll = jest.fn().mockReturnValue([th1, td1]);
    const e = { target: th1 };

    gridView.DataTable = table;
    gridView.LastNumClick = null; // Đảm bảo nó là null cho lần chạy đầu tiên

    // Gọi ClickHeader
    gridView.ClickHeader(e);

    expect(td1.style.backgroundColor).toBe("rgb(203, 220, 194)");
    expect(td1.style.color).toBe("rgb(0, 0, 0)");
    expect(td2.style.backgroundColor).toBe("rgb(203, 220, 194)");
    expect(td2.style.color).toBe("rgb(0, 0, 0)");
    expect(td3.style.backgroundColor).toBe("rgb(203, 220, 194)");
    expect(td3.style.color).toBe("rgb(0, 0, 0)");

    // Xóa bảng khỏi tài liệu sau khi kiểm tra
    document.body.removeChild(table);
  });

  test('FocusOutHeader removes background color from column', () => {
    gridView.LastNumClick = 0;
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    tr.appendChild(td);
    table.appendChild(tr);
    gridView.DataTable = table;

    gridView.FocusOutHeader({}, {});

    expect(td.style.backgroundColor).toBe("");
  });

  test('FilterInSelected sets up ConfirmDialog correctly', () => {
    const hotKeyModel = {
      Operator: 1,
      FieldName: 'testField'
    };
    const header = { Name: 'testField', Label: 'Test Field', ComponentType: 'Textbox' };
    gridView.Header = [header];
    const localStorageMock = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    const confirmDialogMock = {
      Render: jest.fn()
    };
    gridView.ConfirmDialog = jest.fn().mockReturnValue(confirmDialogMock);

    gridView.FilterInSelected(hotKeyModel);

    expect(localStorageMock.getItem).toHaveBeenCalledWith('LastSearch' + gridView.Meta.Id + header.Name);
    expect(confirmDialogMock.Render).toHaveBeenCalled();
  });

  test('AddSummaries skips when no summary headers', () => {
    gridView.Header = [{ Summary: '' }, { Summary: null }];

    const mainSectionElement = document.createElement('div');
    mainSectionElement.classList.add(gridView.SummaryClass);
    gridView.MainSection = { Element: mainSectionElement, DisposeChildren: jest.fn() };
    gridView.AddSummaries();

    expect(gridView.MainSection.DisposeChildren).not.toHaveBeenCalled();
  });

  test('AddRow updates content correctly', async () => {
    const rowData = { id: '1', name: 'Test' };
    gridView.MainSection = { Element: document.createElement('tbody'), Children: [] };
    gridView.RenderRowData = jest.fn().mockReturnValue({
      PatchModel: [],
      Element: document.createElement('tr')
    });

    // Mocking the FilterChildren method
    const rows = [
      { Meta: { Frozen: true }, Element: document.createElement('div') },
      { Meta: { Frozen: false }, Element: document.createElement('div') }
    ];
    rows.FilterChildren = jest.fn().mockReturnValue(rows.filter(x => x.Meta && x.Meta.Frozen));

    await gridView.AddRow(rowData);

    expect(gridView.RenderRowData).toHaveBeenCalled();
    expect(gridView.StickyColumn).toHaveBeenCalledWith(rows);
  });


  test('RenderContent handles empty data correctly', () => {
    gridView.Meta.LocalRender = true;
    gridView.RowData = new ObservableList([]);
    gridView.Header = [{FieldName: 'testField'}];
    gridView.ParentElement = container ?? document.body;
    gridView.Render();
    gridView.RenderContent();

    expect(gridView.MainSection.DisposeChildren).toHaveBeenCalled();
  });


  // test('SetRowData updates data and calls RenderContent', () => {
  //   gridView.RowData = { _data: [] };
  //   gridView.RenderContent = jest.fn();

  //   const listData = [{ id: '1', name: 'Test' }];
  //   gridView.SetRowData(listData);

  //   expect(gridView.RowData._data).toEqual(listData);
  //   expect(gridView.RenderContent).toHaveBeenCalled();
  // });
});
