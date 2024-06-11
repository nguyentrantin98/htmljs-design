import { Page } from "../lib/page";
import React from "react";

export class App {
  static Main() {
    var app = new Page();
    app.Meta.Layout = () => (
      <>
        <div className="tab-item" data-name="Test"></div>
        <div className="tab-item" data-name="Test1"></div>
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
    ];
    app.Render();
  }
}
App.Main();
