debugger;
const vndAmount = this.Meta.ChildHeader.reduce((sum, header) => {
    const fieldValue = this.Entity[header.FieldName] || 0;
    return sum + Number(fieldValue);
}, 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
return vndAmount == '0' ? '' : vndAmount;