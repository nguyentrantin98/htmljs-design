import { SecurityVM } from "../models/securityVM.js";
import { TabEditor } from "../tabEditor.js";

export class SecurityBL extends TabEditor {
    /**
     * Initializes a new instance of the SecurityBL class.
     */
    constructor() {
        super("FeaturePolicy");
        this.Popup = true;
        this.Name = "SecurityEditor";
        this.Title = "Permissions";
        this.Icon = "mif-security";
    }

    /**
     * Gets the Security view model entity.
     * @returns {SecurityVM | null} The security entity if it exists.
     */
    get Security() {
        return this.Entity instanceof SecurityVM ? this.Entity : null;
    }
}

export class SecurityEditorBL extends TabEditor {
    /**
     * Initializes a new instance of the SecurityEditorBL class.
     */
    constructor() {
        super("FeaturePolicy");
        this.Popup = true;
        this.Name = "CreateSecurity";
        this.Title = "Permissions";
        this.Icon = "mif-security";
        document.addEventListener("DOMContentLoaded", this.CheckAllPolicy.bind(this));
    }

    /**
     * @type {SecurityVM | null} The security entity
     */
    // @ts-ignore
    Entity;

    /**
     * Sets all permissions based on the AllPermission flag.
     */
    CheckAllPolicy() {
        const security = this.Entity;
        if (security) {
            security.CanDelete = security.AllPermission;
            security.CanDeactivate = security.AllPermission;
            security.CanRead = security.AllPermission;
            security.CanWrite = security.AllPermission;
            security.CanShare = security.AllPermission;
            this.FindComponentByName("Properties").UpdateView();
        }
    }

    /**
     * Checks if all permissions are true to set AllPermission flag.
     */
    CheckPolicy() {
        const security = this.Entity;
        if (security) {
            security.AllPermission = security.CanDeactivate && security.CanDelete && security.CanRead && security.CanShare && security.CanWrite;
            this.FindComponentByName("Properties").UpdateView();
        }
    }
}
