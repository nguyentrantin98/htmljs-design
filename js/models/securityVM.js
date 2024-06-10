import { FeaturePolicy } from "./featurePolicy.js";

export class SecurityVM extends FeaturePolicy {
    AllPermission = false;
    /** @type {string[]} */
    RecordIds = [];
    get StrRecordIds() {
        return this.RecordIds.map(x => `"${x}"`).join();
    }
    /** @type {FeaturePolicy[]} */
    FeaturePolicy = [];
}