export class PatchDetail {
  Field = "";
  Label = "";
  OldVal = "";
  Value = "";
}

/**
 * Represents a set of changes to be applied to a data entity.
 */
export class PatchVM {
  /** @type {string} */
  ComId;
  /** @type {string} */
  Table;
  /** @type {PatchDetail[]} */
  Changes = [];
}
/**
 * Represents a set of changes to be applied to a data entity.
 */
export class SavePatchVM {
  /** @type {any[][]} */
  Detail;
  /** @type {string} */
  Table;
  /** @type {string} */
  ReasonOfChange;
  /** @type {any[]} */
  Changes = [];
  /** @type {any[]} */
  Delete = [];
  /** @type {SavePatchVM} */
  Child;
}
