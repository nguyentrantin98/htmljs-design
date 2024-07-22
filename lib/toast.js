import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { LangSelect } from './utils/langSelect';

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
     * Creates a success toast.
     * @param {string} message - Message to display.
     * @param {number} [timeout=2500] - Duration before the toast disappears.
     * @param {...any} parameters - Additional parameters.
     */
    static Success(message, timeout = 2500, ...parameters) {
        toast.success(LangSelect.Get(message), {
            position: "top-right",
            autoClose: timeout,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
    }

    /**
     * Creates a warning toast.
     * @param {string} message - Message to display.
     */
    static Warning(message, timeout = 2500, ...parameters) {
        toast.warning(LangSelect.Get(message), {
            position: "top-right",
            autoClose: timeout,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
    }
}
