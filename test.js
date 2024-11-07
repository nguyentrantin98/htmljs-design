return {
    OnSave: function (form, gridview) {
        var detail = gridview.find(x => x.IsListView && x.Meta.FieldName == "InquiryDetail");
        if ((detail && detail.AllListViewItem && detail.AllListViewItem.length > 0)) {
            var firstRow = detail.AllListViewItem[0];
            if (firstRow) {
                this.Entity.PolId = firstRow.Entity.PolId;
                this.Entity.PodId = firstRow.Entity.PodId;
                this.Entity.Pol = firstRow.Entity.Pol;
                this.Entity.Pod = firstRow.Entity.Pod;
            }
        }
        this.Entity.FormatChat = `Quote Sea - ${this.Entity.Code} - ${(this.Entity.Pol ? this.Entity.Pol.Name : "")} => ${(this.Entity.Pod ? this.Entity.Pod.Name : "")}`;
        var detailFee = gridview.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        if (detailFee && detailFee.AllListViewItem && detailFee.AllListViewItem.length > 0) {
            var otherUnitId = "00b724cc-0000-0000-8000-8cfa2cd2c643";
            if (this.EditForm.Entity.Service.Name.includes('LCL')) {
                otherUnitId = "000813c8-0000-0000-8000-0816c3e37729";
            }
            detailFee.AllListViewItem.filter(x => !x.GroupRow).forEach((item, index) => {
                item.Entity.Order = index;
                item.Entity.OtherUnitId = item.Entity.OtherUnitId || otherUnitId;
            });
        }
    },
    PrintPdf: async function (btn) {
        var rs = await this.Client.PostAsync({ ComId: btn.Meta.Id, Data: this.Entity }, "/api/CreateHtml");
    },
    ShowHideColumn2: function () {
        var summary = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary");
        if (!summary) {
            return;
        }
        var bookingDetail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        var hide = [];
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes('20'))) {
            ["Cont20"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes('LCL'))) {
            ["LCL"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("40'HC"))) {
            ["Cont40HC"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("40") && !x.Entity.Unit.Name.includes("40'HC"))) {
            ["Cont40"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("45"))) {
            ["Cont45"].forEach(x => hide.push(x));
        }
        summary.HideColumn(...hide);
    },
    ShowHideColumn: function () {
        var summary = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary2");
        if (!summary) {
            return;
        }
        var bookingDetail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        var hide = [];
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes('20'))) {
            ["Cost20", "Revenue20", "Profit20", "ProfitRate20"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes('LCL'))) {
            ["CostLCL", "RevenueLCL", "ProfitLCL", "ProfitRateLCL"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("40'HC"))) {
            ["Cost40HC", "Revenue40HC", "Profit40HC", "ProfitRate40HC"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("40") && !x.Entity.Unit.Name.includes("40'HC"))) {
            ["Cost40", "Revenue40", "Profit40", "ProfitRate40"].forEach(x => hide.push(x));
        }
        if (!bookingDetail.AllListViewItem.some(x => x.Entity.Unit && x.Entity.Unit.Name.includes("45"))) {
            ["Cost45", "Revenue45", "Profit45", "ProfitRate45"].forEach(x => hide.push(x));
        }
        summary.HideColumn(...hide);
    },
    SaveAs: function (btn) {
        var newEntity = JSON.parse(JSON.stringify(this.Entity));
        newEntity.Id = this.Uuid7.NewGuid();
        newEntity.Code = null;
        newEntity.ServiceDate = this.dayjs();
        this.Entity = newEntity;
        var config = JSON.parse(localStorage.getItem("SalesFunction"));
        this.Entity.StatusId = 1;
        this.Entity.NoApproved = config["APPROVE_QUOTATION"] ? true : false;
        var inquiryDetail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "InquiryDetail");
        if (inquiryDetail && inquiryDetail.AllListViewItem && inquiryDetail.AllListViewItem.length > 0) {
            inquiryDetail.AllListViewItem.forEach(row => {
                row.Entity.Id = this.Uuid7.NewGuid();
                row.Entity.InquiryId = newEntity.Id;
                row.Entity.StatusId = this.Entity.StatusId;
                row.Children.forEach(cell => {
                    cell.Entity = row.Entity;
                });
                row.UpdateView(true);
            });
        }

        var defaultFee = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        if (defaultFee && defaultFee.AllListViewItem.length > 0) {
            defaultFee.AllListViewItem.forEach(row => {
                row.Entity.Id = this.Uuid7.NewGuid();
                row.Entity.InquiryId = newEntity.Id;
                row.Entity.StatusId = this.Entity.StatusId;
                row.Children.forEach(cell => {
                    cell.Entity = row.Entity;
                });
                row.UpdateView(true);
            });
        }
        this.UpdateView(true);
        this.Dirty = true;
        this.Toast.Success("Save as success");
    },
    ReloadSummary: function () {
        window.setTimeout(() => {
            var detail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary");
            detail.ReloadData().then(() => {
                this.ShowHideColumn2();
            });
            var detail2 = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary2");
            detail2.ReloadData().then(() => {
                this.ShowHideColumn();
            });
        }, 500);
    },
    ReloadSummary1: function () {
        window.setTimeout(() => {
            var detail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary");
            detail.ReloadData();
            this.ShowHideColumn2();
        }, 500);
    },
    ReloadSummary2: function () {
        window.setTimeout(() => {
            var detail2 = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "Summary2");
            detail2.ReloadData();
            this.ShowHideColumn();
        }, 500);
    },
    UpdateGroupFee: function (data) {
        var defaultFee = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        data.Parent.Entity.GroupFee = data.Parent.Entity.GroupFee || (data.Entity.Description.Group ? data.Entity.Description.Group.Name : 'Local charge');
        if (data.Matched) {
            data.Parent.Entity.IsFreight = data.Matched.IsFreight;
            data.Parent.Entity.OtherUnitId = data.Matched.OtherUnitId;
            data.Parent.Entity.CurrencyId = data.Matched.CurrencyId;
            data.Parent.Entity.IsObh = data.Matched.IsObh;
        }
        defaultFee.LoadMasterData([data.Parent.Entity]).then(() => {
            data.Parent.UpdateView(false, false, "GroupFee", "OtherUnitId", "CurrencyId", "IsObh");
        });
    },
    ShowHideDetail: function () {
        this.ShowHideFreightFee();
        this.ShowHideFee();
        this.ShowHideColumn();
        this.ShowHideColumn2();
    },
    ShowHideFreightFee: function () {
        if (!this.EditForm.Entity.Service) {
            return;
        }
        this.EditForm.SetShow(!this.EditForm.Entity.Service.Name.includes('LCL'), "Show More Container");
    },
    ShowHideFee: function () {
        var detail1 = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        if (!detail1) {
            return;
        }
        if (this.EditForm.Entity.Service.Name.includes('FCL')) {
            if (this.EditForm.Entity.IsSimple) {
                detail1.HideColumn("Cost", "MinLCLCost", "MinLCLRate")
            }
            else {
                detail1.HideColumn("MinLCLCost", "MinLCLRate")
            }
        }
        else if (this.EditForm.Entity.Service.Name.includes('LCL')) {
            if (this.EditForm.Entity.IsSimple) {
                detail1.HideColumn("Cost", "MinLCLCost");
            }
            else {
                detail1.HideColumn("");
            }
        }
        else {
            if (this.EditForm.Entity.IsSimple) {
                detail1.HideColumn("Cost", "MinLCLCost", "PayeeId");
            }
            else {
                detail1.HideColumn("");
            }
        }
    },
    ChangeContainer: function (dropdown) {
        this.UpdateView(true, false, "Cont20Id", "Cont40Id", "Cont45Id", "Cont40HCId");
    },
    BeforeCreated: function (entity) {
        debugger;
        var inquiryDetail = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "InquiryDetail");
        var detail = this.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        var first = inquiryDetail.AllListViewItem[0];
        if (this.EditForm.Entity.Service.Name.includes("LCL")) {
            entity.UnitId = "002e15e8-0000-0000-8000-e7f20d394a58";
        }
        if (first != null) {
            if (!entity.RouteId) {
                entity.RouteId = `${(first.Entity.Pol.Code || '')} => ${(first.Entity.FinalDestination.Code || '')}`;
                entity.Route = {
                    Name: entity.RouteId,
                    Id: entity.RouteId,
                };
                entity.PolId = first.Entity.PolId;
                entity.Pol = first.Entity.Pol;
                entity.PodId = first.Entity.PodId;
                entity.Pod = first.Entity.Pod;
                entity.FinalDestinationId = first.Entity.FinalDestinationId;
                entity.FinalDestination = first.Entity.FinalDestination;
                entity.VendorId = first.Entity.VendorId;
            }
        }
        var lastItem = detail.AllListViewItem[detail.AllListViewItem.length - 1]
        if (lastItem) {
            entity.GroupFee = entity.GroupFee == null ? lastItem.Entity.GroupFee || '' : entity.GroupFee;
            entity.RouteId = entity.RouteId == null ? lastItem.Entity.RouteId || '' : entity.RouteId;
            entity.PolId = entity.PolId == null ? lastItem.Entity.PolId || '' : entity.PolId;
            entity.UnitId = entity.UnitId == null ? lastItem.Entity.UnitId || '' : entity.UnitId;
            entity.Unit = entity.Unit == null ? lastItem.Entity.Unit || '' : entity.Unit;
            entity.Pol = entity.Pol == null ? lastItem.Entity.Pol || '' : entity.Pol;
            entity.PodId = entity.PodId == null ? lastItem.Entity.PodId || '' : entity.PodId;
            entity.Pod = entity.Pod == null ? lastItem.Entity.Pod || '' : entity.Pod;
            entity.FinalDestinationId = entity.FinalDestinationId == null ? lastItem.Entity.FinalDestinationId || '' : entity.FinalDestinationId;
            entity.FinalDestination = entity.FinalDestination == null ? lastItem.Entity.FinalDestination || '' : entity.FinalDestination;
            entity.VendorId = entity.VendorId == null ? lastItem.Entity.VendorId || '' : entity.VendorId;
        }
    },
    CalcPrice: function (com, entity) {
        entity.TotalAmount = (entity.Quantity || new this.Decimal(0)).times(entity.Amount || new this.Decimal(0));
        entity.AmountTax = (entity.TotalAmount).times(entity.Vat || new this.Decimal(0)).div(100);
        entity.TotalAmountTax = entity.TotalAmount.plus(entity.AmountTax);
        var totalAmount = this.ChildCom.filter(x => x.IsListView)[0].AllListViewItem
            .flatMap(x => x.Entity)
            .reduce((a, b) => a.plus(b.TotalAmountTax), new this.Decimal(0));
        this.Entity.TotalAmount = totalAmount || new this.Decimal(0);
        this.UpdateView(false, false, "TotalAmount");
        com.Parent.UpdateView(false);
    },
    CheckCurrency: function (com, entity) {
        com.Parent.UpdateView(false);
    },
    OnSaveAdd: function (form, gridview) {
        this.Entity = {
            Id: this.Uuid7.NewGuid(),
            Code: null,
            StatusId: 1
        }
    },
    AddDuplicateMenu: function (form, gridview) {
        gridview.MenuItems.push({
            Icon: "fal fa-folders",
            Text: "Duplicate",
            Click: () => this.DuplicateFee(form, gridview)
        });
    },
    DuplicateFee: function (form, gridview) {
        var inquiryDetail = form.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "InquiryDetail");
        var defaultFee = form.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        var newItem = JSON.parse(JSON.stringify(defaultFee.Header.filter(x => x.FieldName == "UnitId" || x.FieldName == "RouteId")));
        newItem.forEach(item => {
            item.FieldName = "View" + item.FieldName;
            if (item.FieldName == "ViewRouteId") {
                item.Order = 0;
                this.Entity.ViewRouteId = this.Entity.ViewRouteId || (inquiryDetail.AllListViewItem[0] ? `${(inquiryDetail.AllListViewItem[0].Entity.Pol.Code || '')} => ${(inquiryDetail.AllListViewItem[0].Entity.FinalDestination.Code || '')}` : this.Entity.ViewRouteId);
            }
        })
        var form = this.EditForm.OpenConfig("Select group unit type!", () => {
            if (!form.Entity.ViewRouteId) {
                return;
            }
            var selecteds = defaultFee.AllListViewItem.filter(x => !x.GroupRow && x.Selected);
            var otherGroup = inquiryDetail.AllListViewItem.find(x => form.Entity.ViewRouteId == `${(x.Entity.Pol.Code || '')} => ${(x.Entity.FinalDestination.Code || '')}`);
            debugger;
            var newFees = JSON.parse(JSON.stringify(selecteds.map(x => x.Entity)));
            newFees.forEach(item => {
                item.Id = this.Uuid7.NewGuid();
                item.RouteId = (otherGroup.Entity.Pol.Code) + " - " + (otherGroup.Entity.FinalDestination.Code || '');
                item.PolId = otherGroup.Entity.PolId;
                item.UnitId = form.Entity.ViewUnitId;
                item.RouteId = form.Entity.ViewRouteId;
                item.Unit = null;
                item.DisableRow = false;
                item.Pol = otherGroup.Entity.Pol;
                item.PodId = otherGroup.Entity.PodId;
                item.Pod = otherGroup.Entity.Pod;
                item.FinalDestinationId = otherGroup.Entity.FinalDestinationId;
                item.FinalDestination = otherGroup.Entity.FinalDestination;
                item.VendorId = otherGroup.Entity.VendorId;
            });
            defaultFee.LoadMasterData(newFees).then(() => {
                defaultFee.ClearSelected();
                defaultFee.AddRows(newFees).then(rows => {
                    rows.forEach(row => {
                        row.Selected = true;
                    });
                    rows[0].Element.focus();
                    this.ReloadSummary();
                });
            });
        }, () => { }, true, newItem.reverse());
    },
    CreateBookingLocal: function (btn) {
        var defaultFee = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "DefaultFee");
        var inquiryDetail = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "InquiryDetail");
        var units = [...new Set(defaultFee.AllListViewItem.map(x => x.Entity.Unit).filter(x => x.Name != 'ALL'))];
        var components = [];
        var routes = inquiryDetail.AllListViewItem.filter(x => !x.GroupRow);
        var route = inquiryDetail.AllListViewItem.find(x => !x.GroupRow);
        if (routes.length > 1) {
            var routeCom = JSON.parse(JSON.stringify(defaultFee.Header.find(x => x.FieldName == "RouteId")));
            routeCom.FieldName = "ViewRouteId";
            components.push(routeCom);
        }
        var listFreight = [
            {
                Id: "1",
                Name: "FREGIHT"
            },
            {
                Id: "2",
                Name: "LOGISTICS"
            },
            {
                Id: "3",
                Name: "TRUCKING"
            }];
        var freightCom = {
            FieldName: "FreightIds",
            ComponentType: "Dropdown",
            Query: JSON.stringify(listFreight),
            FormatData: "{Name}",
            Label: "Service",
            IsMultiple: true,
            PlainText: "Select service",
            Template: JSON.stringify([{ "FieldName": "Name", "Label": "Name", "ComponentType": "Input" }])
        }
        this.EditForm.Entity.FreightIds = "1,2,3";
        components.push(freightCom);
        if (this.EditForm.Entity.Service.Name.includes("LCL")) {
            var cbmCom = JSON.parse(JSON.stringify(this.EditForm.ChildCom.find(x => x.Meta.FieldName == "CBM").Meta));
            components.push(cbmCom);
        }
        else {
            var unitCom = JSON.parse(JSON.stringify(defaultFee.Header.find(x => x.FieldName == "UnitId")));
            unitCom.IsMultiple = true;
            unitCom.FieldName = "UnitIds";
            unitCom.RefName = null;
            unitCom.Query = JSON.stringify(units);
            components.push(unitCom);
        }
        this.EditForm.Entity.UnitIds = units.map(x => x.Id).join(",");
        var form = this.EditForm.OpenConfig("Please double check async booking local!", () => {
            if (routes.length > 1) {
                route = inquiryDetail.AllListViewItem.find(x => !x.GroupRow && x.Entity.PolId == this.Entity.ViewRoute.PolId && x.Entity.PodId == this.Entity.ViewRoute.PodId);
            }
            if (!route) {
                return;
            }
            let shipper = this.EditForm.Entity.Shipper || this.EditForm.Entity.Customer;
            let shipperText = "";
            if (shipper) {
                if (shipper.Name) shipperText += shipper.Name + "\n";
                if (shipper.Address) shipperText += shipper.Address + "\n";
                if (shipper.ContactName) shipperText += shipper.ContactName + "\n";
                if (shipper.ContactPhoneNumber) shipperText += shipper.ContactPhoneNumber + "\n";
            }
            let consigneText = "";
            let consignee = this.EditForm.Entity.Consignee;
            if (consignee) {
                if (consignee.Name) consigneText += consignee.Name + "\n";
                if (consignee.Address) consigneText += consignee.Address + "\n";
                if (consignee.ContactName) consigneText += consignee.ContactName + "\n";
                if (consignee.ContactPhoneNumber) consigneText += consignee.ContactPhoneNumber + "\n";
            }
            var featureName = "sea-booking-local-editor";
            var config = JSON.parse(localStorage.getItem("SalesFunction"));
            var booking = {
                Id: this.Uuid7.NewGuid(),
                ServiceId: this.EditForm.Entity.ServiceId,
                CreatedOn: this.dayjs().format('YYYY-MM-DD'),
                CustomerId: this.EditForm.Entity.CustomerId,
                CommodityId: this.EditForm.Entity.CommodityId,
                ShipmentTypeId: this.EditForm.Entity.ShipmentTypeId,
                AgentIdText: this.EditForm.Entity.AgentIdText,
                AgentId: this.EditForm.Entity.AgentId,
                ShipperId: this.EditForm.Entity.ShipperId || this.EditForm.Entity.CustomerId,
                SaleId: this.EditForm.Entity.Customer ? this.EditForm.Entity.Customer.SaleId : null,
                ShipperText: shipperText.trim(),
                ConsigneeId: this.EditForm.Entity.ConsigneeId,
                ConsigneeText: consigneText.trim(),
                PolId: route.Entity.PolId,
                PodId: route.Entity.PodId,
                EtdDate: this.EditForm.Entity.EtdDate,
                EtaDate: this.EditForm.Entity.EtaDate,
                PickupAddress: this.EditForm.Entity.Pickup,
                DeliveryAddress: this.EditForm.Entity.Delivery,
                PortTransitId: route.Entity.ViaId,
                FinalDestinationId: route.Entity.FinalDestinationId,
                SpecialRequest: this.EditForm.Entity.Subject,
                PlaceDeliveryId: route.Entity.PlaceDeliveryId,
                UnitId: this.EditForm.Entity.UnitId,
                Quantity: this.EditForm.Entity.Quantity,
                GW: this.EditForm.Entity.GW,
                CW: this.EditForm.Entity.CW,
                CBM: this.EditForm.Entity.CBM,
                StatusId: 1,
                NoApproved = config["APPROVE_BOOKINGLOCAL"] ? true : false,
                DemFree: this.EditForm.Entity.DemFree,
                DetFree: this.EditForm.Entity.DetFree,
                PkEmptyId: this.EditForm.Entity.PkEmptyId,
                ContPickupAtId: this.EditForm.Entity.PkEmptyId,
                ReturnsId: this.EditForm.Entity.ReturnsId,
                TypeId: 6,
                VoucherTypeId: 3,
                CreatedOn: this.dayjs().format('YYYY-MM-DD')
            }
            var bookingTransit = [{
                Id: this.Uuid7.NewGuid(),
                BookingId: booking.Id,
                PortTransitId: route.Entity.ViaId
            }]
            booking.BookingTransit = bookingTransit;
            if (route.Entity.Vendor.PartnerTypeIdsText && route.Entity.Vendor.PartnerTypeIdsText.toUpperCase().includes('AGENT')
                && route.Entity.Vendor.ResidenceTypeIdText && route.Entity.Vendor.ResidenceTypeIdText.toUpperCase().includes('OVERSEA')) {
                booking.AgentId = route.VendorId;
                booking.VendorId = route.CarrierId;
            }
            else {
                booking.AgentId = null;
                booking.VendorId = route.Entity.VendorId;
                booking.CarrierId = route.Entity.CarrierId;
            }
            var inquiryContainer = this.EditForm.ChildCom.find(x => x.IsListView && x.Meta.FieldName == "EntityContainer");
            var items = inquiryContainer.AllListViewItem.map(x => x.Entity);
            var newItems = JSON.parse(JSON.stringify(items));
            if (this.EditForm.Entity.Service.Name.includes('General')) {
                var selectUnitIds = this.EditForm.ChildCom.find(x => x.Meta.FieldName == 'UnitIds');
                var check = this.EditForm.Entity.UnitIdsText.includes('LCL');
                if (route.Entity.Pol.IsLocal) {
                    booking.ServiceId = 3;//Sea Export FCL
                    if (check) {
                        booking.ServiceId = 5;//Sea Export LCL
                    }
                }
                else {
                    booking.ServiceId = 4;//Sea Import FCL
                    if (check) {
                        booking.ServiceId = 6;//Sea Import LCL
                    }
                }
            }
            newItems.forEach(item => {
                item.Id = this.Uuid7.NewGuid();
                item.BookingId = booking.Id;
            })
            booking.EntityContainer = newItems;
            var bookingDetail = [];
            var sellingRate = JSON.parse(JSON.stringify(defaultFee.AllListViewItem.filter(x => x.Entity.PolId == route.Entity.PolId && x.Entity.PodId == route.Entity.PodId && !x.GroupRow && x.Entity.Rate && x.Entity.Rate.greaterThan(0)).map(x => x.Entity)));
            var buyingRate = JSON.parse(JSON.stringify(defaultFee.AllListViewItem.filter(x => x.Entity.PolId == route.Entity.PolId && x.Entity.PodId == route.Entity.PodId && !x.GroupRow && x.Entity.Cost && x.Entity.Cost.greaterThan(0)).map(x => x.Entity)));
            if (!this.EditForm.Entity.Service.Name.includes("LCL")) {
                sellingRate = sellingRate.filter(x => this.EditForm.Entity.UnitIds.includes(x.UnitId) || x.Unit.Name == 'ALL');
                buyingRate = buyingRate.filter(x => this.EditForm.Entity.UnitIds.includes(x.UnitId) || x.Unit.Name == 'ALL');
            }
            if (!this.EditForm.Entity.FreightIds.includes('1')) {
                sellingRate = sellingRate.filter(x => !x.IsFreight && (!x.IsLogistics || !x.IsTrucking));
                buyingRate = buyingRate.filter(x => !x.IsFreight && (!x.IsLogistics || !x.IsTrucking));
                if (this.EditForm.Entity.FreightIds.includes('2')) {
                    booking.TypeId = 9;
                    if (this.EditForm.Entity.Service.Name.includes('Sea Import')) {
                        booking.ServiceId = 4;
                    }
                    else if (this.EditForm.Entity.Service.Name.includes('Sea Export')) {
                        booking.ServiceId = 3;
                    }
                    else if (this.EditForm.Entity.Service.Name.includes('Air Export')) {
                        booking.ServiceId = 1;
                    }
                    else if (this.EditForm.Entity.Service.Name.includes('Air Import')) {
                        booking.ServiceId = 2;
                    }
                    featureName = "logistics-booking-local-editor";
                }
            }
            if (!this.EditForm.Entity.FreightIds.includes('2')) {
                sellingRate = sellingRate.filter(x => !x.IsLogistics);
                buyingRate = buyingRate.filter(x => !x.IsLogistics);
            }
            if (!this.EditForm.Entity.FreightIds.includes('3')) {
                sellingRate = sellingRate.filter(x => !x.IsTrucking);
                buyingRate = buyingRate.filter(x => !x.IsTrucking);
            }
            if (this.EditForm.Entity.FreightIds == '3') {
                booking.ServiceId = 13;
                booking.TypeId = 8;
                featureName = "trucking-booking-local-editor";
            }
            buyingRate.forEach(item => {
                item.Id = this.Uuid7.NewGuid();
                item.BookingId = booking.Id;
                if (!item.IsContainer) {
                    item.UnitId = item.OtherUnitId;
                }
                item.Amount = this.Decimal(item.Cost || 0);
                item.VendorId = item.PayeeId || route.Entity.VendorId;
                item.IsBuying = true;
                if (item.IsCBM) {
                    item.Quantity = !item.Quantity ? this.Decimal.max(this.Decimal(this.EditForm.Entity.CBM || 1), this.Decimal(item.MinLCLCost || 1)) : this.Decimal(item.Quantity);
                }
                else {
                    item.Quantity = item.Quantity ? this.Decimal(item.Quantity) : this.Decimal(1)
                }
                item.TotalAmount = (item.Quantity || this.Decimal(0)).times(item.Amount || new this.Decimal(0));
                item.AmountTax = (item.TotalAmount).times(this.Decimal(item.Vat || 0)).div(100);
                item.TotalAmountTax = item.TotalAmount.plus(item.AmountTax);
                bookingDetail.push(item);
            });
            sellingRate.forEach(item => {
                item.Id = this.Uuid7.NewGuid();
                item.BookingId = booking.Id;
                if (!item.IsContainer) {
                    item.UnitId = item.OtherUnitId;
                }
                item.Amount = this.Decimal(item.Rate || 0);
                item.VendorId = item.PayerId || this.EditForm.Entity.CustomerId;
                if (item.IsCBM) {
                    item.Quantity = !item.Quantity ? this.Decimal.max(this.Decimal(this.EditForm.Entity.CBM || 1), this.Decimal(item.MinLCLRate || 1)) : this.Decimal(item.Quantity);
                }
                else {
                    item.Quantity = item.Quantity ? this.Decimal(item.Quantity) : this.Decimal(1)
                }
                item.TotalAmount = (item.Quantity || this.Decimal(0)).times(item.Amount || new this.Decimal(0));
                item.AmountTax = (item.TotalAmount).times(this.Decimal(item.Vat || 0)).div(100);
                item.TotalAmountTax = item.TotalAmount.plus(item.AmountTax);
                bookingDetail.push(item);
            });
            booking.BookingDetail = bookingDetail.sort((a, b) => {
                const vendorCompare = a.VendorId.localeCompare(b.VendorId);
                if (vendorCompare !== 0) {
                    return vendorCompare;
                }
                return b.Amount - a.Amount;
            });
            this.OpenPopup(featureName, booking);
        }, () => { }, true, components);
    }
}