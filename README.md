# HTMJS

HTMJS library FE

## Installation

Use the package manager [npm](https://www.npmjs.com/package/htmljs-code) to install foobar.

```bash
npm i htmljs-code --save
```

## Usage

```javascript
import 'htmljs-code/lib/css/fontawesome.min.css'
import 'htmljs-code/lib/css/datepicker.css'
import 'htmljs-code/lib/css/number.css'
import 'htmljs-code/lib/css/input.css'
import 'htmljs-code/lib/css/section.css'
import { Datepicker, Textbox, Textarea } from "htmljs-code";

# 'Datepicker'
var com2 = new Datepicker({
    FieldName: "Datepicker",
    ParentElement: document.body
    
});
com2.Render();

# 'Textbox'
var com1 = new Textbox({
    FieldName: "Textbox",
    ParentElement: document.body
});
com1.Render();

# 'Numbox'
var com = new Numbox({
    FieldName: "Numbox",
    ParentElement: document.body
});
com.Render();
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)