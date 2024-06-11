import { SqlViewModel } from "../models/sqlViewModel.js";
import { Client } from "../clients/client.js";
import { Str } from "./ext.js";

export class LangSelect {
    static LangProp = "langprop";
    static LangKey = "langkey";
    static LangParam = "Para";
    static LangCode = "langcode";
    static Active = "Active";
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

    static Get(key) {
        if (key === null || key === "") {
            return "";
        }
        if (LangSelect.Culture === null) {
            return key;
        }
        const dictionary = LangSelect._dictionaries[LangSelect.Culture];
        if (dictionary === undefined || dictionary === null) {
            const tempDictionary = localStorage.getItem(LangSelect.Culture);
            if (tempDictionary !== null) {
                LangSelect._dictionaries[LangSelect.Culture] = tempDictionary;
            }
        }
        return dictionary !== null && dictionary !== undefined && dictionary[key] !== undefined ? dictionary[key] : key;
    }

    static async Translate(annonymous = true) {
        const tcs = new Promise((resolve, reject) => {
            const vm = new SqlViewModel();
            vm.DataConn = Client.MetaConn;
            vm.MetaConn = Client.MetaConn;
            vm.ComId = "Dictionary";
            vm.Action = "GetAll";
            vm.AnnonymousTenant = Client.Tenant;
            const dictionaryTask = Client.Instance.UserSvc(vm, annonymous);
            dictionaryTask.Done(items => {
                LangSelect.DictionaryLoaded(items[0].map(x => x.As()));
                resolve(true);
            });
        });
        return tcs;
    }

    static DictionaryLoaded(dictionaryItems) {
        const map = dictionaryItems.filter((x, i, arr) => arr.findIndex(y => y.Key === x.Key) === i).reduce((acc, cur) => {
            acc[cur.Key] = cur.Value;
            return acc;
        }, {});
        LangSelect._dictionaries[LangSelect.Culture] = map;
        localStorage.setItem(LangSelect.Culture, map);
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
