export class ValidationRule {
    static Required = "required";
    static MinLength = "minLength";
    static CheckLength = "checkLength";
    static MaxLength = "maxLength";
    static GreaterThanOrEqual = "min";
    static LessThanOrEqual = "max";
    static GreaterThan = "gt";
    static LessThan = "lt";
    static Equal = "eq";
    static NotEqual = "ne";
    static RegEx = "regEx";
    static Unique = "unique";

    constructor(rule, message, value1, value2, condition, rejectInvalid) {
        this.Rule = rule;
        this.Message = message;
        this.Value1 = value1;
        this.Value2 = value2;
        this.Condition = condition;
        this.RejectInvalid = rejectInvalid;
    }
}
