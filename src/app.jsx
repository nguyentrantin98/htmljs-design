import React from "react";
import { ToastContainer } from "react-toastify";
import {
  Page,
  EditForm,
  Feature,
  ComponentExt,
  ChromeTabs,
  LangSelect,
  Client,
  EditableComponent,
} from "../lib/index.js";
import { Spinner } from "../lib/spinner.js";
import { LoginBL } from "./forms/login.jsx";
import "./slimselect.css";
import "./index.css";
import AppComponent from "./AppComponent.jsx";

export class App {
  /** @type {Page} */
  static MyApp;
  /** @type {App} */
  static _instance;
  /** @type {App} */
  static get Instance() {
    if (!this._instance) {
      this._instance = new App();
    }
    return this._instance;
  }
  /** @type {Feature} */
  Meta;
  constructor() {
    this.Meta = new Feature();
    this.Meta.ParentElement = document.getElementById("app");
    this.Meta.Layout = () => {
      return <AppComponent editForm={this.MyApp.EditForm} />;
    };
    this.MyApp = new Page();
    this.MyApp.EditForm = new EditForm("MyApp");
    this.MyApp.EditForm.Policies = [
      {
        CanRead: true,
      },
    ];
    this.MyApp.Meta = this.Meta;
    this.MyApp.EditForm.Meta = this.Meta;
  }

  async getExchangeRate() {
    var rate = await fetch(
      "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx"
    );
    const xmlString = await rate.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const json = this.extractExchangeRates(xmlDoc);
    json.push({
      CurrencyCode: "VND",
      CurrencyName: "VND",
      Buy: "1",
      Transfer: "1",
      Sell: "1",
    });
    const ext = json.reduce((acc, cur) => {
      acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(
        cur.Transfer.replace(/,/g, "")
      );
      return acc;
    }, {});
    var usd = this.MyApp.EditForm.Decimal(
      json.find((x) => x.CurrencyCode == "USD").Transfer.replace(/,/g, "")
    );
    const ext1 = json.reduce((acc, cur) => {
      const eurToUsdRate = this.MyApp.EditForm.Decimal(1).div(
        this.MyApp.EditForm.Decimal(cur.Transfer.replace(/,/g, ""))
      ); // Tỷ giá EUR => USD
      if (cur.CurrencyCode == "VND") {
        const multipliedRate = eurToUsdRate.mul(usd);
        acc[cur.CurrencyCode] =
          this.MyApp.EditForm.Decimal(1).div(multipliedRate);
      } else {
        if (cur.CurrencyCode == "USD") {
          acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(1);
        } else {
          const multipliedRate = eurToUsdRate.mul(usd);
          acc[cur.CurrencyCode] = multipliedRate;
        }
      }
      return acc;
    }, {});
    EditableComponent.ExchangeRateVND = ext;
    localStorage.setItem("ExchangeRateVND", JSON.stringify(ext));
    EditableComponent.ExchangeRateUSD = ext1;
    localStorage.setItem("ExchangeRateUSD", JSON.stringify(ext1));
  }

  async Init() {
    var data = await fetch(Client.api + "/api/dictionary");
    var rs = await data.json();
    try {
      var config = await fetch(Client.api + "/api/webConfig");
      var rsConfig = await config.json();
      const map = rsConfig.reduce((acc, cur) => {
        acc[cur.Id] = cur.Value;
        return acc;
      }, {});
      LangSelect._webConfig = map;
    } catch {
      localStorage.setItem("ConfigNumber", 3);
    }
    try {
      var saleFunction = await fetch(Client.api + "/api/salesFunction");
      var rsSaleFunction = await saleFunction.json();
      const mapSaleFunction = rsSaleFunction.reduce((acc, cur) => {
        acc[cur.Code] = cur.IsYes;
        return acc;
      }, {});
      localStorage.setItem("SalesFunction", JSON.stringify(mapSaleFunction));
    } catch {}
    localStorage.setItem("Dictionary", JSON.stringify(rs));
    const cul = localStorage.getItem("Culture") || "en";
    const map = rs
      .filter((x) => x.LangCode == cul)
      .reduce((acc, cur) => {
        acc[cur.Key] = cur.Value;
        return acc;
      }, {});
    if (!LangSelect.Culture) {
      LangSelect.Culture = cul;
    }
    LangSelect._dictionaries = map;
    localStorage.setItem(LangSelect.Culture, JSON.stringify(map));
    Spinner.Init();
    if (Client.Token) {
      Client.GetToken(Client.Token)
        .then((token) => {
          Client.Token = token;
          LoginBL.Instance.Render();
        })
        .catch(() => {
          this.removeUser();
        });
    } else {
      LoginBL.Instance.Render();
    }
  }

  extractExchangeRates(xmlDoc) {
    const exchangeRates = [];
    const exrateElements = xmlDoc.getElementsByTagName("Exrate");

    for (let i = 0; i < exrateElements.length; i++) {
      const exrate = exrateElements[i];
      const rate = {
        CurrencyCode: exrate.getAttribute("CurrencyCode"),
        CurrencyName: exrate.getAttribute("CurrencyName").trim(),
        Buy: exrate.getAttribute("Buy"),
        Transfer: exrate.getAttribute("Transfer"),
        Sell: exrate.getAttribute("Sell"),
      };
      exchangeRates.push(rate);
    }

    return exchangeRates;
  }

  removeUser() {
    Client.Token = null;
    localStorage.removeItem("UserInfo");
    LoginBL.Instance.Render();
  }

  async RenderLayout() {
    await this.MyApp.Render();
    var el = document.querySelector(".chrome-tabs");
    if (el != null) {
      ChromeTabs.init(el);
    }
    this.LoadByFromUrl();
    await this.getExchangeRate();
    var dataExt = await fetch(Client.api + "/api/exchangeRate");
    var rsExt = await dataExt.json();
    const ext2 = rsExt.reduce((acc, cur) => {
      acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(cur.RateSaleVND);
      return acc;
    }, {});
    const ext3 = rsExt.reduce((acc, cur) => {
      acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(cur.RateSaleUSD);
      return acc;
    }, {});
    EditableComponent.ExchangeRateSaleVND = ext2;
    EditableComponent.ExchangeRateSaleUSD = ext3;
    localStorage.setItem("ExchangeRateSaleVND", JSON.stringify(ext2));
    localStorage.setItem("ExchangeRateSaleUSD", JSON.stringify(ext3));
    //
    const ext4 = rsExt.reduce((acc, cur) => {
      acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(cur.RateProfitVND);
      return acc;
    }, {});
    const ext5 = rsExt.reduce((acc, cur) => {
      acc[cur.CurrencyCode] = this.MyApp.EditForm.Decimal(cur.RateProfitUSD);
      return acc;
    }, {});
    EditableComponent.ExchangeRateProfitVND = ext4;
    EditableComponent.ExchangeRateProfitUSD = ext5;
    localStorage.setItem("ExchangeRateProfitVND", JSON.stringify(ext4));
    localStorage.setItem("ExchangeRateProfitUSD", JSON.stringify(ext5));
    window.setInterval(async () => {
      await this.getExchangeRate();
    }, 60 * 60 * 1000);
  }

  LoadByFromUrl() {
    var fName = this.GetFeatureNameFromUrl() || { pathname: "", params: null };
    if (fName.pathname == "") {
      return;
    }
    ComponentExt.InitFeatureByName(fName.pathname, true).then((tab) => {
      window.setTimeout(() => {
        if (fName.params.Id) {
          Client.Instance.GetByIdAsync(tab.Meta.EntityId, [
            fName.params.Id,
          ]).then((data) => {
            if (data && data.data && data.data[0]) {
              tab.OpenPopup(fName.params.Popup, data.data[0]);
              window.setTimeout(() => {
                if (fName.params.Popup2) {
                  var popup = tab.Children.find((x) => x.Popup);
                  Client.Instance.SubmitAsync({
                    Url: `/api/feature/getFeature`,
                    Method: "POST",
                    JsonData: JSON.stringify({
                      Name: fName.params.Popup2,
                    }),
                  }).then((item) => {
                    Client.Instance.GetByIdAsync(item.EntityId, [
                      fName.params.Id2,
                    ]).then((data2) => {
                      if (data2.data[0]) {
                        popup.OpenPopup(fName.params.Popup2, data2.data[0]);
                      }
                    });
                  });
                }
              }, 500);
            }
          });
        }
      }, 700);
    });
    return fName;
  }

  /**
   * @returns {string | null}
   */
  GetFeatureNameFromUrl() {
    let hash = window.location.hash; // Get the full hash (e.g., '#/chat-editor?Id=-00612540-0000-0000-8000-4782e9f44882')

    if (hash.startsWith("#/")) {
      hash = hash.replace("#/", ""); // Remove the leading '#/'
    }

    if (!hash.trim() || hash == undefined) {
      return null; // Return null if the hash is empty or undefined
    }

    let [pathname, queryString] = hash.split("?"); // Split the hash into pathname and query string
    let params = new URLSearchParams(queryString); // Parse the query string into a URLSearchParams object
    if (pathname.includes("/")) {
      let segments = pathname.split("/");
      pathname = segments[segments.length - 1] || segments[segments.length - 2];
    }
    return {
      pathname: pathname || null, // Pathname (e.g., 'chat-editor')
      params: Object.fromEntries(params.entries()), // Query parameters (e.g., { Id: '-00612540-0000-0000-8000-4782e9f44882' })
    };
  }
}
App.Instance.Init();
