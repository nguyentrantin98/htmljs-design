import Swal from "sweetalert2";
/**
 * Options for creating a toast notification.
 * @typedef {Object} ToastOptions
 * @property {number} Timeout - The duration before the toast disappears.
 * @property {string} ClassName - CSS class for styling the toast.
 * @property {string} Message - The message to display in the toast.
 * @property {Array} Params - Additional parameters for the message.
 */

/**
 * Provides functionalities to create different types of toast notifications.
 */
export class Toast {
    /**
     * Creates a toast notification with specific options.
     * @param {ToastOptions} options - Options for the toast.
     */
    static Create(options) {
        var toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: options.Timeout,
        });
        toast.fire({
            icon: options.ClassName,
            title: options.Message,
        })
    }

    /**
     * Creates a success toast.
     * @param {string} message - Message to display.
     * @param {number} [timeout=2500] - Duration before the toast disappears.
     * @param {...any} parameters - Additional parameters.
     */
    static Success(message, timeout = 2500, ...parameters) {
        Toast.Create({
            ClassName: 'success',
            Timeout: timeout,
            Icon: 'fal fa-check',
            Message: message,
            Params: parameters
        });
    }

    /**
     * Creates a warning toast.
     * @param {string} message - Message to display.
     */
    static Warning(message, ...parameters) {
        Toast.Create({
            ClassName: 'warning',
            Icon: 'fal fa-exclamation-triangle',
            Timeout: 2500000,
            Message: message,
            Params: parameters
        });
    }

    /**
     * Creates an error toast.
     * @param {string} message - Message to display.
     * @param {undefined[]} parameters
     */
    static Error(message, ...parameters) {
        Toast.Create({
            ClassName: 'error',
            Timeout: 2500,
            Message: message,
            Params: parameters
        });
    }

    /**
     * Creates a small toast notification.
     * @param {string} message - Message to display.
     * @param {number} [timeout=2500] - Duration before the toast disappears.
     */
    static Small(message, timeout = 2500) {
        // @ts-ignore
        Toast.Create({
            ClassName: 'sm-tran',
            Timeout: timeout,
            Message: message,
        });
    }
}
