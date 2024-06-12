export default class ExcelExt {
    static ExportTableToExcel(tableId, filename, table = null, border = false) {
        if (border) {
            table.querySelectorAll('td').forEach(x => {
                x.style = "border:1px solid; white-space: nowrap; font-family: 'times new roman', times, serif;";
            });
            table.querySelectorAll('th').forEach(x => {
                x.style = "border:1px solid; white-space: nowrap; font-family: 'times new roman', times, serif;";
            });
        }

        const dataType = "application/vnd.ms-excel";
        const extension = ".xls";
        const base64 = function(s) {
            return window.btoa(unescape(encodeURIComponent(s)));
        };
        const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';
        const render = function(template, content) {
            return template.replace(/{(\w+)}/g, (m, p) => content[p]);
        };

        let tableElement = table || document.getElementById(tableId);
        let tableExcel = render(template, {
            worksheet: filename,
            table: tableElement.innerHTML
        });

        filename += extension;

        // Using the 'in' operator to check for the method existence
        if ('msSaveOrOpenBlob' in navigator) {
            let blob = new Blob(
                ['\ufeff', tableExcel],
                { type: dataType }
            );
            navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            let downloadLink = document.createElement("a");
            document.body.appendChild(downloadLink);
            downloadLink.href = 'data:' + dataType + ';base64,' + base64(tableExcel);
            downloadLink.download = filename;
            downloadLink.click();
        }

        if (border) {
            table.querySelectorAll('td').forEach(x => {
                x.style = "";
            });
            table.querySelectorAll('th').forEach(x => {
                x.style = "";
            });
        }
    }
}
