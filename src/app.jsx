import { EditForm } from "../lib";
import { Page } from "../lib";
import React from "react";

export class App {
  static Main() {
    var app = new Page();
    app.EditForm = new EditForm("home");
    app.EditForm.Policies = [
      {
        CanRead: true,
      },
    ];
    app.Meta.Layout = () => (
      <>
        <div className="wrapper">
          <div className="box-shadow" data-name="Test"></div>
          <div className="box-shadow datetime-picker" data-name="Test1"></div>
          <div className="box-shadow" data-name="Test3"></div>
          <div className="box-shadow" data-name="Test4"></div>
        </div>
      </>
    );
    app.Meta.Components = [
      {
        ComponentType: "Input",
        FieldName: "Test",
        Id: "1",
      },
      {
        ComponentType: "Datepicker",
        FieldName: "Test1",
        Id: "1",
      },
      {
        ComponentType: "Number",
        FieldName: "Test3",
        Id: "1",
      },
      {
        ComponentType: "Dropdown",
        FieldName: "Test4",
        FormatData: "{Label}",
        Id: "1",
        LocalQuery: [
          {
            Id: "1",
            Label: "Test",
          },
        ],
        Columns: [
          {
            FieldName: "Id",
            Id: 0,
            Label: "Id",
            ComponentType: "Input",
          },
          {
            FieldName: "Label",
            Label: "Label",
            Id: 1,
            ComponentType: "Input",
          },
        ],
      },
    ];
    app.Render();
  }
}
App.Main();
