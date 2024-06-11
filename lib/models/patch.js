export class PatchDetail {
    Field = "";
    Label = "";
    OldVal = "";
    Value = "";
    HistoryValue = "";
  }
  
  /**
   * Represents a set of changes to be applied to a data entity.
   */
  export class PatchVM {
      /** @type {string} */
    FeatureId;
      /** @type {string} */
      ComId;
      /** @type {string} */
      Table;
      /** @type {string} */
      DeletedIds;
      /** @type {string} */
      QueueName;
      /** @type {string} */
      CacheName;
      /** @type {string} */
      MetaConn;
      /** @type {string} */
      DataConn;
      /** @type {PatchDetail[]} */
      Changes = [];
  
    /**
     * Gets the entity identifier from the first applicable change.
     * @returns {string|null} The entity identifier.
     */
    get EntityId() {
      const firstIdChange = this.Changes.find(x => x.Field === Utils.IdField);
      return firstIdChange ? firstIdChange.Value : null;
    }
  
    /**
     * Sets the old identifier in the change list.
     * @param {string} value - The old identifier value to set.
     */
    set OldId(value) {
      let idChange = this.Changes.find(x => x.Field === Utils.IdField);
      if (idChange) {
        idChange.OldVal = value;
      } else {
        this.Changes.push(new PatchDetail(Utils.IdField, '', value, '', ''));
      }
    }
  }
  