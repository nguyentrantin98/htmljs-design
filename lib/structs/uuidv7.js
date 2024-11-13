import { v7 as uuidv7 } from 'uuid';
export class Uuid7 {
    static NewGuid() {
        return "-" + this.Guid();
    }
    static Guid(asOfNs = null) {
        return uuidv7();
    }

    static Id25(asOfNs = null) {
        return this.Guid();
    }
}
