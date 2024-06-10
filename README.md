# HTMJS

HTMJS library FE

## Installation

Use the package manager [npm](https://www.npmjs.com/package/htmljs-code) to install foobar.

```bash
npm i htmljs-code --save
```

## Usage

```javascript
import 'htmljs-code/dist/style.css'
import { Datepicker } from "htmljs-code";

# 'Datepicker'
var com2 = new Datepicker({
    FieldName: "Datepicker"
});
com2.ParentElement = document.querySelector(".datepicker");
com2.Render();

# 'Textbox'
var com1 = new Textbox({
    FieldName: "Textbox"
});
com1.ParentElement = document.querySelector(".datepicker");
com1.Render();

# 'Numbox'
var com = new Numbox({
    FieldName: "Numbox"
});
com.ParentElement = document.querySelector(".datepicker");
com.Render();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)