import { Client } from "../clients/client.js";
/**
 * Represents a view model for SQL operations.
 */
export class SqlViewModel {
  /**
   * @type {string}
   * @description Service ID.
   */
  SvcId = "";

  /**
   * @type {string}
   * @description Company ID.
   */
  ComId = "";

  /**
   * @type {string}
   * @description Action to perform.
   */
  Action = "";

  /**
   * @type {string}
   * @description Parameters for the action.
   */
  Params = "";

  /**
   * @type {string[]}
   * @description Array of IDs.
   */
  Ids = [];

  /**
   * @type {string}
   * @description Anonymous tenant.
   */
  AnnonymousTenant = Client.Tenant;

  /**
   * @type {string}
   * @description Anonymous environment.
   */
  AnnonymousEnv = Client.Env;

  /**
   * @type {string}
   * @description Paging information.
   */
  Paging = "";

  /**
   * @type {string}
   * @description SELECT clause.
   */
  Select = "";

  /**
   * @type {string}
   * @description WHERE clause.
   */
  Where = "";

  /**
   * @type {string}
   * @description ORDER BY clause.
   */
  OrderBy = "";

  /**
   * @type {string}
   * @description GROUP BY clause.
   */
  GroupBy = "";

  /**
   * @type {string}
   * @description HAVING clause.
   */
  Having = "";

  /**
   * @type {boolean}
   * @description Indicates whether to include COUNT operation.
   */
  Count = false;

  /**
   * @type {string[]}
   * @description Array of field names.
   */
  FieldName = [];

  /**
   * @type {boolean}
   * @description Indicates whether to skip XQuery.
   */
  SkipXQuery = false;

  /**
   * @type {number}
   * @description Meta connection string.
   */
  Skip = 0;

  /**
   * @type {number}
   * @description Meta connection string.
   */
  Top = 0;

  /**
   * @type {string}
   * @description Meta connection string.
   */
  MetaConn = Client.MetaConn;

  /**
   * @type {string}
   * @description Data connection string.
   */
  DataConn = Client.DataConn;

  /**
   * @type {string}
   * @description Name of the table.
   */
  Table = "";

  /**
   * @type {boolean}
   * @description Indicates whether to wrap the query.
   */
  WrapQuery = true;
}
