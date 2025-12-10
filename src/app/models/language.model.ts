export const languageOptions = [
  { label: 'Arabic', code: 'ar' },
  { label: 'Czech', code: 'cs' },
  { label: 'Danish', code: 'da' },
  { label: 'Dutch', code: 'nl' },
  { label: 'English', code: 'en' },
  { label: 'Estonian', code: 'et' },
  { label: 'Finnish', code: 'fi' },
  { label: 'French', code: 'fr' },
  { label: 'German', code: 'de' },
  { label: 'Greek', code: 'el' },
  { label: 'Hebrew', code: 'he' },
  { label: 'Hungarian', code: 'hu' },
  { label: 'Icelandic', code: 'is' },
  { label: 'Italian', code: 'it' },
  { label: 'Latin', code: 'la' },
  { label: 'Latvian', code: 'lv' },
  { label: 'Lithuanian', code: 'lt' },
  { label: 'Norwegian', code: 'no' },
  { label: 'Polish', code: 'pl' },
  { label: 'Portuguese', code: 'pt' },
  { label: 'Russian', code: 'ru' },
  { label: 'Spanish', code: 'es' },
  { label: 'Swedish', code: 'sv' },
] as const;

// each element type
export type LanguageObj = (typeof languageOptions)[number];

// union of codes: 'ar' | 'cs' | ... | 'sv'
export type LanguageCode = LanguageObj['code'];

// union of labels: 'Arabic' | 'Czech' | ... | 'Swedish'
export type LanguageLabel = LanguageObj['label'];

export const noneLanguageOption = {
  label: 'None',
  code: null,
} as const;

export type NoneLanguageObj = typeof noneLanguageOption;

// union for when “none” is allowed:
export type LanguageObjWithNone = LanguageObj | NoneLanguageObj;

export type LanguageCodeWithNone = LanguageCode | null;

// a list with all the languages + "None"/null as an option
export const languageOptionsWithNone: LanguageObjWithNone[] = [
  noneLanguageOption,
  ...languageOptions,
];
