// Maps ISO 2-letter country codes (lowercase) → currency code
export const COUNTRY_CODE_TO_CURRENCY: Record<string, string> = {
  in: "INR",  // India
  us: "USD",  // United States
  gb: "GBP",  // United Kingdom
  uk: "GBP",  // alias
  de: "EUR",  // Germany
  fr: "EUR",  // France
  it: "EUR",  // Italy
  es: "EUR",  // Spain
  ca: "CAD",  // Canada
  au: "AUD",  // Australia
  nz: "NZD",  // New Zealand
  sg: "SGD",  // Singapore
  ae: "AED",  // United Arab Emirates
  sa: "SAR",  // Saudi Arabia
  qa: "QAR",  // Qatar
  kw: "KWD",  // Kuwait
  jp: "JPY",  // Japan
  cn: "CNY",  // China
  kr: "KRW",  // South Korea
  ru: "RUB",  // Russia
  br: "BRL",  // Brazil
  mx: "MXN",  // Mexico
  za: "ZAR",  // South Africa
  ng: "NGN",  // Nigeria
  eg: "EGP",  // Egypt
  tr: "TRY",  // Turkey
  ch: "CHF",  // Switzerland
  se: "SEK",  // Sweden
  no: "NOK",  // Norway
  dk: "DKK",  // Denmark
  pl: "PLN",  // Poland
  ua: "UAH",  // Ukraine
  id: "IDR",  // Indonesia
  th: "THB",  // Thailand
  my: "MYR",  // Malaysia
  ph: "PHP",  // Philippines
  vn: "VND",  // Vietnam
  pk: "PKR",  // Pakistan
  bd: "BDT",  // Bangladesh
  lk: "LKR",  // Sri Lanka
  np: "NPR",  // Nepal
  ar: "ARS",  // Argentina
  cl: "CLP",  // Chile
  co: "COP",  // Colombia
  pe: "PEN",  // Peru
  // Other EUR-zone
  at: "EUR", be: "EUR", nl: "EUR", pt: "EUR", fi: "EUR", ie: "EUR",
  lu: "EUR", mt: "EUR", sk: "EUR", si: "EUR", ee: "EUR", lv: "EUR", lt: "EUR",
};

// Ordered list of [pattern, currency] for free-text location input
// More specific patterns first to avoid false matches
const LOCATION_PATTERNS: [RegExp, string][] = [
  [/united\s+arab\s+emirates|uae|dubai|abu\s+dhabi/i, "AED"],
  [/united\s+states|usa|\bU\.?S\.?A\.?\b|new\s+york|los\s+angeles|chicago|houston|seattle/i, "USD"],
  [/united\s+kingdom|england|scotland|wales|london|\bU\.?K\.?\b/i, "GBP"],
  [/south\s+africa|johannesburg|cape\s+town/i, "ZAR"],
  [/south\s+korea|korea|seoul/i, "KRW"],
  [/sri\s+lanka|colombo/i, "LKR"],
  [/saudi\s+arabia|riyadh|jeddah/i, "SAR"],
  [/new\s+zealand|auckland/i, "NZD"],
  [/\bindia\b|mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata|pune/i, "INR"],
  [/\bcanada\b|toronto|vancouver|montreal/i, "CAD"],
  [/australia|sydney|melbourne|brisbane|perth/i, "AUD"],
  [/singapore/i, "SGD"],
  [/germany|berlin|munich|frankfurt/i, "EUR"],
  [/france|paris|lyon|marseille/i, "EUR"],
  [/italy|rome|milan|naples/i, "EUR"],
  [/spain|madrid|barcelona|seville/i, "EUR"],
  [/switzerland|zurich|geneva|bern/i, "CHF"],
  [/sweden|stockholm|gothenburg/i, "SEK"],
  [/norway|oslo|bergen/i, "NOK"],
  [/denmark|copenhagen/i, "DKK"],
  [/poland|warsaw|krakow/i, "PLN"],
  [/ukraine|kyiv|kharkiv/i, "UAH"],
  [/qatar|doha/i, "QAR"],
  [/kuwait/i, "KWD"],
  [/japan|tokyo|osaka/i, "JPY"],
  [/china|beijing|shanghai|shenzhen|guangzhou/i, "CNY"],
  [/russia|moscow|saint\s+petersburg/i, "RUB"],
  [/brazil|são\s+paulo|rio\s+de\s+janeiro|brasilia/i, "BRL"],
  [/mexico|mexico\s+city|guadalajara/i, "MXN"],
  [/nigeria|lagos|abuja/i, "NGN"],
  [/egypt|cairo|alexandria/i, "EGP"],
  [/turkey|istanbul|ankara/i, "TRY"],
  [/indonesia|jakarta|bali/i, "IDR"],
  [/thailand|bangkok|chiang\s+mai/i, "THB"],
  [/malaysia|kuala\s+lumpur|kl\b/i, "MYR"],
  [/philippines|manila|cebu/i, "PHP"],
  [/vietnam|hanoi|ho\s+chi\s+minh/i, "VND"],
  [/pakistan|karachi|lahore|islamabad/i, "PKR"],
  [/bangladesh|dhaka/i, "BDT"],
  [/nepal|kathmandu/i, "NPR"],
  [/argentina|buenos\s+aires/i, "ARS"],
  [/chile|santiago/i, "CLP"],
  [/colombia|bogota/i, "COP"],
  [/peru|lima/i, "PEN"],
  // Fallback EU
  [/\beurope\b|\beu\b/i, "EUR"],
];

export function getCurrencyFromLocation(location: string): string | undefined {
  for (const [pattern, currency] of LOCATION_PATTERNS) {
    if (pattern.test(location)) return currency;
  }
  return undefined;
}

// Ordered country list for registration dropdowns
export const COUNTRIES: { value: string; label: string }[] = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Switzerland", label: "Switzerland" },
  { value: "Canada", label: "Canada" },
  { value: "Australia", label: "Australia" },
  { value: "New Zealand", label: "New Zealand" },
  { value: "Singapore", label: "Singapore" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Qatar", label: "Qatar" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Japan", label: "Japan" },
  { value: "China", label: "China" },
  { value: "South Korea", label: "South Korea" },
  { value: "Russia", label: "Russia" },
  { value: "Brazil", label: "Brazil" },
  { value: "Mexico", label: "Mexico" },
  { value: "South Africa", label: "South Africa" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Egypt", label: "Egypt" },
  { value: "Turkey", label: "Turkey" },
  { value: "Sweden", label: "Sweden" },
  { value: "Norway", label: "Norway" },
  { value: "Denmark", label: "Denmark" },
  { value: "Poland", label: "Poland" },
  { value: "Ukraine", label: "Ukraine" },
  { value: "Indonesia", label: "Indonesia" },
  { value: "Thailand", label: "Thailand" },
  { value: "Malaysia", label: "Malaysia" },
  { value: "Philippines", label: "Philippines" },
  { value: "Vietnam", label: "Vietnam" },
  { value: "Pakistan", label: "Pakistan" },
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "Sri Lanka", label: "Sri Lanka" },
  { value: "Nepal", label: "Nepal" },
  { value: "Argentina", label: "Argentina" },
  { value: "Chile", label: "Chile" },
  { value: "Colombia", label: "Colombia" },
  { value: "Peru", label: "Peru" },
];
