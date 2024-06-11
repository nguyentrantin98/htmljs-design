import { ElementType } from '../models/elementType';
import { Section } from '../section'; // Adjust the path according to your project structure

describe('Section', () => {
  let container;

  beforeEach(() => {
    // Set up a DOM element as a render target
    container = document.createElement('div');
    container.Id = 'abc';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up on exiting
    document.body.removeChild(container);
    container = null;
  });

  test('should render content correctly', () => {
    // Assume Section's Render method adds a div with class 'section-content'
    const section = new Section(null, container);
    // @ts-ignore
    section.Meta = { Id: 'abc' };
    section.Render(); // You need to adjust this method call according to your actual API

    // Use jest-dom for more expressive assertions
    expect(container.id).toBe('abc');
  });

  test('should only render children when condition is met', () => {
    const section = new Section(ElementType.div);
    section.ParentElement = container; // Assume this property controls whether children are rendered
    section.Render();
  
    expect(container.innerHTML).toBe('<div></div>');
  });
  
  test('should apply dynamic styles correctly', () => {
    const section = new Section(ElementType.div);
    section.Meta = { Id: 'abc', Html: '<div></div>', Css: '#abc { backgroundColor: "blue" }'}; // Assume dynamic styling can be applied
    section.ParentElement = container;
    section.Render();
    const style = document.head.querySelector(`#${section.Meta.Id}`);
    expect(style != null).toBe(true);
  });

  test('should clean up resources on destruction', () => {
    const section = new Section(ElementType.div);
    section.ParentElement = container;
    section.Render();
    section.Dispose(); // Assume destroy method handles cleanup
    expect(container.innerHTML).toBe('');
  });

  test('should properly manage child components', () => {
    const section = new Section(ElementType.div);
    section.ParentElement = container;
    const childComponent = { Render: jest.fn(), ToggleShow: jest.fn(), ToggleDisabled: jest.fn() };
    section.AddChild(childComponent);
    section.Render();
  
    expect(childComponent.Render).toHaveBeenCalled();
  });  
});
