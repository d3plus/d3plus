import lcid from "./utils/lookup.js";
import iso from "./utils/iso-codes.js";

const locales = [];
const isoKeys = Object.keys(iso);

Object.keys(lcid).map(id => {
  const locale = lcid[id];
  const isoLanguage = isoKeys.find(name => name.toLowerCase() === locale.language.toLowerCase());
  if (locale.location && isoLanguage) {
    locales.push({
      ["name"]: locale.language,
      ["location"]: locale.location,
      ["tag"]: locale.tag,
      ["lcid"]: locale.id,
      ["iso639-2"]: iso[isoLanguage]["iso639-2"],
      ["iso639-1"]: iso[isoLanguage]["iso639-1"]
    });
  }
});

const defaultLocales = {
  ar: "ar-SA",
  ca: "ca-ES",
  da: "da-DK",
  en: "en-US",
  ko: "ko-KR",
  pa: "pa-IN",
  pt: "pt-BR",
  sv: "sv-SE",
  zh: "zh-CN",
};

/**
   @module inViewport
   @desc Converts a 2-digit language into a full language-LOCATION locale.
   @param {String} locale
   @private
*/
export default function(locale) {
  if (typeof locale !== "string" || locale.length === 5) return locale;
  if (defaultLocales[locale]) return defaultLocales[locale];
  const list = locales.filter(d => d["iso639-1"] === locale);
  if (!list.length) return locale;
  else if (list.length === 1) return list[0].tag;
  else if (list.find(d => d.tag === `${locale}-${locale.toUpperCase()}`)) return `${locale}-${locale.toUpperCase()}`;
  else return list[0].tag;
}
