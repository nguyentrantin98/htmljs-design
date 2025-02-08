import { SqlViewModel } from "../models/sqlViewModel.js";
import { Client } from "../clients/client.js";
import { Str } from "./ext.js";

export class LangSelect {
    static LangProp = "langprop";
    static LangKey = "langkey";
    static LangParam = "Para";
    static LangCode = "langcode";
    static Active = "Active";
    static _webConfig = {};
    static _dictionaries = {};

    static _culture;

    static get Culture() {
        if (LangSelect._culture !== undefined && LangSelect._culture !== null) {
            return LangSelect._culture.replace("\"", "");
        }
        const res = localStorage.getItem("Culture");
        if (res !== null) {
            LangSelect._culture = res.replace("\"", "");
        }
        return res !== null ? res.replace("\"", "") : null;
    }

    static set Culture(value) {
        if (LangSelect._culture === value) {
            return;
        }
        LangSelect._culture = value !== null ? value.replace("\"", "") : null;
        localStorage.setItem("Culture", value !== null ? value.replace("\"", "") : null);
    }

    static SetCultureAndTranslate(code) {
        LangSelect.Culture = code;
        LangSelect.Translate();
    }

    /** @returns {string} key Label */
    static Get(key, featureName) {
        if (key === null || key === "") {
            return "";
        }
        if (LangSelect.Culture === null) {
            return key;
        }
        const dictionary = LangSelect._dictionaries;
        if (dictionary === undefined || dictionary === null) {
            const tempDictionary = localStorage.getItem(LangSelect.Culture);
            if (tempDictionary !== null) {
                LangSelect._dictionaries = tempDictionary;
            }
        }
        if (dictionary[key + "_" + featureName]) {
            return dictionary[key + "_" + featureName] ? dictionary[key + "_" + featureName] : key;
        }
        else {
            return dictionary[key] ? dictionary[key] : key;
        }
    }

    static async Translate() {
        var data = await fetch(Client.api + "/api/dictionary");
        var items = await data.json();
        LangSelect.DictionaryLoaded(items);
    }

    static DictionaryLoaded(dictionaryItems) {
        const map = dictionaryItems.filter((x, i, arr) => arr.findIndex(y => y.Key === x.Key) === i).reduce((acc, cur) => {
            acc[cur.Key] = cur.Value;
            return acc;
        }, {});
        LangSelect._dictionaries = map;
        localStorage.setItem(LangSelect.Culture, JSON.stringify(map));
        LangSelect.Travel(document).forEach(x => {
            const props = x[LangSelect.LangProp];
            if (props === null || props === undefined || props === "") {
                return;
            }
            props.split(",").forEach(propName => {
                const template = x[LangSelect.LangKey + propName];
                const parameters = x[LangSelect.LangParam + propName];
                const translated = map[template] !== undefined ? map[template] : template;
                if (parameters !== undefined && parameters !== null && parameters.length > 0) {
                    x[propName] = Str.Format(translated, parameters);
                }
                else {
                    x[propName] = translated;
                }
            });
        });
    }

    static *Travel(node) {
        yield node;
        for (const element of node.childNodes) {
            yield* this.Travel(element);
        }
    }
}
