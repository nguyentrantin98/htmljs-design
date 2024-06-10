const OdataExt = {
    TopKeyword: "$top=",
    FilterKeyword: "$filter=",
    OrderByKeyword: "$orderby=",
    QuestionMark: "?",

    RemoveClause: function(DataSourceFilter, clauseType = this.FilterKeyword, removeKeyword = false) {
        if (!DataSourceFilter || !DataSourceFilter.trim()) {
            return "";
        }

        let noClauseQuery = DataSourceFilter;
        const clauseIndex = DataSourceFilter.lastIndexOf(clauseType);

        if (clauseIndex >= 0) {
            const fromFilter = DataSourceFilter.substring(clauseIndex);
            let endClauseIndex = fromFilter.indexOf("&");
            endClauseIndex = endClauseIndex === -1 ? fromFilter.length : endClauseIndex;
            noClauseQuery = DataSourceFilter.substring(0, clauseIndex) +
                            fromFilter.substring(endClauseIndex);
        }
        const endChar = noClauseQuery[noClauseQuery.length - 1];
        if (noClauseQuery.length > 0 && (endChar === '&' || endChar === '?')) {
            noClauseQuery = noClauseQuery.substring(0, noClauseQuery.length - 1);
        }
        return removeKeyword ? noClauseQuery.replace(clauseType, "") : noClauseQuery;
    },

    GetClausePart: function(DataSourceFilter, clauseKeyword = this.FilterKeyword) {
        const clauseIndex = DataSourceFilter.lastIndexOf(clauseKeyword);
        if (clauseIndex >= 0) {
            const clause = DataSourceFilter.substring(clauseIndex);
            let endClauseIndex = clause.indexOf("&");
            endClauseIndex = endClauseIndex === -1 ? clause.length : endClauseIndex;
            return clause.substring(clauseKeyword.length, endClauseIndex - clauseKeyword.length).trim();
        }
        return "";
    },

    GetOrderByPart: function(dataSourceFilter) {
        const filterIndex = dataSourceFilter.lastIndexOf(this.OrderByKeyword);
        if (filterIndex >= 0) {
            const filter = dataSourceFilter.substring(filterIndex);
            let endFilterIndex = filter.indexOf("&");
            endFilterIndex = endFilterIndex === -1 ? filter.length : endFilterIndex;
            return filter.substring(this.OrderByKeyword.length, endFilterIndex - this.OrderByKeyword.length).trim();
        }
        return "";
    },

    AppendClause: function(DataSourceFilter, clauseValue, clauseKeyword = this.FilterKeyword) {
        if (!clauseValue || !clauseValue.trim()) {
            return DataSourceFilter;
        }

        if (!DataSourceFilter || !DataSourceFilter.trim()) {
            DataSourceFilter = "";
        }

        if (!DataSourceFilter.includes(this.QuestionMark)) {
            DataSourceFilter += this.QuestionMark;
        }

        const originalFilter = this.GetClausePart(DataSourceFilter, clauseKeyword);
        let index;
        if (!originalFilter || !originalFilter.trim()) {
            DataSourceFilter += DataSourceFilter.indexOf("?") < 0 ? clauseKeyword : "&" + clauseKeyword;
            index = DataSourceFilter.length;
        } else {
            index = DataSourceFilter.indexOf(originalFilter) + originalFilter.length;
        }
        const finalStatement = DataSourceFilter.substring(0, index) + clauseValue + DataSourceFilter.substring(index);
        return finalStatement;
    },

    ApplyClause: function(DataSourceFilter, clauseValue, clauseKeyword = this.FilterKeyword) {
        const statement = this.RemoveClause(DataSourceFilter, clauseKeyword, true);
        return this.AppendClause(statement, clauseValue, clauseKeyword);
    }
};
