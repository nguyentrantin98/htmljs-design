/**
 * Class to generate UUID7 based identifiers.
 */
export class Uuid7 {

    /**
     * Gets the current time in nanoseconds.
     * @returns {number} The current time in nanoseconds.
     */
    static TimeNs() {
        return 100 * new Date().getTime();
    }


    static NewGuid() {
        return "-" + this.Guid();
    }
    /**
     * Generates a GUID based on the current or specified time.
     * @param {number|null} asOfNs - The specific nanosecond timestamp to use for GUID generation or null for current time.
     * @returns {string} A new GUID string.
     */
    static Guid(asOfNs = null) {
        const maxSeqValue = 0x3FFF;
        let ns;
        if (asOfNs === null)
            ns = this.TimeNs();
        else if (asOfNs === 0)
            return "00000000-0000-0000-0000-000000000000";
        else
            ns = asOfNs;

        let x = BigInt(ns);
        let y = BigInt(x / 16000000000n);
        let rest1 = x % 16000000000n;
        let z = BigInt(rest1 * 0x10000n / 16000000000n);
        let rest2 = rest1 * 0x10000n % 16000000000n;

        let seq;
        if (asOfNs !== null) {
            if (x === this._x && y === this._y && z === this._z) {
                if (this._seq < maxSeqValue)
                    this._seq += 1;
            } else {
                this._seq = 0;
                this._x = x;
                this._y = y;
                this._z = z;
            }
            seq = this._seq;
        } else {
            if (x === this._x_asOf && y === this._y_asOf && z === this._z_asOf) {
                if (this._seq_asOf < maxSeqValue)
                    this._seq_asOf += 1;
            } else {
                this._seq_asOf = 0;
                this._x_asOf = x;
                this._y_asOf = y;
                this._z_asOf = z;
            }
            seq = this._seq_asOf;
        }

        let last8Bytes = new Uint8Array(8);
        crypto.getRandomValues(last8Bytes);
        last8Bytes[0] = (2 << 6) | (seq >> 8);
        last8Bytes[1] = seq & 0xFF;

        let bytes = new Uint8Array(16);
        bytes.set(new Uint32Array([Number(x), Number(y), Number(z)]));
        bytes.set(last8Bytes, 8);

        return [
            this._toHex(bytes[3], 2),
            this._toHex(bytes[2], 2),
            this._toHex(bytes[1], 2),
            this._toHex(bytes[0], 2),
            "-",
            this._toHex(bytes[5], 2),
            this._toHex(bytes[4], 2),
            "-",
            this._toHex(bytes[7], 2),
            this._toHex(bytes[6], 2),
            "-",
            this._toHex(bytes[8], 2),
            this._toHex(bytes[9], 2),
            "-",
            this._toHex(bytes[10], 2),
            this._toHex(bytes[11], 2),
            this._toHex(bytes[12], 2),
            this._toHex(bytes[13], 2),
            this._toHex(bytes[14], 2),
            this._toHex(bytes[15], 2)
        ].join("");
    }

    /**
     * Converts a byte into a hex string of specified length.
     * @param {number} byte - The byte to convert.
     * @param {number} length - The length of the resulting hex string.
     * @returns {string} The hex string.
     */
    static _toHex(byte, length) {
        let hex = byte.toString(16);
        return hex.padStart(length, "0");
    }

    /**
     * Generates a string representation of a UUID.
     * @param {number|null} asOfNs - The specific nanosecond timestamp to use, or null to use current time.
     * @returns {string} A UUID string.
     */
    static String(asOfNs = null) {
        return this.Guid(asOfNs);
    }

    /**
     * Generates a 25-character alphanumeric ID from a GUID.
     * @param {number|null} asOfNs - The specific nanosecond timestamp to use, or null to use current time.
     * @returns {string} A 25-character ID.
     */
    static Id25(asOfNs = null) {
        let guid = this.Guid(asOfNs);
        return this.Id25Internal(guid);
    }

    /**
     * Internal method to convert a GUID into a 25-character alphanumeric ID.
     * @param {string} guid - The GUID to convert.
     * @returns {string} A 25-character ID.
     */
    static Id25Internal(guid) {
        const alphabet = "0123456789abcdefghijkmnopqrstuvwxyz";
        let id25_chars = new Array(25);

        let arr = new Uint8Array(guid.length);
        for (let i = 0; i < guid.length; i++) {
            arr[i] = guid.charCodeAt(i);
        }

        let rest = this.ArrToBigInt(arr);
        let rem;
        let divisor = BigInt(alphabet.length);

        for (let pos = 24; pos >= 0; pos--) {
            [rest, rem] = [rest / divisor, rest % divisor];
            id25_chars[pos] = alphabet[Number(rem)];
        }

        return id25_chars.join("");
    }

    /**
     * Converts an array of bytes to a BigInt.
     * @param {Uint8Array} arr - The byte array to convert.
     * @returns {BigInt} The BigInt representation.
     */
    static ArrToBigInt(arr) {
        return arr.reduce((acc, val) => (acc << 8n) | BigInt(val), 0n);
    }

    /**
     * Evaluates the precision of the system clock by counting unique nanosecond timestamps.
     * @returns {string} A message describing the timing precision.
     */
    static CheckTimingPrecision() {
        let distinctValues = new Set();
        let numLoops = 0;
        let start = Date.now();
        while (Date.now() - start < 500 && numLoops < 1000) {
            distinctValues.add(this.TimeNs());
            numLoops += 1;
        }

        let numSamples = distinctValues.size;
        let actualPrecisionNs = 1e6 * (Date.now() - start) / numSamples;
        let maxPrecisionNs = 1e6 * (Date.now() - start) / numLoops;

        if (numSamples === numLoops)
            return `Precision is ${actualPrecisionNs.toFixed(0)}ns with no repeats in ${numLoops} loops taking ${Date.now() - start}ms`;
        else
            return `Precision is ${actualPrecisionNs.toFixed(0)}ns rather than ${maxPrecisionNs.toFixed(0)}ns (${numSamples} unique timestamps from ${numLoops} loops taking ${Date.now() - start}ms)`;
    }
}
