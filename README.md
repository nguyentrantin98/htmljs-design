# HTMJS

HTMJS library FE

## Installation

Use the package manager [npm](https://www.npmjs.com/package/htmljs-code) to install foobar.

```bash
npm i htmljs-code --save
```

## Usage

```bash
npm i htmljs-code react --save
```

```javascript
import "htmljs-code/lib/css/fontawesome.min.css";
import "htmljs-code/lib/css/datepicker.css";
import "htmljs-code/lib/css/number.css";
import "htmljs-code/lib/css/input.css";
import "htmljs-code/lib/css/section.css";
import "htmljs-code/lib/css/gridview.css";
import "htmljs-code/lib/css/main.css";
import "htmljs-code/lib/css/dropdown.css";

import { EditForm, Page } from "htmljs-code";
import React from "react";

export class App {
  static Main() {
    var app = new Page();
    app.EditForm = new EditForm("home");
    app.EditForm.Policies = [
      {
        CanRead: true,
      },
    ];
    app.Meta.Layout = () => (
      <>
        <div className="wrapper">
          <div className="box-shadow" data-name="Test"></div>
          <div className="box-shadow datetime-picker" data-name="Test1"></div>
          <div className="box-shadow" data-name="Test3"></div>
          <div className="box-shadow" data-name="Test4"></div>
        </div>
      </>
    );
    app.Meta.Components = [
      {
        ComponentType: "Input",
        FieldName: "Test",
        Id: "1",
      },
      {
        ComponentType: "Datepicker",
        FieldName: "Test1",
        Id: "1",
      },
      {
        ComponentType: "Number",
        FieldName: "Test3",
        Id: "1",
      },
      {
        ComponentType: "Dropdown",
        FieldName: "Test4",
        FormatData: "{Label}",
        Id: "1",
        LocalQuery: [
          {
            Id: "1",
            Label: "Test",
          },
        ],
        Columns: [
          {
            FieldName: "Id",
            Id: 0,
            Label: "Id",
            ComponentType: "Input",
          },
          {
            FieldName: "Label",
            Label: "Label",
            Id: 1,
            ComponentType: "Input",
          },
        ],
      },
    ];
    app.Render();
  }
}
App.Main();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
