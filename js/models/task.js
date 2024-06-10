export class TaskNotification {
    /** @type {string} */
    Id;

    /** @type {string} */
    Title;

    /** @type {string} */
    Description;

    /** @type {string} */
    EntityId;

    /** @type {string} */
    RecordId;

    /** @type {Date} */
    Deadline;

    /** @type {string} */
    StatusId;

    /** @type {string} */
    Attachment;

    /** @type {string} */
    AssignedId;

    /** @type {string} */
    RoleId;

    /** @type {number} */
    TimeConsumed;

    /** @type {number} */
    TimeRemained;

    /** @type {number} */
    Progress;

    /** @type {number | null} */
    RemindBefore;

    /** @type {boolean} */
    Active;

    /** @type {Date} */
    InsertedDate;

    /** @type {string} */
    InsertedBy;

    /** @type {Date | null} */
    UpdatedDate;

    /** @type {string} */
    UpdatedBy;

    /** @type {string} */
    Badge;

    /** @type {Object} */
    Entity;

    constructor() {
        this.Id = '';
        this.Title = '';
        this.Description = '';
        this.EntityId = '';
        this.RecordId = '';
        this.Deadline = new Date();
        this.StatusId = '';
        this.Attachment = '';
        this.AssignedId = '';
        this.RoleId = '';
        this.TimeConsumed = 0;
        this.TimeRemained = 0;
        this.Progress = 0;
        this.RemindBefore = null;
        this.Active = false;
        this.InsertedDate = new Date();
        this.InsertedBy = '';
        this.UpdatedDate = null;
        this.UpdatedBy = '';
        this.Badge = '';
        this.Entity = {};
    }
}
