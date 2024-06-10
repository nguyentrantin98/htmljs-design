import { Client } from "../clients/client.js";

/**
 * Represents an email view model that encapsulates the email data.
 */
export class EmailVM {
    /**
     * Initializes a new instance of the EmailVM class with default values.
     */
    constructor() {
        /** @type {string} Connection key, default value fetched from Client.MetaConn */
        this.ConnKey = Client.MetaConn;

        /** @type {string} Email from address */
        this.FromAddress = '';

        /** @type {Array<string>} List of email addresses to send the email to */
        this.ToAddresses = [];

        /** @type {Array<string>} List of email addresses for CC */
        this.CC = [];

        /** @type {Array<string>} List of email addresses for BCC */
        this.BCC = [];

        /** @type {string} Subject of the email */
        this.Subject = '';

        /** @type {string} Body content of the email */
        this.Body = '';

        /** @type {Array<string>} Texts that will be converted to PDF */
        this.PdfText = [];

        /** @type {Array<string>} Names of the files */
        this.FileName = [];

        /** @type {Set<string>} Collection of attachment identifiers */
        this.Attachements = new Set();
    }
}