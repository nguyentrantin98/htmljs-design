/**
* Represents a wrapper around an XMLHttpRequest (XHR) object, providing additional functionality and configuration options.
*
* The `XHRWrapper` class encapsulates the properties and methods necessary to make HTTP requests, handle responses, and provide customization options.
*
* @property {boolean} AllowNested - Determines whether nested requests are allowed.
* @property {boolean} NoQueue - Indicates whether the request should bypass the queue.
* @property {boolean} Retry - Specifies whether the request should be retried on failure.
* @property {boolean} ShowError - Determines whether errors should be displayed.
* @property {boolean} AllowAnonymous - Indicates whether anonymous requests are allowed.
* @property {boolean} AddTenant - Specifies whether the tenant information should be added to the request.
* @property {string} Method - The HTTP method to be used for the request (default is 'GET').
* @property {string} Url - The URL for the request.
* @property {string} NameSpace - The namespace for the request.
* @property {string} Prefix - The prefix for the request.
* @property {string} EntityName - The name of the entity for the request.
* @property {string} FinalUrl - The final URL for the request, including any necessary modifications.
* @property {string} ResponseMimeType - The expected MIME type of the response.
* @property {any} Value - The value to be sent with the request.
* @property {boolean} IsRawString - Indicates whether the `Value` property should be treated as a raw string.
* @property {Map<string, string>} Headers - The headers to be included in the request.
* @property {FormData} FormData - The form data to be sent with the request.
* @property {File} File - The file to be sent with the request.
* @property {function} ProgressHandler - A callback function to handle progress events.
* @property {function} CustomParser - A custom parser function for the response.
* @property {function} ErrorHandler - A custom error handling function.
*
* @constructor
*/
class XHRWrapper {
    AllowNested = false;
    NoQueue = false;
    /** @type {boolean?} */
    Retry = false;
    /** @type {boolean?} */
    ShowError = true;
    AllowAnonymous = false;
    AddTenant = false;
    Method = 'GET'; // Default HTTP method
    /** @type {string} */
    Url = '';
    NameSpace = '';
    Prefix = '';
    EntityName = '';
    FinalUrl = '';
    ResponseMimeType = '';
    Value = null;
    IsRawString = false;

    constructor() {
        /** @type {any} */
        this.Headers = {};
        this.FormData = null;
        this.File = null;
        this.ProgressHandler = null;
        this.CustomParser = null;
        this.ErrorHandler = null;
    }

    get JsonData() {
        if (this.Value === null) {
            return null;
        }
        if (this.IsRawString && typeof this.Value === 'string') {
            return this.Value;
        }
        return JSON.stringify(this.Value);
    }

    static UnboxValue(val) {
        if (val === null) return null;
        let res = {};
        for (let key in val) {
            if (key === null || key[0] === '$') continue;
            let item = val[key];
            if (item !== null && item !== undefined) {
                const type = typeof item;
                let isSimple = (type === 'number' || type === 'boolean' || type === 'string') ||
                    (item instanceof Date) || 
                    (typeof item === 'object' && Object.prototype.toString.call(item) === '[object Date]') || 
                    (item.constructor.name === 'Date') || 
                    (type === 'object' && (item.toString() === '[object Date]')) || 
                    (!isNaN(parseFloat(item)) && isFinite(item));
    
                if (isSimple) {
                    res[key] = item;
                }
            }
        }
        return res;
    }
}
