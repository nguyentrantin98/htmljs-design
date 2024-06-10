import { TabGroup, TabComponent } from '../tabComponent';
import { Html } from '../utils/html';

describe('TabGroup', () => {
    let tabGroup;

    beforeEach(() => {
        tabGroup = new TabGroup();
        tabGroup.Meta = { IsVertialTab: false, Children: [] };
        tabGroup.ParentElement = document.createElement('div');
    });

    test('should initialize TabGroup with default values', () => {
        expect(tabGroup.ListViewType).toEqual(["ListView", "GroupListView", "GridView", "GroupGridView"]);
        expect(tabGroup.Ul).toBeNull();
        expect(tabGroup.TabContent).toBeNull();
        expect(tabGroup.ShouldCountBage).toBe(false);
        expect(tabGroup.HasRendered).toBe(false);
    });

    test('should render TabGroup with horizontal tabs', () => {
        tabGroup.Render();
        expect(tabGroup.Ul).toBeInstanceOf(HTMLUListElement);
        expect(tabGroup.Element).toBeInstanceOf(HTMLDivElement);
        expect(tabGroup.TabContent).toBeInstanceOf(HTMLDivElement);
    });
});

describe('TabComponent', () => {
    let tabComponent;
    let mockGroup;

    beforeEach(() => {
        mockGroup = {
            FieldName: 'TestTab',
            Id: 'test-id',
            Icon: 'test-icon',
            Label: 'Test Label',
            Description: 'Test Description',
            Events: []
        };
        tabComponent = new TabComponent(mockGroup);
        tabComponent.Parent = { Children: [tabComponent] };
        tabComponent.Meta = mockGroup;
        tabComponent.EditForm = {
            GetElementPolicies: jest.fn().mockReturnValue([{ CanRead: true }]),
            ResizeListView: jest.fn()
        };
    });

    test('should initialize TabComponent with default values', () => {
        expect(tabComponent.Meta).toEqual(mockGroup);
        expect(tabComponent.Name).toBe(mockGroup.FieldName);
        expect(tabComponent._li).toBeNull();
        expect(tabComponent.HasRendered).toBe(false);
        expect(tabComponent._badge).toBe("");
        expect(tabComponent.BadgeElement).toBeNull();
        expect(tabComponent._displayBadge).toBe(false);
    });

    test('should render TabComponent', () => {
        tabComponent.Parent = new TabGroup();
        tabComponent.Parent.Ul = document.createElement('ul');
        tabComponent.Render();
        expect(tabComponent._li).toBeInstanceOf(HTMLLIElement);
        expect(tabComponent.HasRendered).toBe(false);
    });

    test('should render TabComponent with badge', () => {
        tabComponent.Parent = new TabGroup();
        tabComponent.Parent.Ul = document.createElement('ul');
        tabComponent.Render();
        expect(tabComponent.BadgeElement).not.toBeNull();
        tabComponent.DisplayBadge = true;
        expect(tabComponent.BadgeElement.style.display).toBe('block');
    });

    test('should set and get badge', () => {
        tabComponent.Badge = 'New Badge';
        expect(tabComponent.Badge).toBe('New Badge');
    });

    test('should set and get display badge', () => {
        tabComponent.DisplayBadge = true;
        expect(tabComponent.DisplayBadge).toBe(true);
    });

    test('should focus on TabComponent', () => {
        tabComponent.Parent = new TabGroup();
        tabComponent.Parent.Children = [tabComponent]; 
        tabComponent.ParentElement = document.createElement('div');
        tabComponent.Render();
        tabComponent.Focus();
        expect(tabComponent.Show).toBe(true);
    });
});
