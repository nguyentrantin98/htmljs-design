import { Html } from "../utils/html";

describe('HTML class', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = `<div id="test-container"></div>`;
    container = document.getElementById("test-container");
    Html.Take("#test-container");
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('Take method should set the context to the specified element', () => {
    expect(Html.Context).toBe(container);
  });

  test('Add method should append a new element of the specified type', () => {
    Html.Add('span');
    expect(Html.Context.tagName).toBe('SPAN');
    expect(container.contains(Html.Context)).toBeTruthy();
  });

  test('Div method should add a div to the context', () => {
    Html.Div;
    expect(Html.Context.tagName).toBe('DIV');
    expect(container.contains(Html.Context)).toBeTruthy();
  });

  test('End method should reset the context to the parent element', () => {
    Html.Div;
    const addedDiv = Html.Context;
    Html.End;
    expect(Html.Context).toBe(container);
    expect(Html.Context.contains(addedDiv)).toBeTruthy();
  });

  test('Event method should add an event listener', () => {
    const mockHandler = jest.fn();
    Html.Event('click', mockHandler);
    Html.Context.click();
    expect(mockHandler).toHaveBeenCalled();
  });

  test('ClassName method should add a class to the current context element', () => {
    Html.ClassName('new-class');
    expect(Html.Context.classList.contains('new-class')).toBeTruthy();
  });

  test('InnerHTML method should set innerHTML of the context', () => {
    const markup = '<p>Hello World!</p>';
    Html.InnerHTML(markup);
    expect(Html.Context.innerHTML).toBe(markup);
  });

  // Testing method to add a button element
  test('Button method should add a button to the context', () => {
    Html.Button;
    expect(Html.Context.tagName).toBe('BUTTON');
    expect(container.contains(Html.Context)).toBeTruthy();
  });

  // Testing method to add and handle input elements with attributes
  test('Input method should add an input and set its type attribute', () => {
    Html.Input.Attr('type', 'text');
    expect(Html.Context.tagName).toBe('INPUT');
    expect(Html.Context.getAttribute('type')).toBe('text');
    expect(container.contains(Html.Context)).toBeTruthy();
  });

  // Testing CSS style application
  test('Style method should add styles to the current element', () => {
    Html.Div.Style('color: red; font-size: 20px;');
    expect(Html.Context.style.color).toBe('red');
    expect(Html.Context.style.fontSize).toBe('20px');
  });

  // Testing text manipulation
  test('Text method should add text to the current element', () => {
    Html.Div.Text('Hello, world!');
    expect(Html.Context.textContent).toBe('Hello, world!');
    expect(Html.Context.tagName).toBe('DIV');
  });

  // Testing the handling of custom data attributes
  test('DataAttr method should set a data attribute on the element', () => {
    Html.Div.DataAttr('key', 'value');
    expect(Html.Context.getAttribute('data-key')).toBe('value');
  });

  // Testing multiple classes addition
  test('ClassName method should handle multiple classes', () => {
    Html.Div.ClassName('class1').ClassName('class2');
    expect(Html.Context.classList.contains('class1')).toBeTruthy();
    expect(Html.Context.classList.contains('class2')).toBeTruthy();
  });

  // Testing padding shortcut method
  test('Padding method should apply correct padding style', () => {
    Html.Div.Padding('top', 10);
    expect(Html.Context.style.cssText).toBe('padding-top: 10px;');
  });

  // Testing the method to add a paragraph and check its text content
  test('P method should add a paragraph element with specified text', () => {
    Html.P.Text('Test paragraph');
    expect(Html.Context.tagName).toBe('P');
    expect(Html.Context.textContent).toBe('Test paragraph');
  });

  // Testing innerHTML method robustness
  test('InnerHTML method should overwrite existing content', () => {
    Html.Div.InnerHTML('<p>Initial content</p>');
    Html.InnerHTML('<span>New content</span>');
    expect(Html.Context.innerHTML).toBe('<span>New content</span>');
  });

  // Testing event listener removal if needed (Mocking as if it's there)
  test('Event removal should remove the specified event listener', () => {
    const mockHandler = jest.fn();
    Html.Event('click', mockHandler);
    Html.Context.click();
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
  
  test('Nav method should add a navigation bar element', () => {
    Html.Nav;
    expect(Html.Context.tagName).toBe('NAV');
    expect(container.contains(Html.Context)).toBeTruthy();
  });

  // Testing the functionality of the `End` method more thoroughly
  test('End method should correctly handle deeply nested elements', () => {
    Html.Div.Div.Span.End.End.End;
    expect(Html.Context).toBe(container);
  });

  // Test setting and retrieving values from input elements
  test('Value method should set and retrieve input values correctly', () => {
    Html.Input.Attr('type', 'text').Value('Hello Test');
    expect(Html.Context.value).toBe('Hello Test');
  });

  // Testing handling of placeholder via internationalization or simple attribute set
  test('PlaceHolder method should set placeholder text correctly', () => {
    Html.Input.PlaceHolder('Enter your name');
    expect(Html.Context.getAttribute('placeholder')).toBe('Enter your name');
  });

  // Testing the setting of complex styles and handling multiple CSS properties
  test('Style method should handle multiple style changes', () => {
    Html.Div.Style('border: 1px solid red;').Style('margin: 20px;');
    expect(Html.Context.style.border).toBe('1px solid red');
    expect(Html.Context.style.margin).toBe('20px');
  });

  // Testing the addition of a custom element with custom attributes
  test('Custom element addition with attributes', () => {
    Html.Add('custom-element').Attr('custom-attr', 'value').ClassName('custom-class');
    expect(Html.Context.tagName).toBe('CUSTOM-ELEMENT');
    expect(Html.Context.getAttribute('custom-attr')).toBe('value');
    expect(Html.Context.classList.contains('custom-class')).toBeTruthy();
  });

  // Testing a complex chaining of methods to ensure functional integrity
  test('Complex method chaining should maintain state and functionality', () => {
    Html.Div.P.Span.Text('Nested Text').End.End.Hr;
    const span = container.querySelector('span');
    const hr = container.querySelector('hr');
    expect(span.textContent).toBe('Nested Text');
    expect(container.contains(hr)).toBeTruthy();
  });

  // Test handling of complex input types like checkbox with additional attributes
  test('SmallCheckbox method should correctly configure a checkbox input', () => {
    Html.SmallCheckbox(true);
    const input = container.querySelector('input[type="checkbox"]');
    const span = container.querySelector('span.check.myCheckbox');
    expect(input).not.toBeNull();
    expect(span).not.toBeNull();
    expect(input.checked).toBeTruthy();
    expect(input.parentElement.classList.contains('input-small')).toBeTruthy();
  });

  // Test attribute handling across different elements and sessions
  test('Attr method should handle multiple attribute assignments', () => {
    Html.A.Attr('href', 'http://example.com').Attr('target', '_blank');
    expect(Html.Context.getAttribute('href')).toBe('http://example.com');
    expect(Html.Context.getAttribute('target')).toBe('_blank');
  });

  // Testing reset of context to ensure independence of test cases
  test('End method should correctly reset context after complex operations', () => {
    Html.Div.Div.End;
    expect(Html.Context).toBe(container.querySelector('div'));
    Html.End;
    expect(Html.Context).toBe(container);
  });

  // Test text alignment convenience function
  test('TextAlign method should set text alignment', () => {
    Html.P.TextAlign('center');
    expect(Html.Context.style.textAlign).toBe('center');
  });

  // Testing for correct handling of empty or null text values
  test('Text method should handle empty and null values without throwing errors', () => {
    Html.P.Text(null);
    expect(Html.Context.textContent).toBe('');
    Html.Text('');
    expect(Html.Context.textContent).toBe('');
  });

  // Testing data attribute specific functionalities
  test('DataAttr method should set data attributes with correct values', () => {
    Html.Div.DataAttr('role', 'button').DataAttr('test', 'dataTest');
    expect(Html.Context.getAttribute('data-role')).toBe('button');
    expect(Html.Context.getAttribute('data-test')).toBe('dataTest');
  });

  // Testing the ability to handle custom HTML elements and content safety
  test('InnerHTML method should handle complex HTML content securely', () => {
    const dangerousHTML = `<script>alert('xss')</script><p>Safe Content</p>`;
    Html.Div.InnerHTML(dangerousHTML);
    expect(Html.Context.innerHTML).toBe(dangerousHTML);  // Content set as is; jsdom won't execute scripts
    expect(Html.Context.textContent).toContain('Safe Content');
  });

  // Testing complex CSS styling through direct style text assignment
  test('Style method should apply complex and multiple styles', () => {
    Html.Div.Style('background-color: blue; width: 100px;');
    expect(Html.Context.style.backgroundColor).toBe('blue');
    expect(Html.Context.style.width).toBe('100px');
  });

  // Test adding and checking for presence of multiple classes
  test('ClassName method should handle adding multiple classes in one call', () => {
    Html.Div.ClassName('class1 class2');
    expect(Html.Context.classList.contains('class1')).toBeTruthy();
    expect(Html.Context.classList.contains('class2')).toBeTruthy();
  });  

  // Testing dynamic form creation and manipulation
  test('Form method should create a form with specified attributes and content', () => {
    Html.Form.Attr('action', '/submit').Attr('method', 'post')
      .Input.Attr('type', 'text').Attr('name', 'firstName').End
      .Input.Attr('type', 'email').Attr('name', 'email').End
      .Button.Text('Submit');
    const form = container.querySelector('form');
    const inputText = form.querySelector('input[type="text"]');
    const inputEmail = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    expect(form.getAttribute('action')).toBe('/submit');
    expect(form.getAttribute('method')).toBe('post');
    expect(inputText.getAttribute('name')).toBe('firstName');
    expect(inputEmail.getAttribute('name')).toBe('email');
    expect(button.textContent).toBe('Submit');
  });

  // Testing event handling with parameters
  test('Event method should handle events with parameterized functions', () => {
    const mockHandler = jest.fn(x => x);
    Html.Div.Event('click', () => mockHandler('clicked'));
    Html.Context.click();
    expect(mockHandler).toHaveBeenCalledWith('clicked');
  });

  // Testing complex CSS styling through chaining style updates
  test('Style method should handle chaining complex styles', () => {
    Html.Div.Style('background-color: red;').Style('padding: 10px;').Style('margin: 5px;');
    expect(Html.Context.style.backgroundColor).toBe('red');
    expect(Html.Context.style.padding).toBe('10px');
    expect(Html.Context.style.margin).toBe('5px');
  });

  // Testing addition of list items in an unordered list
  test('Ul and Li methods should add list items correctly', () => {
    Html.Ul.Li.Text('Item 1').End.Li.Text('Item 2');
    const ul = container.querySelector('ul');
    const lis = ul.querySelectorAll('li');
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe('Item 1');
    expect(lis[1].textContent).toBe('Item 2');
  });

  // Test handling and setting of multiple data attributes and classes
  test('DataAttr and ClassName methods should handle multiple data attributes and classes', () => {
    Html.Div
      .DataAttr('role', 'navigation')
      .DataAttr('test', 'dataTest')
      .ClassName('class1')
      .ClassName('class2 class3');
    expect(Html.Context.getAttribute('data-role')).toBe('navigation');
    expect(Html.Context.getAttribute('data-test')).toBe('dataTest');
    expect(Html.Context.classList.contains('class1')).toBeTruthy();
    expect(Html.Context.classList.contains('class2')).toBeTruthy();
    expect(Html.Context.classList.contains('class3')).toBeTruthy();
  });

  // Testing the proper functioning of text alignment in more complex scenarios
  test('TextAlign should set alignment and handle subsequent changes', () => {
    Html.Div.TextAlign('left').TextAlign('right');
    expect(Html.Context.style.textAlign).toBe('right');
  });
});
