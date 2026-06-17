export interface TitleCaseRules {
  /**
   * "title" capitalizes each significant word, lowercasing the minor words in
   * the middle (the English convention). "sentence" capitalizes only the first
   * word. Acronyms are forced uppercase under both styles; the `lowercase` list
   * is consulted only for "title".
   */
  style: "title" | "sentence";
  /**
   * Short function words (articles, conjunctions, prepositions, contractions)
   * kept lowercase in the MIDDLE of a title. Matched case-insensitively and
   * against the punctuation-stripped token, so "v" also covers "v." and "vs"
   * covers "vs.".
   */
  lowercase?: string[];
  /**
   * Acronyms / initialisms emitted in the given canonical casing (matched
   * case-insensitively, so "ceo" and "CEO" both become "CEO"). Mixed-case forms
   * ("iOS", "GmbH", "PhD") are preserved as written. Plurals ("TVs") are derived
   * automatically — so forms whose plural collides with a real word (e.g.
   * "IDE" → "ides") are intentionally omitted.
   */
  acronyms?: string[];
}

// Tech acronyms written the same way across Latin-script languages, spread into
// each non-English locale alongside its own entries. Deliberately excludes forms
// that collide with a common word in one of these languages — e.g. "API"
// (Italian "api" = bees), "RAM" (Catalan "ram" = bouquet), "ML"/"kg" (units).
const intl = [
  "TV", "CPU", "GPU", "SSD", "USB", "DVD", "GPS", "PDF", "HTML", "CSS", "XML",
  "JSON", "SQL", "HTTP", "HTTPS", "URL", "DNS", "VPN", "SDK",
];

const titleCaseLocale: Record<string, TitleCaseRules> = {
  // Fallback for languages without an explicit entry — title-cases every word
  // (no minor-word list to keep lowercase). A no-op for scripts that have no
  // letter case (Arabic "ar", Chinese "zh", Korean "ko", Punjabi "pa"), so
  // those are intentionally omitted.
  default: {style: "title"},

  en: {
    style: "title",
    lowercase: [
      "a", "amid", "an", "and", "as", "at", "atop", "but", "by", "for", "from",
      "if", "in", "into", "near", "nor", "of", "on", "onto", "or", "per", "so",
      "than", "that", "the", "till", "to", "unto", "upon", "v", "versus", "via",
      "vs", "with", "yet",
    ],
    acronyms: [
      "API", "B2B", "B2C", "CEO", "CFO", "CIA", "CIO", "CMO", "CNC", "COO",
      "CPU", "CRM", "CSS", "CTO", "DNS", "DVD", "ERP", "FAQ", "FBI", "GDP",
      "GDPR", "GNP", "GPS", "GPU", "HTML", "HTTP", "HTTPS", "HVAC", "IaaS",
      "IoT", "iOS", "JSON", "KPI", "macOS", "NASA", "PaaS", "PDF", "PhD", "PR",
      "R&D", "ROI", "SaaS", "SDK", "SQL", "SSD", "TV", "UI", "URL", "USB", "UX",
      "VP", "VPN", "XML",
    ],
  },

  // The lists below are fuller, but still collision-vetted by a non-native pass —
  // worth a native-speaker review before relying on them. Every locale
  // title-cases; its `lowercase` list keeps that language's minor words lowered
  // mid-title, and its `acronyms` are forced uppercase.

  ca: {
    style: "title",
    lowercase: [
      "a", "al", "als", "amb", "cap", "contra", "d", "de", "del", "dels", "des",
      "el", "els", "en", "entre", "fins", "i", "l", "la", "les", "ni", "o",
      "pel", "pels", "per", "però", "que", "sense", "sinó", "sobre", "sota",
      "un", "una", "unes", "uns", "vers",
    ],
    acronyms: [...intl, "API", "CEO", "PIB", "IVA", "UE", "ONU", "ONG", "ADN", "OMS", "FMI", "UNESCO"],
  },

  da: {
    style: "title",
    lowercase: [
      "af", "efter", "eller", "en", "et", "for", "fra", "før", "gennem", "hos",
      "i", "med", "mellem", "men", "mod", "og", "om", "over", "på", "samt", "så",
      "til", "uden", "under", "ved",
    ],
    acronyms: [...intl, "API", "CEO", "BNP", "EU", "FN", "NATO", "DNA", "CVR", "CPR"],
  },

  // German capitalizes all nouns by orthographic rule; title case capitalizes
  // every significant word (nouns included), lowering only these minor words.
  de: {
    style: "title",
    lowercase: [
      "aber", "an", "auf", "aus", "bei", "bis", "bzw", "das", "dem", "den",
      "denn", "der", "des", "die", "durch", "ein", "eine", "einem", "einen",
      "einer", "eines", "für", "gegen", "hinter", "in", "mit", "nach", "neben",
      "oder", "ohne", "sondern", "sowie", "über", "um", "und", "unter", "von",
      "vor", "während", "wegen", "zu", "zwischen",
    ],
    acronyms: [
      ...intl, "API", "CEO", "BIP", "GmbH", "AG", "MwSt", "USt", "EU", "UNO",
      "NATO", "KI", "EDV", "DSGVO", "AGB", "PLZ", "KFZ", "LKW", "PKW", "IBAN", "EZB",
    ],
  },

  es: {
    style: "title",
    lowercase: [
      "a", "al", "ante", "bajo", "cabe", "con", "contra", "de", "del", "desde",
      "durante", "e", "el", "en", "entre", "hacia", "hasta", "la", "las", "lo",
      "los", "mediante", "ni", "o", "para", "pero", "por", "que", "según", "sin",
      "sino", "so", "sobre", "tras", "u", "un", "una", "unas", "unos", "versus",
      "vía", "y",
    ],
    acronyms: [
      ...intl, "API", "CEO", "CFO", "COO", "PIB", "IVA", "UE", "ONU", "ONG",
      "PYME", "ADN", "OTAN", "OMS", "FMI", "IPC", "UNESCO", "UNICEF",
    ],
  },

  et: {
    style: "title",
    lowercase: ["aga", "ega", "ent", "et", "ja", "kui", "kuid", "nagu", "ning", "sest", "vaid", "või"],
    acronyms: [...intl, "API", "SKT", "EL", "ÜRO", "NATO", "DNA"],
  },

  fr: {
    style: "title",
    lowercase: [
      "à", "après", "au", "aux", "avant", "avec", "car", "chez", "comme",
      "contre", "d", "dans", "de", "depuis", "des", "donc", "du", "dès", "en",
      "entre", "envers", "et", "hors", "l", "la", "le", "les", "mais", "malgré",
      "ne", "ni", "or", "ou", "par", "parmi", "pour", "que", "qui", "sans",
      "sauf", "selon", "si", "sous", "sur", "un", "une", "vers", "via",
    ],
    acronyms: [
      ...intl, "API", "PDG", "PIB", "R&D", "UE", "ONU", "PME", "TVA", "RH",
      "SARL", "TGV", "ADN", "OTAN", "OMS", "FMI", "INSEE", "SMIC", "RGPD",
    ],
  },

  // No "API" (Italian "api" = bees) and no short note/word forms (ai, do, re,
  // la, si …) — they would clobber everyday words.
  it: {
    style: "title",
    lowercase: [
      "a", "agli", "ai", "al", "alla", "alle", "allo", "che", "coi", "col",
      "come", "con", "da", "dai", "dal", "dalla", "dei", "del", "della",
      "delle", "dello", "di", "e", "ed", "fra", "gli", "i", "il", "in", "la",
      "le", "lo", "ma", "né", "negli", "nei", "nel", "nella", "nelle", "o",
      "od", "per", "se", "su", "sugli", "sui", "sul", "sulla", "tra", "un",
      "una", "uno",
    ],
    acronyms: [...intl, "CEO", "PIL", "IVA", "UE", "ONU", "PMI", "NATO", "OMS", "FMI", "ISTAT", "SRL", "DNA"],
  },

  pt: {
    style: "title",
    lowercase: [
      "a", "à", "às", "ante", "ao", "aos", "após", "as", "até", "com", "contra",
      "da", "das", "de", "desde", "do", "dos", "e", "em", "entre", "mas", "na",
      "nas", "nem", "no", "nos", "num", "numa", "o", "os", "ou", "para", "pela",
      "pelo", "per", "perante", "por", "que", "sem", "sob", "sobre", "um",
      "uma", "via",
    ],
    acronyms: [
      ...intl, "API", "CEO", "PIB", "UE", "ONU", "EUA", "PME", "ONG", "OTAN",
      "OMS", "FMI", "IBGE", "CPF", "CNPJ",
    ],
  },

  sv: {
    style: "title",
    lowercase: [
      "av", "efter", "eller", "en", "ett", "för", "före", "från", "genom",
      "hos", "i", "med", "mellan", "men", "mot", "och", "om", "över", "på",
      "samt", "så", "till", "utan", "under", "vid",
    ],
    acronyms: [...intl, "API", "CEO", "VD", "BNP", "EU", "FN", "NATO", "DNA", "SCB"],
  },
};

export default titleCaseLocale;
